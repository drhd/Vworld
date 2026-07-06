from vworld.agent import SpecialistFinderAgent
from vworld.connectors import DemoConnector


def make_agent():
    # only the offline demo connector, no LLM -> deterministic & network-free
    return SpecialistFinderAgent(connectors=[DemoConnector()], use_llm=False)


def test_finds_graphic_designer_in_sari_ranked_first():
    agent = make_agent()
    result = agent.search("طراح گرافیک میخوام تو ساری")
    assert result.people, "expected at least one result"
    top = result.people[0]
    assert top.role == "graphic_designer"
    assert top.location_label == "ساری"
    # everyone returned should be reachable
    assert top.contact.is_reachable()


def test_sari_beats_tehran_for_same_role():
    agent = make_agent()
    result = agent.search("طراح گرافیک تو ساری")
    sari = [p for p in result.people if p.location_label == "ساری"]
    tehran = [p for p in result.people if p.location_label == "تهران"]
    assert sari and tehran
    assert max(p.score for p in sari) > max(p.score for p in tehran)


def test_digital_marketer_returns_details():
    agent = make_agent()
    result = agent.search("دیجیتال مارکتر میخوام")
    assert result.people
    for p in result.people:
        assert p.role == "digital_marketer"
        assert p.contact.channels()  # has a way to reach them


def test_role_filter_excludes_others():
    agent = make_agent()
    result = agent.search("عکاس تو ساری")
    assert all(p.role == "photographer" for p in result.people)


def test_active_sources_includes_demo():
    agent = make_agent()
    assert "demo" in agent.active_sources()
