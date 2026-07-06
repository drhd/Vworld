"""Telegram connector.

Searches public Telegram channels/groups for specialists. Uses Telethon
(a Telegram client library) when API credentials are present.

Enable it by setting these environment variables and installing telethon:

    TELEGRAM_API_ID=...
    TELEGRAM_API_HASH=...
    TELEGRAM_SESSION=...        # a StringSession (optional; created on first login)

Without credentials the connector is disabled and returns nothing, so the
agent keeps working via the other sources.

Note on ethics/ToS: only public content is queried, and results are people
who publicly advertise their services. Respect Telegram's Terms of Service
and rate limits.
"""

from __future__ import annotations

import os

from ..models import Contact, SearchQuery, Specialist
from .base import Connector


class TelegramConnector(Connector):
    name = "telegram"
    label = "تلگرام"

    def __init__(self):
        self.api_id = os.getenv("TELEGRAM_API_ID", "")
        self.api_hash = os.getenv("TELEGRAM_API_HASH", "")
        self.session = os.getenv("TELEGRAM_SESSION", "")

    def is_enabled(self) -> bool:
        return bool(self.api_id and self.api_hash)

    def disabled_reason(self) -> str:
        return "برای فعال‌سازی TELEGRAM_API_ID و TELEGRAM_API_HASH را تنظیم کنید"

    def search(self, query: SearchQuery) -> list[Specialist]:
        try:
            from telethon.sync import TelegramClient
            from telethon.sessions import StringSession
            from telethon.tl.functions.contacts import SearchRequest
        except ImportError:
            # library not installed -> behave as disabled
            return []

        terms = " ".join(filter(None, [query.role_label, query.location_label]))
        if not terms:
            return []

        results: list[Specialist] = []
        session = StringSession(self.session) if self.session else StringSession()
        with TelegramClient(session, int(self.api_id), self.api_hash) as client:
            found = client(SearchRequest(q=terms, limit=query.limit))
            for chat in getattr(found, "chats", []):
                username = getattr(chat, "username", None)
                if not username:
                    continue
                title = getattr(chat, "title", username)
                results.append(
                    Specialist(
                        name=title,
                        role=query.role,
                        role_label=query.role_label,
                        location_label=query.location_label,
                        platform="telegram",
                        handle="@" + username,
                        profile_url=f"https://t.me/{username}",
                        bio=terms,
                        contact=Contact(telegram="@" + username),
                        source=self.name,
                        evidence=f"نتیجه جستجوی عمومی تلگرام برای «{terms}»",
                    )
                )
        return results
