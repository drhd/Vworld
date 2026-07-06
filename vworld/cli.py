"""Command-line interface for Vworld.

Examples:
    python -m vworld "طراح گرافیک میخوام تو ساری"
    python -m vworld "دیجیتال مارکتر میخوام" --json
    python -m vworld --sources        # show which platforms are active
"""

from __future__ import annotations

import argparse
import json
import sys

from .agent import SpecialistFinderAgent
from .formatter import format_results, results_to_dict


def _print_sources(agent: SpecialistFinderAgent) -> None:
    print("وضعیت منابع (پلتفرم‌ها):\n")
    for name, label, enabled, reason in agent.source_status():
        mark = "✅ فعال" if enabled else "⚪ غیرفعال"
        line = f"  {mark}  {label}  ({name})"
        if not enabled and reason:
            line += f"\n           ↳ {reason}"
        print(line)


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="vworld",
        description="ایجنت پیدا کردن متخصص در تلگرام، اینستاگرام، لینکدین و وب",
    )
    p.add_argument("request", nargs="*", help="درخواست به زبان طبیعی، مثل: طراح گرافیک تو ساری")
    p.add_argument("--limit", type=int, default=10, help="حداکثر تعداد نتایج")
    p.add_argument("--json", action="store_true", help="خروجی JSON")
    p.add_argument("--no-llm", action="store_true", help="غیرفعال کردن استفاده از LLM")
    p.add_argument("--sources", action="store_true", help="نمایش وضعیت پلتفرم‌ها و خروج")
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    agent = SpecialistFinderAgent(use_llm=not args.no_llm)

    if args.sources:
        _print_sources(agent)
        return 0

    text = " ".join(args.request).strip()
    if not text:
        text = input("چه متخصصی می‌خوای؟ ").strip()
    if not text:
        print("درخواستی وارد نشد.", file=sys.stderr)
        return 1

    result = agent.search(text, limit=args.limit)

    if args.json:
        payload = results_to_dict(result.query, result.people)
        payload["active_sources"] = result.active_sources
        payload["summary"] = result.summary
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0

    print(format_results(result.query, result.people, result.active_sources))
    if result.summary:
        print("\n💬 جمع‌بندی هوشمند:\n" + result.summary)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
