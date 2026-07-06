"""Data models shared across the agent.

These are plain dataclasses so they serialize cleanly to JSON and are easy
to test. All user-facing labels are kept in Persian where relevant, while
field names stay in English for code clarity.
"""

from __future__ import annotations

import dataclasses
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Contact:
    """How to reach a specialist. Any field may be empty."""

    telegram: str = ""          # @handle or t.me link
    instagram: str = ""         # @handle or instagram.com link
    linkedin: str = ""          # profile URL
    phone: str = ""             # phone / WhatsApp number
    email: str = ""
    website: str = ""
    other: dict[str, str] = field(default_factory=dict)

    def channels(self) -> list[tuple[str, str]]:
        """Return non-empty contact channels as (label, value) pairs."""
        pairs: list[tuple[str, str]] = []
        if self.telegram:
            pairs.append(("تلگرام", self.telegram))
        if self.instagram:
            pairs.append(("اینستاگرام", self.instagram))
        if self.linkedin:
            pairs.append(("لینکدین", self.linkedin))
        if self.phone:
            pairs.append(("تلفن/واتساپ", self.phone))
        if self.email:
            pairs.append(("ایمیل", self.email))
        if self.website:
            pairs.append(("وبسایت", self.website))
        for k, v in self.other.items():
            if v:
                pairs.append((k, v))
        return pairs

    def is_reachable(self) -> bool:
        return bool(self.channels())


@dataclass
class SearchQuery:
    """A parsed search request."""

    raw_text: str = ""
    role: str = ""              # canonical role key, e.g. "graphic_designer"
    role_label: str = ""        # human label, e.g. "طراح گرافیک"
    location: str = ""          # canonical city key, e.g. "sari"
    location_label: str = ""    # human label, e.g. "ساری"
    keywords: list[str] = field(default_factory=list)
    platforms: list[str] = field(default_factory=list)  # empty == all enabled
    seniority: str = ""         # junior | mid | senior | ""
    remote_ok: bool = True
    limit: int = 10

    def to_dict(self) -> dict[str, Any]:
        return dataclasses.asdict(self)


@dataclass
class Specialist:
    """A person the agent found."""

    name: str
    role: str = ""              # canonical role key
    role_label: str = ""        # human label
    location_label: str = ""    # human city label
    platform: str = ""          # where they were found: telegram/instagram/...
    handle: str = ""            # primary handle on that platform
    profile_url: str = ""
    bio: str = ""
    skills: list[str] = field(default_factory=list)
    portfolio_url: str = ""
    rating: float | None = None
    followers: int | None = None
    contact: Contact = field(default_factory=Contact)
    source: str = ""            # which connector produced this
    evidence: str = ""          # why this person matched (short note)
    score: float = 0.0          # ranking score, filled by the agent

    # a stable identity used for de-duplication across connectors
    def identity(self) -> str:
        if self.contact.telegram:
            return "tg:" + self.contact.telegram.lower().lstrip("@")
        if self.contact.instagram:
            return "ig:" + self.contact.instagram.lower().lstrip("@")
        if self.contact.linkedin:
            return "li:" + self.contact.linkedin.lower()
        if self.contact.phone:
            return "ph:" + "".join(ch for ch in self.contact.phone if ch.isdigit())
        return "name:" + self.name.strip().lower()

    def to_dict(self) -> dict[str, Any]:
        return dataclasses.asdict(self)
