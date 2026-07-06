"""Platform connectors.

Each connector knows how to search one platform (Telegram, Instagram,
LinkedIn, web search, …) and returns a list of :class:`Specialist`.

A connector is *enabled* only when its required credentials are present in
the environment. The :func:`build_default_connectors` factory wires up all
known connectors; disabled ones simply return no results, so the agent
works out of the box (via the always-on demo connector) and lights up more
sources as you add API keys.
"""

from __future__ import annotations

from .base import Connector
from .demo import DemoConnector
from .telegram import TelegramConnector
from .instagram import InstagramConnector
from .linkedin import LinkedInConnector
from .websearch import WebSearchConnector


def build_default_connectors() -> list[Connector]:
    """Instantiate every known connector. Disabled ones are still listed so
    the agent can report which sources are active."""
    return [
        DemoConnector(),
        TelegramConnector(),
        InstagramConnector(),
        LinkedInConnector(),
        WebSearchConnector(),
    ]


__all__ = [
    "Connector",
    "DemoConnector",
    "TelegramConnector",
    "InstagramConnector",
    "LinkedInConnector",
    "WebSearchConnector",
    "build_default_connectors",
]
