const TELEGRAM_API_BASE = "https://api.telegram.org";
const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;
let detectedChatId = null;

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return token;
}

async function resolveChatId(token) {
  if (process.env.TELEGRAM_CHAT_ID) return process.env.TELEGRAM_CHAT_ID;
  if (detectedChatId) return detectedChatId;

  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/getUpdates`, {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Telegram getUpdates failed with status ${response.status}`);
  }

  const payload = await response.json();
  const chatIds = [
    ...new Set(
      (payload.result || [])
        .map((update) => update.message?.chat || update.channel_post?.chat)
        .filter((chat) => chat && chat.type === "private")
        .map((chat) => String(chat.id))
    ),
  ];

  if (chatIds.length !== 1) {
    throw new Error(
      "TELEGRAM_CHAT_ID is not configured. Send /start to the bot from exactly one private chat or set the variable explicitly."
    );
  }

  [detectedChatId] = chatIds;
  return detectedChatId;
}

async function sendMessage(message) {
  const token = getBotToken();
  const chatId = await resolveChatId(token);
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message.slice(0, TELEGRAM_MAX_MESSAGE_LENGTH),
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Telegram sendMessage failed with status ${response.status}`);
  }

  return { status: "sent" };
}

function formatList(values) {
  return values.length ? values.join(", ") : "לא צוין";
}

function buildFormMessage(submission) {
  return [
    "💍 ליד חדש מ-WedWise",
    "",
    "פרטי קשר",
    `👤 שם מלא: ${submission.fullName}`,
    `📞 טלפון: ${submission.phone}`,
    `📧 אימייל: ${submission.email}`,
    "",
    "פרטי האירוע",
    `💰 תקציב: ${submission.budget.toLocaleString("he-IL")} ₪`,
    `👥 מספר אורחים: ${submission.guests.toLocaleString("he-IL")}`,
    `📍 אזור: ${submission.region}`,
    `✨ סגנון: ${formatList(submission.styles)}`,
    `🎨 צבעים: ${submission.colors || "לא צוין"}`,
    `🌸 פרחים: ${formatList(submission.flowers)}`,
    `🕯️ קישוטים: ${formatList(submission.decorations)}`,
    "",
    "הערות אישיות",
    submission.freeText || "לא נכתבו הערות",
  ].join("\n");
}

async function sendFormNotification(submission) {
  return sendMessage(buildFormMessage(submission));
}

async function sendLeadNotification(lead) {
  const message =
    `🎊 ליד חדש ב-WedWise!\n\n` +
    `👤 שם: ${lead.full_name}\n` +
    `📞 טלפון: ${lead.phone}\n` +
    `📧 אימייל: ${lead.email || "לא הוזן"}\n` +
    `🕐 זמן מועדף לחזרה: ${lead.preferred_contact_time || "לא צוין"}\n` +
    `🆔 מזהה טופס: ${lead.submission_id}`;

  return sendMessage(message);
}

function buildFollowUpMessage(followUp) {
  const decisionText = followUp.decision === "continue"
    ? "רוצה להמשיך עם WedWise"
    : "בחר/ה שלא להמשיך כרגע";

  return [
    "📌 עדכון סטטוס אחרי אישור הדוח",
    "",
    "פרטי קשר",
    `👤 שם מלא: ${followUp.fullName}`,
    `📞 טלפון: ${followUp.phone}`,
    `📧 אימייל: ${followUp.email || "לא הוזן"}`,
    "",
    "בחירת המשתמש",
    `✅ סטטוס: ${decisionText}`,
  ].join("\n");
}

async function sendFollowUpNotification(followUp) {
  return sendMessage(buildFollowUpMessage(followUp));
}

module.exports = {
  sendFormNotification,
  sendLeadNotification,
  sendFollowUpNotification,
};
