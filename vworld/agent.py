"""The orchestrator that ties everything together.

Pipeline:
    text  ->  parse (+ optional LLM)  ->  fan out to enabled connectors
          ->  merge & de-duplicate  ->  rank  ->  (optional) LLM summary
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from . import query_parser
from .connectors import build_default_connectors
from .connectors.base import Connector
from .llm import LLM
from .models import SearchQuery, Specialist
from .ranking import rank

log = logging.getLogger("vworld")


@dataclass
class SearchResult:
    query: SearchQuery
    people: list[Specialist]
    active_sources: list[str] = field(default_factory=list)
    summary: str = ""


class SpecialistFinderAgent:
    """Find specialists across every enabled platform."""

    def __init__(
        self,
        connectors: list[Connector] | None = None,
        llm: LLM | None = None,
        use_llm: bool = True,
    ):
        self.connectors = connectors if connectors is not None else build_default_connectors()
        self.llm = llm if llm is not None else (LLM() if use_llm else None)

    # ------------------------------------------------------------------ API
    def active_sources(self) -> list[str]:
        return [c.name for c in self.connectors if c.is_enabled()]

    def source_status(self) -> list[tuple[str, str, bool, str]]:
        """(name, label, enabled, reason) for each connector — for UIs/CLI."""
        out = []
        for c in self.connectors:
            enabled = c.is_enabled()
            out.append((c.name, c.label, enabled, "" if enabled else c.disabled_reason()))
        return out

    def search(self, text: str, limit: int = 10) -> SearchResult:
        query = query_parser.parse(text, limit=limit)
        query = query_parser.enhance_with_llm(query, self.llm)

        # if the LLM filled in labels, re-resolve them to canonical keys
        query = self._recanonicalize(query)

        people = self._gather(query)
        people = self._dedupe(people)
        people = rank(people, query)[:limit]

        summary = ""
        if self.llm and self.llm.is_enabled():
            summary = self.llm.summarize(query, people)

        return SearchResult(
            query=query,
            people=people,
            active_sources=[c.name for c in self._enabled_connectors(query)],
            summary=summary,
        )

    # -------------------------------------------------------------- internal
    def _enabled_connectors(self, query: SearchQuery) -> list[Connector]:
        wanted = set(query.platforms or [])
        result = []
        for c in self.connectors:
            if not c.is_enabled():
                continue
            # if the user named platforms, honour them (demo always runs as
            # a fallback so there is always some output)
            if wanted and c.name not in wanted and c.name != "demo":
                continue
            result.append(c)
        return result

    def _gather(self, query: SearchQuery) -> list[Specialist]:
        people: list[Specialist] = []
        for connector in self._enabled_connectors(query):
            found = connector.safe_search(query)
            log.info("connector %s -> %d results", connector.name, len(found))
            people.extend(found)
        return people

    @staticmethod
    def _dedupe(people: list[Specialist]) -> list[Specialist]:
        seen: dict[str, Specialist] = {}
        for p in people:
            key = p.identity()
            if key not in seen:
                seen[key] = p
            else:
                # keep the richer record, merge contact channels
                existing = seen[key]
                if len(p.contact.channels()) > len(existing.contact.channels()):
                    seen[key] = p
        return list(seen.values())

    @staticmethod
    def _recanonicalize(query: SearchQuery) -> SearchQuery:
        """After LLM enhancement, map any new human labels back to canonical
        keys so ranking/filtering by role and city still work."""
        from .taxonomy import CITIES, ROLE_TAXONOMY

        if query.role_label and not query.role:
            for key, (label, _syn) in ROLE_TAXONOMY.items():
                if query_parser.normalize(label) == query_parser.normalize(query.role_label):
                    query.role = key
                    break
        if query.location_label and not query.location:
            for key, (label, _syn) in CITIES.items():
                if query_parser.normalize(label) == query_parser.normalize(query.location_label):
                    query.location = key
                    break
        return query
