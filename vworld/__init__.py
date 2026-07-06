"""Vworld — ایجنت پیدا کردن متخصص در پلتفرم‌های مختلف.

Vworld is a specialist-finder agent. Give it a natural-language request
(in Persian or English) such as «طراح گرافیک میخوام تو ساری» and it will
search across the configured platforms (Telegram, Instagram, LinkedIn,
web search, …), rank the people it finds, and return them with contact
details and directions on how to reach them.
"""

from .models import SearchQuery, Specialist, Contact
from .agent import SpecialistFinderAgent

__all__ = [
    "SearchQuery",
    "Specialist",
    "Contact",
    "SpecialistFinderAgent",
]

__version__ = "0.1.0"
