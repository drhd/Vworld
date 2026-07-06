"""Render results for humans (Persian) and for machines (JSON-ready dicts)."""

from __future__ import annotations

from .models import SearchQuery, Specialist

_PLATFORM_LABELS = {
    "telegram": "تلگرام",
    "instagram": "اینستاگرام",
    "linkedin": "لینکدین",
    "web": "وب",
    "demo": "نمونه",
}


def format_query(query: SearchQuery) -> str:
    parts = []
    parts.append(f"🔎 نقش: {query.role_label or '— (نامشخص)'}")
    parts.append(f"📍 مکان: {query.location_label or '— (همه‌جا)'}")
    if query.platforms:
        parts.append("🌐 پلتفرم‌ها: " + "، ".join(
            _PLATFORM_LABELS.get(p, p) for p in query.platforms))
    if query.seniority:
        parts.append(f"⭐ سطح: {query.seniority}")
    return "  |  ".join(parts)


def format_person_short(person: Specialist, index: int) -> str:
    """A one-block summary of a person for a results list."""
    lines = [f"{index}. {person.name}  ({person.role_label or person.role})"]
    meta = []
    if person.location_label:
        meta.append("📍 " + person.location_label)
    meta.append("🌐 " + _PLATFORM_LABELS.get(person.platform, person.platform))
    if person.rating:
        meta.append(f"⭐ {person.rating}")
    if person.followers:
        meta.append(f"👥 {_fmt_count(person.followers)}")
    lines.append("   " + "  ".join(meta))
    if person.bio:
        lines.append("   " + person.bio)

    channels = person.contact.channels()
    if channels:
        lines.append("   ☎️ راه ارتباط: " + "، ".join(
            f"{label}: {value}" for label, value in channels))
    if person.portfolio_url:
        lines.append("   🎨 نمونه‌کار: " + person.portfolio_url)
    if person.evidence:
        lines.append("   💡 چرا: " + person.evidence)
    return "\n".join(lines)


def format_results(query: SearchQuery, people: list[Specialist],
                   active_sources: list[str] | None = None) -> str:
    header = ["=" * 60, format_query(query), "=" * 60]
    if not people:
        header.append(
            "\nهیچ متخصصی پیدا نشد. نقش یا شهر را دقیق‌تر بنویسید، یا کلید "
            "API پلتفرم‌ها را تنظیم کنید تا منابع بیشتری فعال شود."
        )
        return "\n".join(header)

    header.append(f"\n✅ {len(people)} نتیجه پیدا شد:\n")
    blocks = [format_person_short(p, i + 1) for i, p in enumerate(people)]
    body = "\n\n".join(blocks)

    footer = ""
    if active_sources:
        footer = "\n\n" + "-" * 60 + "\nمنابع فعال: " + "، ".join(
            _PLATFORM_LABELS.get(s, s) for s in active_sources)
    return "\n".join(header) + body + footer


def _fmt_count(n: int) -> str:
    if n >= 1000:
        return f"{n/1000:.1f}k".replace(".0k", "k")
    return str(n)


def results_to_dict(query: SearchQuery, people: list[Specialist]) -> dict:
    return {
        "query": query.to_dict(),
        "count": len(people),
        "results": [p.to_dict() for p in people],
    }
