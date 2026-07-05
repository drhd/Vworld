/* =========================================================================
   CONTENT — the single source of every word and data point on this site.
   -------------------------------------------------------------------------
   Edit copy here. Nothing in this file touches layout or behavior.
   Each language block (`fa`, `en`) has the same shape; edit values only.
   Persian is the primary language; `fa` renders RTL, `en` renders LTR.
   ========================================================================= */

const SITE = {
  defaultLang: "fa",

  contact: {
    email: "dr.hd.co@gmail.com",
  },

  /* The four EDGE gates, one per act.
     NOTE: letter meanings below are PLACEHOLDERS — swap `fa` / `en`
     when the real E-D-G-E definitions are supplied. The letters render
     inside the throughline nodes; the words render as act kickers. */
  gates: [
    { letter: "E", fa: "ورود",    en: "Enter"  },
    { letter: "D", fa: "عمق",     en: "Depth"  },
    { letter: "G", fa: "دستاورد", en: "Gain"   },
    { letter: "E", fa: "انتقال",  en: "Extend" },
  ],

  fa: {
    dir: "rtl",
    meta: {
      title: "حامد دوام‌نژاد — معمار اکوسیستم‌های چندلایه",
      description:
        "استراتژیست کسب‌وکار و معمار سیستم‌ها؛ دو دهه تسلط رفتاری و خلاقانه، تلفیق‌شده با هوش مصنوعی و طراحی اکوسیستم.",
    },
    ui: {
      wordmark: "حامد دوام‌نژاد",
      langToggle: "EN",
      langToggleAria: "Switch to English",
      skip: "پرش به محتوا",
      followLine: "خط را دنبال کنید",
    },

    acts: {
      /* ---- ACT 1 — FRAME ------------------------------------------- */
      frame: {
        label: "قاب",
        kicker: "بیشترِ آدم‌ها کسب‌وکار می‌سازند.",
        headline: ["او سیستمی را معماری می‌کند", "که کسب‌وکار به آن بدل می‌شود."],
        subName: "حامد دوام‌نژاد",
        subRole: "معمار اکوسیستم‌های چندلایه",
      },

      /* ---- ACT 2 — ROOT --------------------------------------------- */
      root: {
        label: "ریشه",
        thesis:
          "پیش از آن‌که استراتژیِ رفتاری به رشته‌ای در کسب‌وکار بدل شود، او آن را در مقیاس دگرگونیِ انسان به کار بسته بود.",
        blocks: [
          {
            era: "۲۰۰۲–۲۰۱۹ · کارگردانی مستند",
            title: "دو دهه مطالعهٔ میدانیِ رفتار انسان",
            body:
              "نویسنده و کارگردان فیلم‌هایی دربارهٔ رفتار انسان و سیستم‌های اجتماعی؛ راه‌یافته به بیش از ۵۰ جشنوارهٔ بین‌المللی در چهار قاره — از IDFA آمستردام و CPH:DOX کپنهاگ تا Visions du Réel سوئیس، DOK Leipzig آلمان و True/False آمریکا.",
            proof:
              "مستند «قطار» از تلویزیون سراسری روسیه و دو شبکهٔ ملی و خصوصی فرانسه پخش شد.",
          },
          {
            era: "۲۰۰۲–۲۰۱۴ · سیستم‌های رفتاری",
            title: "دوازده سال طراحیِ خروجی‌محورِ دگرگونی",
            body:
              "مدیر داخلی و هنریِ یک برنامهٔ اقامتی؛ طراح سیستمی شناختی–رفتاری بر پایهٔ هنر، ساخته‌شده برای تغییرِ سنجش‌پذیر.",
            proof:
              "شرکت‌کنندگانی که در ارزیابی اولیه بی‌سواد شناخته شده بودند به سواد رسیدند — و آثار کلاسیکِ پیچیده را روی صحنه‌های ملی اجرا کردند.",
            note: "یک نقطه‌دادهٔ خروجیِ سیستم؛ نه یک روایت احساسی.",
          },
          {
            era: "پژوهش کاربردی",
            title: "تحلیل رفتار مخاطب در اکوسیستم‌های دیجیتالِ کسب‌وکار",
            body:
              "همان عدسیِ رفتاری، این‌بار صورت‌بندی‌شده برای بازارهای دیجیتال — پلِ میان ریشه و بازار.",
          },
        ],
      },

      /* ---- ACT 3 — SYNTHESIS ---------------------------------------- */
      synthesis: {
        label: "تلفیق",
        thesis:
          "این تلفیق در بازار جواب داده است. یک توانمندیِ یکپارچه — در مقصدها، هوانوردی و ونچرها.",
        rows: [
          {
            field: "استراتژی مقصد و گردشگری",
            body:
              "استان سمنان — چارچوب «شهرهای جادهٔ ابریشم»، هم‌راستا با UNWTO. کرج. منطقهٔ آزاد اروند. جزیره‌های قشم و کیش.",
          },
          {
            field: "توسعهٔ بازار هوانوردی بین‌المللی",
            body:
              "هواپیمایی اتیوپی — نمایندگی عمومی فروش ایران (GSA). عمان‌ایر — توسعهٔ شبکهٔ مسافریِ ایران–آتلانتیک.",
          },
          {
            field: "هوش مصنوعی، سیستم‌ها و ونچرها",
            body:
              "دانش هوش مصنوعی در سطح کارشناسی‌ارشد، به‌کاررفته در سیستم‌عامل‌های کسب‌وکار. اکوسیستم‌سازی: کاروبار. Brand OS، در اجرای زنده.",
          },
        ],
        coda: "نه یک کارنامهٔ پراکنده — یک توانمندی، در چند میدان.",
      },

      /* ---- ACT 4 — METHOD + INVITATION ------------------------------ */
      method: {
        label: "روش",
        thesis: "آن‌چه این مسیر ساخته، استعدادِ شخصی نیست؛ سیستمی قابل‌انتقال است.",
        frameworks: {
          title: "چارچوب‌های اختصاصی",
          items: ["مسیرساز", "MDBE", "EDGE", "Brand OS", "رهبری دوسوتوان"],
        },
        books: {
          title: "تفکرِ مدوّن",
          items: [
            {
              name: "سیگنال",
              desc: "نخستین کتاب فارسی دربارهٔ مکانیکِ استراتژیکِ نفوذ محتوا و جایگاه‌سازی شخصی در اکوسیستم‌های دیجیتال.",
            },
            {
              name: "سلاح قدرت",
              desc: "چارچوبی عملی برای اهرمِ روان‌شناختی در رهبری.",
            },
          ],
          upcomingLabel: "در دست انتشار:",
          upcoming: ["هنرِ مدیریتِ هنری", "یک دهه تئاتردرمانی"],
        },
        credentials: {
          title: "ستون تحصیلی",
          items: [
            "DBA استراتژی کسب‌وکار — دانشگاه تهران، دانشکدهٔ مدیریت",
            "کارشناسی‌ارشد مهندسی کامپیوتر، هوش مصنوعی — دانشگاه اراک",
            "کارشناسی مهندسی نرم‌افزار — دانشگاه آزاد اسلامی، ساری",
          ],
        },
        close: {
          headline: "گفت‌وگو را آغاز کنیم.",
          body: "اگر چیزی می‌سازید که باید دیده شود، رشد کند و بماند — لایهٔ بعدی با یک پیام شروع می‌شود.",
          cta: "نوشتن به حامد",
        },
      },
    },
  },

  en: {
    dir: "ltr",
    meta: {
      title: "Hamed Davamnejad — Architect of Multi-layered Ecosystems",
      description:
        "Business strategist and systems architect; two decades of behavioral and creative mastery, fused with AI and ecosystem design.",
    },
    ui: {
      wordmark: "Hamed Davamnejad",
      langToggle: "فا",
      langToggleAria: "تغییر زبان به فارسی",
      skip: "Skip to content",
      followLine: "Follow the line",
    },

    acts: {
      frame: {
        label: "Frame",
        kicker: "Most people build businesses.",
        headline: ["He architects the systems", "they become."],
        subName: "Hamed Davamnejad",
        subRole: "Architect of multi-layered ecosystems",
      },

      root: {
        label: "Root",
        thesis:
          "Before behavioral strategy was a business discipline, he practiced it at the scale of human transformation.",
        blocks: [
          {
            era: "2002–2019 · Documentary direction",
            title: "Two decades of field study in human behavior",
            body:
              "Wrote and directed films on human behavior and social systems — selected at 50+ international festivals across four continents, from IDFA (Amsterdam) and CPH:DOX (Copenhagen) to Visions du Réel (Switzerland), DOK Leipzig (Germany) and True/False (USA).",
            proof:
              "“Train” (قطار) was broadcast on Russian national television and two French national and private channels.",
          },
          {
            era: "2002–2014 · Behavioral systems",
            title: "Twelve years of outcome-designed transformation",
            body:
              "Internal & Artistic Director of a residential program; designed a cognitive-behavioral arts system built to produce measurable change.",
            proof:
              "Participants first assessed as non-literate reached literacy — and performed complex classical works on national stages.",
            note: "One data point from a working system — not an anecdote.",
          },
          {
            era: "Applied research",
            title: "Audience Behavior Analysis in Digital Business Ecosystems",
            body:
              "The same behavioral lens, formalized for digital markets — the bridge between the root and the market.",
          },
        ],
      },

      synthesis: {
        label: "Synthesis",
        thesis:
          "The fusion holds in the market. One integrated capability — applied across destinations, aviation, and ventures.",
        rows: [
          {
            field: "Destination & tourism strategy",
            body:
              "Semnan Province — Silk Road Cities framework, aligned with UNWTO. Karaj. Arvand Free Zone. The islands of Qeshm and Kish.",
          },
          {
            field: "International aviation markets",
            body:
              "Ethiopian Airlines — Iran general sales agency. Oman Air — Iran–Atlantic passenger network development.",
          },
          {
            field: "AI, systems & ventures",
            body:
              "MSc-level AI grounding applied to business operating systems. Ecosystem building: Karobar. Brand OS, in live practice.",
          },
        ],
        coda: "Not a scattered portfolio. One capability, in several arenas.",
      },

      method: {
        label: "Method",
        thesis: "What this path produced is not personal talent. It is a transferable system.",
        frameworks: {
          title: "Proprietary frameworks",
          items: ["Masirsaz", "MDBE", "EDGE", "Brand OS", "Ambidextrous leadership"],
        },
        books: {
          title: "Codified thinking",
          items: [
            {
              name: "Signal (سیگنال)",
              desc: "The first Persian book on the strategic mechanics of content influence and personal positioning in digital ecosystems.",
            },
            {
              name: "Power Weapon (سلاح قدرت)",
              desc: "A practical framework for psychological leverage in leadership.",
            },
          ],
          upcomingLabel: "In development:",
          upcoming: ["The Art of Artistic Management", "A Decade of Theater Therapy"],
        },
        credentials: {
          title: "Credentials spine",
          items: [
            "DBA, Business Strategy — University of Tehran, Faculty of Management",
            "MSc, Computer Engineering (AI) — Arak University",
            "BSc, Software Engineering — Islamic Azad University, Sari",
          ],
        },
        close: {
          headline: "Start the conversation.",
          body: "If you are building something that must be seen, grow, and last — the next layer starts with a message.",
          cta: "Write to Hamed",
        },
      },
    },
  },
};
