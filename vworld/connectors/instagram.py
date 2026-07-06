"""Instagram connector.

Searches Instagram business/creator accounts. Two supported back-ends:

1. Official Instagram Graph API (recommended, ToS-compliant) via a
   long-lived access token — set INSTAGRAM_ACCESS_TOKEN. Note the Graph API
   only exposes a limited hashtag/business-discovery surface.
2. instagrapi (unofficial) via INSTAGRAM_USERNAME / INSTAGRAM_PASSWORD, used
   only when the Graph token is absent. Unofficial access may violate
   Instagram's ToS and risks account limits — use at your own discretion.

Disabled and returns nothing when no credentials are configured.
"""

from __future__ import annotations

import os

from ..models import Contact, SearchQuery, Specialist
from .base import Connector


class InstagramConnector(Connector):
    name = "instagram"
    label = "اینستاگرام"

    def __init__(self):
        self.access_token = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
        self.username = os.getenv("INSTAGRAM_USERNAME", "")
        self.password = os.getenv("INSTAGRAM_PASSWORD", "")

    def is_enabled(self) -> bool:
        return bool(self.access_token or (self.username and self.password))

    def disabled_reason(self) -> str:
        return (
            "برای فعال‌سازی INSTAGRAM_ACCESS_TOKEN (رسمی) یا "
            "INSTAGRAM_USERNAME/PASSWORD را تنظیم کنید"
        )

    def search(self, query: SearchQuery) -> list[Specialist]:
        if self.username and self.password and not self.access_token:
            return self._search_instagrapi(query)
        # Graph API path is intentionally left as a documented stub because it
        # requires a reviewed business app; return nothing rather than guess.
        return []

    def _search_instagrapi(self, query: SearchQuery) -> list[Specialist]:
        try:
            from instagrapi import Client
        except ImportError:
            return []

        keyword = " ".join(filter(None, [query.role_label, query.location_label]))
        if not keyword:
            return []

        cl = Client()
        cl.login(self.username, self.password)

        results: list[Specialist] = []
        for user in cl.search_users(keyword, amount=query.limit):
            info = cl.user_info(user.pk)
            results.append(
                Specialist(
                    name=info.full_name or info.username,
                    role=query.role,
                    role_label=query.role_label,
                    location_label=query.location_label,
                    platform="instagram",
                    handle="@" + info.username,
                    profile_url=f"https://instagram.com/{info.username}",
                    bio=info.biography or "",
                    followers=info.follower_count,
                    contact=Contact(
                        instagram="@" + info.username,
                        website=str(info.external_url or ""),
                    ),
                    source=self.name,
                    evidence=f"جستجوی اینستاگرام برای «{keyword}»",
                )
            )
        return results
