"""Generic web-search connector.

Finds specialists across the open web (personal sites, directories,
portfolios) via SerpAPI's Google engine when SERPAPI_KEY is set. Contact
details are extracted heuristically from result snippets.

Disabled and returns nothing without a key.
"""

from __future__ import annotations

import json
import os
import re
import urllib.parse
import urllib.request

from ..models import Contact, SearchQuery, Specialist
from .base import Connector

_EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
_PHONE_RE = re.compile(r"(?:\+?98|0)?9\d{9}")


class WebSearchConnector(Connector):
    name = "web"
    label = "جستجوی وب"

    def __init__(self):
        self.serpapi_key = os.getenv("SERPAPI_KEY", "")

    def is_enabled(self) -> bool:
        return bool(self.serpapi_key)

    def disabled_reason(self) -> str:
        return "برای فعال‌سازی SERPAPI_KEY را تنظیم کنید"

    def search(self, query: SearchQuery) -> list[Specialist]:
        terms = " ".join(
            filter(None, [query.role_label, query.location_label, "تماس"])
        )
        if not terms.strip():
            return []
        params = {
            "engine": "google",
            "q": terms,
            "num": str(query.limit),
            "api_key": self.serpapi_key,
        }
        url = "https://serpapi.com/search.json?" + urllib.parse.urlencode(params)
        with urllib.request.urlopen(url, timeout=20) as resp:
            data = json.load(resp)

        results: list[Specialist] = []
        for item in data.get("organic_results", [])[: query.limit]:
            snippet = item.get("snippet", "")
            link = item.get("link", "")
            emails = _EMAIL_RE.findall(snippet)
            phones = _PHONE_RE.findall(snippet)
            results.append(
                Specialist(
                    name=item.get("title", link),
                    role=query.role,
                    role_label=query.role_label,
                    location_label=query.location_label,
                    platform="web",
                    profile_url=link,
                    bio=snippet,
                    contact=Contact(
                        website=link,
                        email=emails[0] if emails else "",
                        phone=phones[0] if phones else "",
                    ),
                    source=self.name,
                    evidence=f"نتیجه جستجوی وب برای «{terms}»",
                )
            )
        return results
