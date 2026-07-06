"""Connector base class."""

from __future__ import annotations

import abc

from ..models import SearchQuery, Specialist


class Connector(abc.ABC):
    """A source of specialists (one platform)."""

    #: short machine name, e.g. "telegram"
    name: str = "base"
    #: human label shown to users
    label: str = "پایه"

    @abc.abstractmethod
    def is_enabled(self) -> bool:
        """True when this connector has what it needs to run (creds, etc.)."""

    @abc.abstractmethod
    def search(self, query: SearchQuery) -> list[Specialist]:
        """Return specialists matching the query. Must not raise; on failure
        return an empty list (the agent logs and continues)."""

    # helper so subclasses don't repeat the try/except boilerplate
    def safe_search(self, query: SearchQuery) -> list[Specialist]:
        if not self.is_enabled():
            return []
        try:
            results = self.search(query) or []
        except Exception as exc:  # pragma: no cover - defensive
            import logging

            logging.getLogger("vworld").warning(
                "connector %s failed: %s", self.name, exc
            )
            return []
        for r in results:
            if not r.source:
                r.source = self.name
        return results

    def disabled_reason(self) -> str:
        """Human hint about why the connector is off (missing env var …)."""
        return "غیرفعال"
