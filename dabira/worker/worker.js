/**
 * ═══════════════════════════════════════════════════════════════
 *  دبیرا (Dabira) — دستیار هوشمند صورت‌جلسه
 *  Telegram Meeting-Minutes Agent on Cloudflare Workers
 *
 *  صوت جلسه را در تلگرام بفرست → متن کامل + صورت‌جلسه استاندارد
 *  را به‌صورت فایل .md با تاریخ شمسی تحویل بگیر.
 *
 *  سرویس‌های ۱۰۰٪ رایگان:
 *   - Groq  → تبدیل صوت به متن (Whisper large-v3) + مدل زبانی Llama
 *   - Gemini → مدل زبانی پشتیبان (اختیاری)
 *   - Cloudflare Workers → هاست بدون خواب، بدون سرور
 *   - Telegram Bot API → رابط کاربری
 *
 *  متغیرهای محیطی (Settings → Variables در داشبورد Cloudflare):
 *   BOT_TOKEN        (اجباری) توکن ربات از BotFather
 *   GROQ_API_KEY     (اجباری) کلید از console.groq.com
 *   GEMINI_API_KEY   (اختیاری) کلید پشتیبان از aistudio.google.com
 *   WEBHOOK_SECRET   (پیشنهادی) یک رمز دلخواه برای امنیت وب‌هوک
 *   OWNER_CHAT_ID    (اختیاری) شناسه چت مالک — با دستور /id بگیرید
 *   GITHUB_TOKEN     (اختیاری) برای ذخیره خودکار در مخزن Obsidian مالک
 *   GITHUB_REPO      (اختیاری) مثل  username/obsidian-vault
 *   GITHUB_BRANCH    (اختیاری) پیش‌فرض main
 *
 *  KV Binding (Settings → Bindings):  DABIRA_KV
 *  برای ذخیره‌ی قالب‌های شخصی، پروژه‌ها و حافظه‌ی گفتگو.
 * ═══════════════════════════════════════════════════════════════
 */

const GROQ_BASE = 'https://api.groq.com/openai/v1';
const STT_MODEL = 'whisper-large-v3';
const GROQ_LLM = 'llama-3.3-70b-versatile';
const GEMINI_LLM = 'gemini-2.5-flash';

/* ── قالب پیش‌فرض صورت‌جلسه (تا وقتی متد edge با /learn آموزش داده شود) ── */
const DEFAULT_TEMPLATE_FA = `
ساختار صورت‌جلسه (فارسی رسمی اداری):
حاضرین: [اسامی]
خلاصه: [۲ تا ۴ جمله]
بدنه: [شرح کامل و رسمی مباحث، حداقل ۱۵۰ کلمه، با ذکر گوینده در صورت امکان]
تصمیمات: [فهرست شماره‌دار — اگر نبود: «در این جلسه تصمیم رسمی اتخاذ نگردید.»]
اقدامات: [هر مورد — مسئول: [نام یا نامشخص] — مهلت: [یا تعیین نشده]]
وظایف محوله: [فقط برای افراد نام‌برده‌شده]
نتیجه‌گیری: [۲ تا ۴ جمله جمع‌بندی رسمی]`;

const DEFAULT_TEMPLATE_EN = `
Meeting-minutes structure (formal English):
Attendees / Summary (2-4 sentences) / Full Body (min 150 words, attribute speakers) /
Decisions (numbered; or "No formal decision was made.") /
Action Items (item — owner — deadline) / Assigned Tasks (named people only) /
Conclusion (2-4 sentences)`;

/* قالب‌های آماده بر اساس دسته‌بندی بیزینس — با /template انتخاب می‌شوند */
const BUSINESS_TEMPLATES = {
  'استاندارد': '',
  'استارتاپ': 'لحن: چابک و خلاصه. بخش‌های ویژه: OKR های مطرح‌شده، بلاکرها، تصمیمات محصول، آیتم‌های اسپرینت بعدی.',
  'اداری': 'لحن: کاملاً رسمی اداری. بخش‌های ویژه: شماره جلسه، دستور جلسه، مصوبات با شماره‌گذاری رسمی، امضاکنندگان.',
  'هیئت‌مدیره': 'لحن: حقوقی و رسمی. بخش‌های ویژه: دستور جلسه، رأی‌گیری‌ها و نتیجه آرا، مصوبات لازم‌الاجرا، تاریخ جلسه بعد.',
  'فروش': 'لحن: نتیجه‌محور. بخش‌های ویژه: مشتریان/لیدهای مطرح‌شده، وضعیت پایپ‌لاین، تعهدات فروش، پیگیری‌های لازم.',
  'آموزشی': 'لحن: توضیحی. بخش‌های ویژه: سرفصل‌های تدریس‌شده، پرسش‌وپاسخ‌های مهم، تکالیف و منابع.',
};

/* ══════════════════════ نقطه‌ی ورود Worker ══════════════════════ */
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'GET') {
      return new Response('🤖 دبیرا فعال است | Dabira is running', {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }
    if (env.WEBHOOK_SECRET) {
      const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (secret !== env.WEBHOOK_SECRET) return new Response('unauthorized', { status: 401 });
    }
    let update;
    try {
      update = await request.json();
    } catch {
      return new Response('bad request', { status: 400 });
    }
    // پاسخ فوری به تلگرام؛ پردازش در پس‌زمینه ادامه می‌یابد
    ctx.waitUntil(handleUpdate(update, env).catch((e) => console.error('dabira error:', e)));
    return new Response('ok');
  },
};

/* ══════════════════════ مدیریت پیام‌ها ══════════════════════ */
async function handleUpdate(update, env) {
  const msg = update.message || update.channel_post;
  if (!msg) return;
  const chatId = msg.chat.id;

  const audio =
    msg.voice ||
    msg.audio ||
    (msg.document && isAudioDoc(msg.document) ? msg.document : null) ||
    (msg.video_note ? msg.video_note : null);

  if (audio) return processMeeting(env, msg, audio);

  const text = (msg.text || msg.caption || '').trim();
  if (!text) return;

  if (text.startsWith('/')) return handleCommand(env, msg, text);
  return chatMode(env, chatId, text);
}

function isAudioDoc(doc) {
  const mime = doc.mime_type || '';
  const name = (doc.file_name || '').toLowerCase();
  return (
    mime.startsWith('audio/') ||
    mime.startsWith('video/') ||
    /\.(mp3|m4a|ogg|oga|opus|wav|flac|aac|wma|mp4|webm)$/.test(name)
  );
}

/* ══════════════════════ دستورات ══════════════════════ */
async function handleCommand(env, msg, text) {
  const chatId = msg.chat.id;
  const [cmd, ...rest] = text.split(/\s+/);
  const arg = rest.join(' ').trim();
  const command = cmd.replace(/@\w+$/, '').toLowerCase();

  switch (command) {
    case '/start':
      return tg(env, 'sendMessage', {
        chat_id: chatId,
        parse_mode: 'Markdown',
        text:
          '👋 سلام! من *دبیرا* هستم — دستیار همیشه‌حاضرِ جلسات شما.\n\n' +
          '🎙️ فقط *فایل صوتی یا ویسِ جلسه* را برایم بفرست تا:\n' +
          '۱. متن کامل جلسه را پیاده کنم (فارسی/انگلیسی، تشخیص خودکار)\n' +
          '۲. صورت‌جلسه‌ی استاندارد و رسمی بنویسم\n' +
          '۳. فایل نهایی `.md` را با تاریخ شمسی تحویلت بدهم\n\n' +
          '📋 دستورات:\n' +
          '/template — انتخاب یا مشاهده قالب صورت‌جلسه\n' +
          '/learn — آموزش قالب اختصاصی خودت به من\n' +
          '/project — تعیین پروژه (برای آرشیو)\n' +
          '/lang — زبان خروجی (fa / en / auto)\n' +
          '/id — نمایش شناسه چت\n' +
          '/help — راهنما\n\n' +
          '💬 هر سؤال دیگری هم داشتی، همین‌جا بپرس — چت‌بات هوشمند هم هستم!',
      });

    case '/help':
      return tg(env, 'sendMessage', {
        chat_id: chatId,
        parse_mode: 'Markdown',
        text:
          '📖 *راهنمای دبیرا*\n\n' +
          '🎙️ *صوت جلسه* را بفرست (ویس، mp3، m4a، wav، ogg — تا ۲۰ مگابایت).\n' +
          'خروجی: متن کامل + صورت‌جلسه در یک فایل `.md`\n\n' +
          '*قالب‌ها:* `/template` برای دیدن فهرست، `/template استارتاپ` برای انتخاب.\n' +
          '*قالب شخصی:* یک نمونه صورت‌جلسه یا شرح روش خودت را بعد از `/learn` بفرست؛ ' +
          'من ساختارش را یاد می‌گیرم و از آن به بعد همان‌طور می‌نویسم.\n' +
          '*پروژه:* `/project نام-پروژه` — فایل‌ها با نام پروژه آرشیو می‌شوند.\n' +
          '*زبان:* `/lang fa` یعنی خروجی همیشه فارسی (حتی برای صوت انگلیسی → ترجمه می‌شود). ' +
          '`/lang auto` یعنی هم‌زبان با صوت.\n\n' +
          '⚠️ فایل بزرگ‌تر از ۲۰ مگابایت را تلگرام به ربات‌ها نمی‌دهد؛ ' +
          'جلسات طولانی را به چند فایل تقسیم کن.',
      });

    case '/id':
      return tg(env, 'sendMessage', {
        chat_id: chatId,
        text: `🆔 شناسه این چت: ${chatId}\n(برای متغیر OWNER_CHAT_ID استفاده کن)`,
      });

    case '/lang': {
      const v = arg.toLowerCase();
      if (!['fa', 'en', 'auto'].includes(v)) {
        const cur = (await kvGet(env, `user:${chatId}:lang`)) || 'auto';
        return tg(env, 'sendMessage', {
          chat_id: chatId,
          text: `🌐 زبان فعلی خروجی: ${cur}\nانتخاب: /lang fa | /lang en | /lang auto`,
        });
      }
      await kvPut(env, `user:${chatId}:lang`, v);
      return tg(env, 'sendMessage', { chat_id: chatId, text: `✅ زبان خروجی روی «${v}» تنظیم شد.` });
    }

    case '/project': {
      if (!arg) {
        const cur = (await kvGet(env, `user:${chatId}:project`)) || '—';
        return tg(env, 'sendMessage', {
          chat_id: chatId,
          text: `📁 پروژه فعلی: ${cur}\nتغییر: /project نام-پروژه`,
        });
      }
      await kvPut(env, `user:${chatId}:project`, arg);
      return tg(env, 'sendMessage', {
        chat_id: chatId,
        text: `✅ پروژه روی «${arg}» تنظیم شد. از این پس فایل‌ها در این پروژه آرشیو می‌شوند.`,
      });
    }

    case '/template': {
      if (!arg) {
        const cur = (await kvGet(env, `user:${chatId}:templateName`)) || 'استاندارد';
        return tg(env, 'sendMessage', {
          chat_id: chatId,
          parse_mode: 'Markdown',
          text:
            `📋 قالب فعلی: *${cur}*\n\nقالب‌های آماده:\n` +
            Object.keys(BUSINESS_TEMPLATES).map((k) => `• /template ${k}`).join('\n') +
            '\n\nیا قالب اختصاصی خودت را با /learn به من آموزش بده.',
        });
      }
      if (!(arg in BUSINESS_TEMPLATES)) {
        return tg(env, 'sendMessage', {
          chat_id: chatId,
          text: `❌ قالب «${arg}» را نمی‌شناسم. /template را بدون آرگومان بزن تا فهرست را ببینی.`,
        });
      }
      await kvPut(env, `user:${chatId}:templateName`, arg);
      await kvDelete(env, `user:${chatId}:customTemplate`);
      return tg(env, 'sendMessage', { chat_id: chatId, text: `✅ قالب «${arg}» فعال شد.` });
    }

    case '/learn': {
      const sample = arg || (msg.reply_to_message && (msg.reply_to_message.text || msg.reply_to_message.caption));
      if (!sample) {
        return tg(env, 'sendMessage', {
          chat_id: chatId,
          text:
            '🎓 روش کار: متنِ یک نمونه صورت‌جلسه یا شرح روش خودت (مثلاً «متد edge») را ' +
            'بعد از /learn بنویس یا روی پیامِ حاویِ نمونه ریپلای کن و /learn بزن.\n' +
            'من ساختار، بخش‌ها و لحنش را استخراج و ذخیره می‌کنم.',
        });
      }
      await tg(env, 'sendChatAction', { chat_id: chatId, action: 'typing' });
      const spec = await llm(env, [
        {
          role: 'system',
          content:
            'You are a template-extraction engine. From the sample meeting-minutes document or method description below, extract a reusable TEMPLATE SPECIFICATION: exact section names in order, formatting style, tone, numbering conventions, and any special rules. Write the specification in the same language as the sample, as concise imperative instructions that a writer-AI can follow. Output only the specification.',
        },
        { role: 'user', content: sample.slice(0, 12000) },
      ]);
      await kvPut(env, `user:${chatId}:customTemplate`, spec);
      await kvPut(env, `user:${chatId}:templateName`, 'اختصاصی (learn)');
      return tg(env, 'sendMessage', {
        chat_id: chatId,
        text:
          '✅ قالب اختصاصی‌ات را یاد گرفتم! از این به بعد صورت‌جلسه‌ها را با همین روش می‌نویسم.\n' +
          'خلاصه‌ی چیزی که یاد گرفتم:\n\n' + spec.slice(0, 1500),
      });
    }

    default:
      return tg(env, 'sendMessage', {
        chat_id: chatId,
        text: '🤔 این دستور را نمی‌شناسم. /help را ببین.',
      });
  }
}

/* ══════════════════════ حالت چت‌بات ══════════════════════ */
async function chatMode(env, chatId, text) {
  await tg(env, 'sendChatAction', { chat_id: chatId, action: 'typing' });

  const histKey = `user:${chatId}:history`;
  let history = [];
  try {
    history = JSON.parse((await kvGet(env, histKey)) || '[]');
  } catch {}

  const messages = [
    {
      role: 'system',
      content:
        'You are «دبیرا» (Dabira), a professional, warm, always-available Persian meeting assistant. ' +
        'Answer in the same language the user writes (Persian or English). Be concise, helpful and friendly. ' +
        'You can also explain how you work: users send meeting audio, you transcribe it and produce formal meeting minutes as a Markdown file.',
    },
    ...history,
    { role: 'user', content: text },
  ];

  const answer = await llm(env, messages);
  await tg(env, 'sendMessage', { chat_id: chatId, text: answer });

  history.push({ role: 'user', content: text.slice(0, 2000) });
  history.push({ role: 'assistant', content: answer.slice(0, 2000) });
  await kvPut(env, histKey, JSON.stringify(history.slice(-12)));
}

/* ══════════════════════ پردازش جلسه ══════════════════════ */
async function processMeeting(env, msg, audio) {
  const chatId = msg.chat.id;

  if (audio.file_size && audio.file_size > 20 * 1024 * 1024) {
    return tg(env, 'sendMessage', {
      chat_id: chatId,
      text: '⚠️ تلگرام اجازه نمی‌دهد ربات فایل بزرگ‌تر از ۲۰ مگابایت را بردارد. لطفاً فایل را فشرده یا به چند بخش تقسیم کن.',
    });
  }

  const status = await tg(env, 'sendMessage', {
    chat_id: chatId,
    text: '🎙️ فایل رسید! در حال پیاده‌سازی متن جلسه...',
  });
  const editStatus = (text) =>
    tg(env, 'editMessageText', { chat_id: chatId, message_id: status.result?.message_id, text }).catch(() => {});

  try {
    /* ۱) دانلود فایل از تلگرام */
    const fileInfo = await tg(env, 'getFile', { file_id: audio.file_id });
    const filePath = fileInfo.result.file_path;
    const fileRes = await fetch(`https://api.telegram.org/file/bot${env.BOT_TOKEN}/${filePath}`);
    const fileBuf = await fileRes.arrayBuffer();

    /* ۲) تبدیل صوت به متن با Groq Whisper (تشخیص خودکار زبان) */
    const form = new FormData();
    form.append('file', new Blob([fileBuf]), filePath.split('/').pop() || 'audio.ogg');
    form.append('model', STT_MODEL);
    form.append('response_format', 'verbose_json');
    const sttRes = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
      body: form,
    });
    if (!sttRes.ok) throw new Error(`Groq STT ${sttRes.status}: ${await sttRes.text()}`);
    const stt = await sttRes.json();
    const transcript = (stt.text || '').trim();
    if (!transcript) throw new Error('متن قابل تشخیصی در فایل صوتی پیدا نشد.');
    const detectedLang = /^(persian|fa)/i.test(stt.language || '') ? 'fa' : 'en';

    /* ۳) تعیین زبان خروجی */
    const userLang = (await kvGet(env, `user:${chatId}:lang`)) || 'auto';
    const outLang = userLang === 'auto' ? detectedLang : userLang;

    await editStatus('✍️ متن پیاده شد. در حال نگارش صورت‌جلسه...');

    /* ۴) ساخت پرامپت بر اساس قالب کاربر */
    const customTemplate = await kvGet(env, `user:${chatId}:customTemplate`);
    const templateName = (await kvGet(env, `user:${chatId}:templateName`)) || 'استاندارد';
    const categoryHint = BUSINESS_TEMPLATES[templateName] || '';
    const baseTemplate = outLang === 'fa' ? DEFAULT_TEMPLATE_FA : DEFAULT_TEMPLATE_EN;
    const templateSpec = customTemplate || baseTemplate + (categoryHint ? `\nسبک ویژه: ${categoryHint}` : '');

    const { display: faDate, iso: isoDate } = jalaliDate();
    const langInstruction =
      outLang === 'fa'
        ? 'Write ALL output in formal administrative Persian (فارسی رسمی اداری). If the transcript is in another language, translate faithfully.'
        : 'Write ALL output in formal English. If the transcript is in another language, translate faithfully.';

    const raw = await llm(env, [
      {
        role: 'system',
        content:
          'You are an elite professional meeting secretary. From the raw voice-to-text transcript, produce precise meeting minutes.\n' +
          `${langInstruction}\n` +
          'Never fabricate anything not stated in the transcript.\n' +
          `Follow EXACTLY this template specification:\n${templateSpec}\n\n` +
          'Respond with ONLY this JSON (no markdown fences, no extra text):\n' +
          '{"title":"<short meeting topic>","summary":"<2-3 sentence summary>","minutes":"<full minutes following the template, with \\n line breaks>"}',
      },
      {
        role: 'user',
        content: `تاریخ جلسه: ${faDate}\nMeeting transcript:\n${transcript.slice(0, 24000)}`,
      },
    ]);

    const parsed = extractJson(raw) || { title: 'جلسه', summary: '', minutes: raw };
    const title = (parsed.title || 'جلسه').trim();
    const project = (await kvGet(env, `user:${chatId}:project`)) || '';

    /* ۵) ساخت فایل Markdown */
    const md = buildMarkdown({ title, faDate, isoDate, project, templateName, summary: parsed.summary, minutes: parsed.minutes, transcript, lang: outLang });
    const fileName = `${isoDate}-${slugify(title)}.md`;

    await editStatus('📄 در حال آماده‌سازی فایل نهایی...');

    /* ۶) ارسال فایل به کاربر در تلگرام */
    await tgSendDocument(env, chatId, fileName, md, `✅ صورت‌جلسه آماده شد!\n📌 ${title}\n📅 ${faDate}${project ? `\n📁 پروژه: ${project}` : ''}`);

    /* ۷) خلاصه در چت */
    if (parsed.summary) {
      await tg(env, 'sendMessage', { chat_id: chatId, text: `📝 خلاصه جلسه:\n${parsed.summary}` });
    }

    /* ۸) آرشیو مالک: ذخیره در مخزن GitHub (برای Obsidian) */
    if (env.GITHUB_TOKEN && env.GITHUB_REPO && String(chatId) === String(env.OWNER_CHAT_ID || '')) {
      const dir = project ? `Projects/${slugify(project)}` : 'Meetings';
      await saveToGithub(env, `${dir}/${fileName}`, md).catch((e) => console.error('github save:', e));
      await tg(env, 'sendMessage', { chat_id: chatId, text: `☁️ نسخه‌ی md در آرشیو Obsidian ذخیره شد: ${dir}/${fileName}` });
    }

    await tg(env, 'deleteMessage', { chat_id: chatId, message_id: status.result?.message_id }).catch(() => {});
  } catch (e) {
    console.error(e);
    await editStatus(`❌ خطا در پردازش: ${String(e.message || e).slice(0, 300)}\nدوباره تلاش کن یا /help را ببین.`);
  }
}

function buildMarkdown({ title, faDate, isoDate, project, templateName, summary, minutes, transcript, lang }) {
  return [
    '---',
    `title: "${title.replace(/"/g, "'")}"`,
    `date_jalali: ${isoDate}`,
    `date_display: ${faDate}`,
    project ? `project: "${project}"` : null,
    `template: "${templateName}"`,
    `lang: ${lang}`,
    'type: meeting-minutes',
    'agent: Dabira',
    '---',
    '',
    `# ${title}`,
    '',
    `**📅 ${faDate}**${project ? `  |  📁 ${project}` : ''}`,
    '',
    summary ? `> ${summary}\n` : '',
    '## صورت‌جلسه',
    '',
    minutes,
    '',
    '---',
    '',
    '## متن کامل جلسه (پیاده‌سازی)',
    '',
    transcript,
    '',
  ]
    .filter((l) => l !== null)
    .join('\n');
}

/* ══════════════════════ مدل‌های زبانی (Groq → Gemini) ══════════════════════ */
async function llm(env, messages) {
  // تلاش اول: Groq (سریع و رایگان)
  try {
    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model: GROQ_LLM, messages, temperature: 0.3, max_tokens: 8000 }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch (e) {
    // پشتیبان: Gemini (اگر کلیدش تنظیم شده باشد)
    if (!env.GEMINI_API_KEY) throw e;
    const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_LLM}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          generationConfig: { temperature: 0.3, maxOutputTokens: 8000 },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.candidates[0].content.parts.map((p) => p.text).join('').trim();
  }
}

/* ══════════════════════ ابزارهای تلگرام ══════════════════════ */
async function tg(env, method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) console.error(`telegram ${method}:`, JSON.stringify(data).slice(0, 300));
  return data;
}

async function tgSendDocument(env, chatId, fileName, content, caption) {
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('caption', caption.slice(0, 1024));
  form.append('document', new Blob([content], { type: 'text/markdown' }), fileName);
  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendDocument`, {
    method: 'POST',
    body: form,
  });
  return res.json();
}

/* ══════════════════════ تاریخ شمسی ══════════════════════ */
function jalaliDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value || '';
  const iso = `${get('year')}-${get('month')}-${get('day')}`;
  const display = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    dateStyle: 'full',
  }).format(date);
  return { iso, display };
}

/* ══════════════════════ ابزارهای کمکی ══════════════════════ */
function slugify(text) {
  return (
    text
      .replace(/["'`«»<>:/\\|?*#%{}[\]]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'jalase'
  );
}

function extractJson(text) {
  try {
    const cleaned = text.replace(/```(json)?/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

/* KV ممکن است هنوز متصل نشده باشد — بدون آن هم ربات با تنظیمات پیش‌فرض کار می‌کند */
async function kvGet(env, key) {
  try {
    return env.DABIRA_KV ? await env.DABIRA_KV.get(key) : null;
  } catch {
    return null;
  }
}
async function kvPut(env, key, value) {
  try {
    if (env.DABIRA_KV) await env.DABIRA_KV.put(key, value);
  } catch {}
}
async function kvDelete(env, key) {
  try {
    if (env.DABIRA_KV) await env.DABIRA_KV.delete(key);
  } catch {}
}

/* ══════════════════════ ذخیره در GitHub (آرشیو Obsidian مالک) ══════════════════════ */
async function saveToGithub(env, path, content) {
  const branch = env.GITHUB_BRANCH || 'main';
  const url = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
  const headers = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'dabira-agent',
    'content-type': 'application/json',
  };
  // اگر فایل از قبل هست، sha لازم است
  let sha;
  const existing = await fetch(`${url}?ref=${branch}`, { headers });
  if (existing.ok) sha = (await existing.json()).sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `dabira: add meeting minutes ${path}`,
      content: b64encodeUtf8(content),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
}

function b64encodeUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
