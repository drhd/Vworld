"""Persian/English vocabulary the parser uses to understand a request.

Everything here is intentionally data (not code) so it is easy to extend:
add a synonym to a role, or a new city, without touching the parser logic.
"""

from __future__ import annotations

# canonical_role -> (human label, [synonyms in fa/en, lowercased])
ROLE_TAXONOMY: dict[str, tuple[str, list[str]]] = {
    "graphic_designer": (
        "طراح گرافیک",
        ["طراح گرافیک", "گرافیست", "گرافیک دیزاینر", "طراح لوگو", "graphic designer",
         "graphist", "logo designer", "طراح پوستر", "طراح بنر"],
    ),
    "ui_ux_designer": (
        "طراح رابط کاربری (UI/UX)",
        ["طراح رابط کاربری", "طراح ui", "طراح ux", "ui ux", "ui/ux", "product designer",
         "طراح محصول", "ui designer", "ux designer"],
    ),
    "digital_marketer": (
        "دیجیتال مارکتر",
        ["دیجیتال مارکتر", "دیجیتال مارکتینگ", "بازاریابی دیجیتال", "digital marketer",
         "digital marketing", "بازاریاب", "مارکتر", "performance marketer"],
    ),
    "social_media_manager": (
        "مدیر شبکه‌های اجتماعی",
        ["مدیر شبکه های اجتماعی", "ادمین اینستاگرام", "سوشال مدیا", "social media",
         "social media manager", "کانتنت", "کانتنت کریتور", "content creator"],
    ),
    "seo_specialist": (
        "متخصص سئو",
        ["سئو", "سئوکار", "متخصص سئو", "seo", "seo specialist", "بهینه سازی سایت"],
    ),
    "web_developer": (
        "برنامه‌نویس وب",
        ["برنامه نویس", "برنامه‌نویس", "توسعه دهنده", "developer", "وب دولوپر",
         "web developer", "فرانت اند", "بک اند", "frontend", "backend", "fullstack",
         "full stack", "برنامه نویس وب"],
    ),
    "mobile_developer": (
        "برنامه‌نویس موبایل",
        ["برنامه نویس موبایل", "اندروید", "ios", "flutter", "react native",
         "mobile developer", "android developer", "ios developer"],
    ),
    "photographer": (
        "عکاس",
        ["عکاس", "عکاسی", "photographer", "فتوگرافر"],
    ),
    "videographer": (
        "فیلم‌بردار / تدوینگر",
        ["فیلم بردار", "فیلمبردار", "تدوینگر", "تدوین", "ادیت ویدیو", "videographer",
         "video editor", "موشن گرافیست", "موشن گرافیک", "motion designer", "motion graphic"],
    ),
    "copywriter": (
        "کپی‌رایتر / محتوانویس",
        ["کپی رایتر", "کپی‌رایتر", "محتوا نویس", "محتوانویس", "نویسنده محتوا",
         "copywriter", "content writer", "تولید محتوا"],
    ),
    "translator": (
        "مترجم",
        ["مترجم", "ترجمه", "translator"],
    ),
    "accountant": (
        "حسابدار",
        ["حسابدار", "حسابداری", "accountant", "مالی"],
    ),
    "voice_over": (
        "گوینده / صداپیشه",
        ["گوینده", "صداپیشه", "voice over", "voiceover", "دوبلور", "نریشن"],
    ),
    "data_scientist": (
        "دانشمند داده / هوش مصنوعی",
        ["دیتا ساینتیست", "علم داده", "data scientist", "machine learning",
         "یادگیری ماشین", "هوش مصنوعی", "ai engineer", "ml engineer"],
    ),
}


# canonical_city -> (human label, [synonyms lowercased])
CITIES: dict[str, tuple[str, list[str]]] = {
    "tehran": ("تهران", ["تهران", "tehran"]),
    "sari": ("ساری", ["ساری", "sari"]),
    "mashhad": ("مشهد", ["مشهد", "mashhad"]),
    "isfahan": ("اصفهان", ["اصفهان", "isfahan", "esfahan"]),
    "shiraz": ("شیراز", ["شیراز", "shiraz"]),
    "tabriz": ("تبریز", ["تبریز", "tabriz"]),
    "karaj": ("کرج", ["کرج", "karaj"]),
    "rasht": ("رشت", ["رشت", "rasht"]),
    "ahvaz": ("اهواز", ["اهواز", "ahvaz", "ahwaz"]),
    "qom": ("قم", ["قم", "qom"]),
    "kish": ("کیش", ["کیش", "kish"]),
    "babol": ("بابل", ["بابل", "babol"]),
    "amol": ("آمل", ["آمل", "amol"]),
    "gorgan": ("گرگان", ["گرگان", "gorgan"]),
    "kermanshah": ("کرمانشاه", ["کرمانشاه", "kermanshah"]),
    "yazd": ("یزد", ["یزد", "yazd"]),
}


# platform mentions in the query text
PLATFORM_KEYWORDS: dict[str, list[str]] = {
    "telegram": ["تلگرام", "telegram", "tg"],
    "instagram": ["اینستاگرام", "اینستا", "instagram", "insta", "ig"],
    "linkedin": ["لینکدین", "لینکداین", "linkedin"],
    "web": ["گوگل", "google", "وب", "web", "سایت"],
}


SENIORITY_KEYWORDS: dict[str, list[str]] = {
    "senior": ["سنیور", "ارشد", "حرفه ای", "حرفه‌ای", "senior", "با تجربه", "باتجربه"],
    "junior": ["جونیور", "تازه کار", "تازه‌کار", "junior", "مبتدی", "کارآموز"],
    "mid": ["میدلول", "mid", "متوسط"],
}
