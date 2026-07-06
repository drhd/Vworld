"""LinkedIn connector.

LinkedIn has no public people-search API, so the compliant way to find
specialists is a search provider that indexes public LinkedIn profiles.
This connector uses SerpAPI's Google engine scoped to linkedin.com/in when
SERPAPI_KEY is set (also shared with the web-search connector).

Disabled and returns nothing without a key.
"""

from __future__ import annotations

import os
import urllib.parse
import urllib.request
import json

from ..models import Contact, SearchQuery, Specialist
from .base import Connector


class LinkedInConnector(Connector):
    name = "linkedin"
    label = "لینکدین"

    def __init__(self):
        self.serpapi_key = os.getenv("SERPAPI_KEY", "")

    def is_enabled(self) -> bool:
        return bool(self.serpapi_key)

    def disabled_reason(self) -> str:
        return "برای فعال‌سازی SERPAPI_KEY را تنظیم کنید"

    def search(self, query: SearchQuery) -> list[Specialist]:
        terms = " ".join(filter(None, [query.role_label, query.location_label]))
        if not terms:
            return []
        q = f'site:linkedin.com/in {terms}'
        params = {
            "engine": "google",
            "q": q,
            "num": str(query.limit),
            "api_key": self.serpapi_key,
        }
        url = "https://serpapi.com/search.json?" + urllib.parse.urlencode(params)
        with urllib.request.urlopen(url, timeout=20) as resp:
            data = json.load(resp)

        results: list[Specialist] = []
        for item in data.get("organic_results", [])[: query.limit]:
            link = item.get("link", "")
            if "linkedin.com/in" not in link:
                continue
            title = item.get("title", "")
            name = title.split(" - ")[0].split(" | ")[0].strip()
            results.append(
                Specialist(
                    name=name or title,
                    role=query.role,
                    role_label=query.role_label,
                    location_label=query.location_label,
                    platform="linkedin",
                    handle=link.rstrip("/").split("/")[-1],
                    profile_url=link,
                    bio=item.get("snippet", ""),
                    contact=Contact(linkedin=link),
                    source=self.name,
                    evidence=f"نتیجه جستجوی عمومی لینکدین برای «{terms}»",
                )
            )
        return results
