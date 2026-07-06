"""Score and rank found specialists against the query.

The score rewards: matching the requested role and city, being reachable,
having a portfolio, seniority match, and platform preference. It is a simple
transparent weighted sum — easy to reason about and tune.
"""

from __future__ import annotations

from .models import SearchQuery, Specialist
from .query_parser import normalize


def score(person: Specialist, query: SearchQuery) -> float:
    s = 0.0

    # role match (the most important signal)
    if query.role and person.role == query.role:
        s += 5.0
    elif query.role_label and query.role_label in (person.bio + person.role_label):
        s += 2.5

    # location match
    if query.location_label:
        if normalize(query.location_label) == normalize(person.location_label):
            s += 4.0
        elif query.remote_ok and _looks_remote(person):
            s += 1.5  # remote-friendly people still count, but less
    else:
        s += 0.5  # no location asked -> mild neutral bonus

    # reachability & credibility
    if person.contact.is_reachable():
        s += 1.5
    s += min(len(person.contact.channels()), 3) * 0.3
    if person.portfolio_url:
        s += 0.8
    if person.rating:
        s += (person.rating - 4.0) if person.rating >= 4.0 else 0.0

    # platform preference
    if query.platforms and person.platform in query.platforms:
        s += 1.2

    # seniority
    if query.seniority and query.seniority in normalize(person.bio):
        s += 0.8

    # very light popularity signal (log-ish, capped)
    if person.followers:
        s += min(person.followers / 50000.0, 1.0)

    return round(s, 3)


def _looks_remote(person: Specialist) -> bool:
    text = normalize(person.bio + " " + " ".join(person.skills))
    return any(w in text for w in ["remote", "ریموت", "دورکار", "راه دور", "از راه دور"])


def rank(people: list[Specialist], query: SearchQuery) -> list[Specialist]:
    for p in people:
        p.score = score(p, query)
    return sorted(people, key=lambda p: p.score, reverse=True)
