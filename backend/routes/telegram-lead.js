const express = require("express");
const { sendFormNotification } = require("../services/telegram-service");

const router = express.Router();
const recentSubmissions = new Map();

function cleanText(value, maxLength = 1000) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function parseStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cleanText(item, 100)).filter(Boolean);
  }

  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => cleanText(item, 100)).filter(Boolean)
      : [];
  } catch {
    return value.split(",").map((item) => cleanText(item, 100)).filter(Boolean);
  }
}

function formatWeddingDate(wedding) {
  const label = cleanText(wedding.wedding_date_label, 160);
  if (label) return label;

  const exactDate = cleanText(wedding.wedding_date_exact, 40);
  if (exactDate) return exactDate;

  const rangeFrom = cleanText(wedding.wedding_month_from, 40);
  const rangeTo = cleanText(wedding.wedding_month_to, 40);
  if (rangeFrom && rangeTo) return `${rangeFrom} - ${rangeTo}`;
  if (rangeFrom) return rangeFrom;
  if (rangeTo) return rangeTo;

  return "";
}

function normalizeSubmission(body) {
  const wedding = body.wedding_request || {};
  const lead = body.lead || {};

  return {
    fullName: cleanText(lead.full_name, 150),
    phone: cleanText(lead.phone, 40),
    email: cleanText(lead.email, 200),
    budget: Number(wedding.estimated_budget_ils) || 0,
    guests: Number(wedding.guest_count) || 0,
    region: cleanText(wedding.region_name || wedding.region_id, 100),
    weddingDate: formatWeddingDate(wedding),
    styles: parseStringArray(wedding.preferred_styles_json),
    colors: cleanText(wedding.preferred_colors, 300),
    flowers: parseStringArray(wedding.flowers),
    decorations: parseStringArray(wedding.decorations),
    freeText: cleanText(wedding.free_text, 1200),
  };
}

function validateSubmission(submission) {
  if (!submission.fullName) return "Full name is required";
  if (!submission.phone || submission.phone.length < 9) return "A valid phone number is required";
  if (!submission.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) {
    return "A valid email address is required";
  }
  if (submission.budget <= 0) return "Budget must be positive";
  if (submission.guests < 20) return "Guest count must be at least 20";
  if (!submission.region) return "Region is required";
  if (submission.styles.length === 0) return "Wedding style is required";
  return null;
}

function isRateLimited(req) {
  const address = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const previous = recentSubmissions.get(address) || 0;
  recentSubmissions.set(address, now);
  return now - previous < 3000;
}

router.post("/", async (req, res) => {
  try {
    if (isRateLimited(req)) {
      return res.status(429).json({ error: "Please wait before submitting again" });
    }

    const submission = normalizeSubmission(req.body);
    const validationError = validateSubmission(submission);
    if (validationError) return res.status(400).json({ error: validationError });

    const result = await sendFormNotification(submission);
    return res.json({ status: result.status });
  } catch (error) {
    console.error("Telegram form notification failed:", error.message);
    return res.status(502).json({ error: "Unable to deliver the form right now" });
  }
});

module.exports = router;
