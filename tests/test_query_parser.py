from vworld import query_parser as qp


def test_parses_role_and_city():
    q = qp.parse("طراح گرافیک میخوام تو ساری")
    assert q.role == "graphic_designer"
    assert q.role_label == "طراح گرافیک"
    assert q.location == "sari"
    assert q.location_label == "ساری"


def test_parses_digital_marketer():
    q = qp.parse("یه دیجیتال مارکتر میخوام برام پیدا کن")
    assert q.role == "digital_marketer"
    assert q.location == ""  # no city mentioned


def test_longer_synonym_wins():
    # "طراح رابط کاربری" should beat a bare "طراح"
    q = qp.parse("طراح رابط کاربری حرفه‌ای میخوام")
    assert q.role == "ui_ux_designer"
    assert q.seniority == "senior"


def test_detects_platform_preference():
    q = qp.parse("عکاس تو اینستاگرام تهران")
    assert "instagram" in q.platforms
    assert q.role == "photographer"
    assert q.location == "tehran"


def test_arabic_yeh_kaf_normalisation():
    # Arabic ي / ك should still match Persian synonyms
    q = qp.parse("گرافيك ديزاينر")
    assert q.role == "graphic_designer"


def test_english_query():
    q = qp.parse("I need a web developer in Mashhad")
    assert q.role == "web_developer"
    assert q.location == "mashhad"
