"""Telegram bot interface.

Lets people chat with the agent from Telegram: they send a request like
«طراح گرافیک میخوام تو ساری» and get a formatted shortlist back.

Run it with:

    TELEGRAM_BOT_TOKEN=... python -m vworld.bot

Requires the `python-telegram-bot` package (v20+). This is separate from the
Telegram *connector* (which searches Telegram) — this is the chat front-end.
"""

from __future__ import annotations

import logging
import os

from .agent import SpecialistFinderAgent
from .formatter import format_results

log = logging.getLogger("vworld.bot")

WELCOME = (
    "سلام! 👋 من ایجنت پیدا کردن متخصص هستم.\n\n"
    "کافیه بنویسی چه متخصصی می‌خوای و کجا. مثلاً:\n"
    "• طراح گرافیک میخوام تو ساری\n"
    "• دیجیتال مارکتر میخوام\n"
    "• برنامه‌نویس وب ریموت\n\n"
    "من تو تلگرام، اینستاگرام، لینکدین و وب می‌گردم و راه ارتباط باهاشون رو بهت می‌دم."
)


def build_application(token: str, agent: SpecialistFinderAgent):
    from telegram import Update
    from telegram.ext import (
        Application,
        CommandHandler,
        ContextTypes,
        MessageHandler,
        filters,
    )

    async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(WELCOME)

    async def sources(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        lines = ["وضعیت منابع:"]
        for name, label, enabled, reason in agent.source_status():
            mark = "✅" if enabled else "⚪"
            lines.append(f"{mark} {label}" + (f" — {reason}" if reason else ""))
        await update.message.reply_text("\n".join(lines))

    async def handle(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        text = (update.message.text or "").strip()
        if not text:
            return
        await ctx.bot.send_chat_action(update.effective_chat.id, "typing")
        result = agent.search(text, limit=8)
        reply = format_results(result.query, result.people, result.active_sources)
        if result.summary:
            reply += "\n\n💬 " + result.summary
        # Telegram messages cap at 4096 chars
        for chunk in _chunk(reply, 4000):
            await update.message.reply_text(chunk, disable_web_page_preview=True)

    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("sources", sources))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle))
    return app


def _chunk(text: str, size: int):
    for i in range(0, len(text), size):
        yield text[i : i + size]


def main() -> int:
    logging.basicConfig(level=logging.INFO)
    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    if not token:
        print("TELEGRAM_BOT_TOKEN تنظیم نشده است.")
        return 1
    try:
        import telegram  # noqa: F401
    except ImportError:
        print("بسته python-telegram-bot نصب نیست. با pip install python-telegram-bot نصب کنید.")
        return 1

    agent = SpecialistFinderAgent()
    app = build_application(token, agent)
    log.info("Vworld bot is running…")
    app.run_polling()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
