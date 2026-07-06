"""Offline demo connector.

Reads a bundled JSON dataset and filters it by the parsed query. This makes
the whole agent runnable with zero configuration, and doubles as fixture
data for tests. It is always enabled.
"""

from __future__ import annotations

import json
import os

from ..models import Contact, SearchQuery, Specialist
from .base import Connector

_DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "data",
    "demo_specialists.json",
)


class DemoConnector(Connector):
    name = "demo"
    label = "دیتای نمونه (آفلاین)"

    def __init__(self, data_path: str = _DATA_PATH):
        self._data_path = data_path
        self._cache: list[Specialist] | None = None

    def is_enabled(self) -> bool:
        return os.path.exists(self._data_path)

    def _load(self) -> list[Specialist]:
        if self._cache is not None:
            return self._cache
        with open(self._data_path, encoding="utf-8") as fh:
            raw = json.load(fh)
        people: list[Specialist] = []
        for item in raw:
            contact = Contact(**item.get("contact", {}))
            data = {k: v for k, v in item.items() if k != "contact"}
            people.append(Specialist(contact=contact, source=self.name, **data))
        self._cache = people
        return people

    def search(self, query: SearchQuery) -> list[Specialist]:
        results = []
        for person in self._load():
            if query.role and person.role and person.role != query.role:
                continue
            results.append(person)
        return results
