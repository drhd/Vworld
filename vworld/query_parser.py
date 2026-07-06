"""Turn a free-text request into a structured :class:`SearchQuery`.

Two layers:

1. A fast, offline, dictionary-based parser (`parse`) that understands the
   Persian/English vocabulary in :mod:`vworld.taxonomy`. It always runs and
   needs no network or API key.
2. An optional LLM enhancement (`enhance_with_llm`) that fills in anything
   the heuristic parser missed. It is only used when a Claude API key is
   configured, and it degrades gracefully to the heuristic result.
"""

from __future__ import annotations

import re
import unicodedata

from .models import SearchQuery
from .taxonomy import (
    CITIES,
    PLATFORM_KEYWORDS,
    ROLE_TAXONOMY,
    SENIORITY_KEYWORDS,
)

# Arabic/Persian character normalisation so "ي"/"ی" and "ك"/"ک" match.
_NORMALIZE = {
    "ي": "ی",
    "ك": "ک",
    "ٱ": "ا",
    "أ": "ا",
    "إ": "ا",
    "ة": "ه",
    "ؤ": "و",
    "‌": " ",  # zero-width non-joiner -> space
}


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    for a, b in _NORMALIZE.items():
        text = text.replace(a, b)
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()


def _find_first(haystack: str, table: dict[str, tuple[str, list[str]]]):
    """Return (key, label) for the first table entry whose synonym appears.

    Longer synonyms are checked first so "طراح گرافیک" wins over "طراح".
    """
    best_key = ""
    best_label = ""
    best_len = -1
    for key, (label, synonyms) in table.items():
        for syn in synonyms:
            syn_n = normalize(syn)
            if syn_n and syn_n in haystack and len(syn_n) > best_len:
                best_key, best_label, best_len = key, label, len(syn_n)
    return best_key, best_label


def parse(text: str, limit: int = 10) -> SearchQuery:
    """Heuristic, offline parse of a request into a :class:`SearchQuery`."""
    norm = normalize(text)

    role, role_label = _find_first(norm, ROLE_TAXONOMY)
    location, location_label = _find_first(norm, CITIES)

    platforms: list[str] = []
    for platform, kws in PLATFORM_KEYWORDS.items():
        if any(normalize(k) in norm for k in kws):
            platforms.append(platform)

    seniority = ""
    for level, kws in SENIORITY_KEYWORDS.items():
        if any(normalize(k) in norm for k in kws):
            seniority = level
            break

    # remote / on-site hint
    remote_ok = True
    if any(w in norm for w in ["حضوری", "حضورا", "on-site", "onsite"]):
        remote_ok = False

    # leftover meaningful words become extra keywords for connectors
    stop = _stopwords()
    keywords = [
        w for w in re.findall(r"[\w‌]+", norm)
        if len(w) > 2 and w not in stop and not w.isdigit()
    ]

    return SearchQuery(
        raw_text=text,
        role=role,
        role_label=role_label,
        location=location,
        location_label=location_label,
        keywords=keywords[:8],
        platforms=platforms,
        seniority=seniority,
        remote_ok=remote_ok,
        limit=limit,
    )


def _stopwords() -> set[str]:
    words = {
        "میخوام", "میخام", "میخواهم", "یه", "یک", "برام", "برای", "تو", "در",
        "که", "را", "رو", "با", "از", "به", "هم", "این", "اون", "می", "خوام",
        "کن", "کنه", "بده", "بهم", "لیست", "پیدا", "لطفا", "want", "need", "find",
        "the", "and", "for", "with", "please", "give", "list", "some", "someone",
        "دنبال", "میگردم", "متخصص", "adam", "ادم", "ادمهای", "ادم‌های",
    }
    return {normalize(w) for w in words}


# ---------------------------------------------------------------------------
# Optional LLM enhancement
# ---------------------------------------------------------------------------

def enhance_with_llm(query: SearchQuery, llm) -> SearchQuery:
    """Ask the LLM to fill gaps the heuristic parser left (best effort).

    `llm` is a :class:`vworld.llm.LLM`. If it is disabled or errors, the
    original query is returned unchanged.
    """
    if llm is None or not llm.is_enabled():
        return query
    # only bother the model if something important is missing
    if query.role and query.location:
        return query

    prompt = (
        "کاربر دنبال یک متخصص می‌گردد. از متن زیر، نقش شغلی، شهر، و پلتفرم‌های "
        "مورد نظر را استخراج کن و فقط یک JSON با کلیدهای "
        '"role_label", "location_label", "platforms" (آرایه) برگردان. '
        "اگر چیزی مشخص نبود، رشته خالی بگذار.\n\n"
        f"متن: {query.raw_text}"
    )
    try:
        data = llm.json(prompt)
    except Exception:
        return query
    if not isinstance(data, dict):
        return query

    if not query.role_label and data.get("role_label"):
        query.role_label = str(data["role_label"]).strip()
    if not query.location_label and data.get("location_label"):
        query.location_label = str(data["location_label"]).strip()
    if not query.platforms and isinstance(data.get("platforms"), list):
        query.platforms = [str(p).strip().lower() for p in data["platforms"] if p]
    return query
