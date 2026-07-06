"""Thin optional wrapper around the Claude (Anthropic) API.

Used for two best-effort enhancements:
  * smarter query parsing when the heuristic parser is unsure, and
  * a short natural-language summary of the results.

It is fully optional: without ANTHROPIC_API_KEY (or the anthropic package)
the agent runs entirely offline. All methods degrade gracefully.
"""

from __future__ import annotations

import json
import os
import re


class LLM:
    def __init__(self, model: str | None = None):
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.model = model or os.getenv("VWORLD_MODEL", "claude-sonnet-5")
        self._client = None
        if self.api_key:
            try:
                import anthropic

                self._client = anthropic.Anthropic(api_key=self.api_key)
            except ImportError:
                self._client = None

    def is_enabled(self) -> bool:
        return self._client is not None

    def text(self, prompt: str, max_tokens: int = 500) -> str:
        if not self.is_enabled():
            return ""
        msg = self._client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(
            block.text for block in msg.content if getattr(block, "type", "") == "text"
        )

    def json(self, prompt: str, max_tokens: int = 400):
        """Call the model and parse the first JSON object in its reply."""
        raw = self.text(prompt + "\n\nفقط JSON خالص برگردان.", max_tokens)
        if not raw:
            return None
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None

    def summarize(self, query, people) -> str:
        """One short paragraph advising the user on the shortlist."""
        if not self.is_enabled() or not people:
            return ""
        top = [
            {
                "name": p.name,
                "role": p.role_label,
                "location": p.location_label,
                "platform": p.platform,
                "rating": p.rating,
            }
            for p in people[:5]
        ]
        prompt = (
            "کاربر دنبال این بوده: "
            f"«{query.raw_text}». این‌ها بهترین گزینه‌های پیداشده هستند:\n"
            f"{json.dumps(top, ensure_ascii=False)}\n\n"
            "در حداکثر ۳ جمله فارسی، خلاصه‌ای بده که کدام گزینه برای چه شرایطی "
            "مناسب‌تر است و توصیه‌ات چیست."
        )
        try:
            return self.text(prompt, max_tokens=300).strip()
        except Exception:
            return ""
