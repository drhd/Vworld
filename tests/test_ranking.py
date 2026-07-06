from vworld.models import Contact, Specialist
from vworld.query_parser import parse
from vworld.ranking import score


def _person(**kw):
    kw.setdefault("contact", Contact(telegram="@x"))
    return Specialist(name="X", **kw)


def test_role_and_city_match_scores_higher():
    q = parse("طراح گرافیک تو ساری")
    match = _person(role="graphic_designer", location_label="ساری")
    mismatch = _person(role="graphic_designer", location_label="تهران")
    assert score(match, q) > score(mismatch, q)


def test_reachable_beats_unreachable():
    q = parse("عکاس تو تهران")
    reachable = _person(role="photographer", location_label="تهران",
                        contact=Contact(telegram="@a", phone="0912"))
    unreachable = _person(role="photographer", location_label="تهران",
                          contact=Contact())
    assert score(reachable, q) > score(unreachable, q)


def test_remote_person_still_counts_when_city_mismatch():
    q = parse("برنامه‌نویس وب تو ساری")
    remote = _person(role="web_developer", location_label="تهران",
                    bio="Full-stack developer, remote / ریموت")
    onsite = _person(role="web_developer", location_label="تهران",
                    bio="Full-stack developer")
    assert score(remote, q) > score(onsite, q)
