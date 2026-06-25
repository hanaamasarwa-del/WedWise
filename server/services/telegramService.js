// Telegram notification service.
// Replace the mock implementation with real HTTP calls once TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set.

async function sendLeadNotification(lead) {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("[Telegram MOCK] Would send lead notification:", lead);
    return { status: "mock_logged" };
  }

  const message =
    `🎊 ליד חדש ב-WedWise!\n\n` +
    `👤 שם: ${lead.full_name}\n` +
    `📞 טלפון: ${lead.phone}\n` +
    `📧 אימייל: ${lead.email || "לא הוזן"}\n` +
    `🕐 זמן מועדף לחזרה: ${lead.preferred_contact_time || "לא צוין"}\n` +
    `🆔 מזהה טופס: ${lead.submission_id}`;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Telegram API error: ${err}`);
  }

  return { status: "sent" };
}

module.exports = { sendLeadNotification };
