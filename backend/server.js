"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const BACKEND_DIR = __dirname;
const PROJECT_DIR = path.resolve(BACKEND_DIR, "..");
const FRONTEND_DIR = path.join(PROJECT_DIR, "frontend");
const ENV_FILE = path.join(BACKEND_DIR, ".env");
const MAX_BODY_BYTES = 64 * 1024;
const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;
const requestTimes = new Map();

loadLocalEnvironment();
const PORT = Number(process.env.PORT) || 3000;

function loadLocalEnvironment() {
  if (!fs.existsSync(ENV_FILE)) return;

  for (const line of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;

    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("Request body is too large"), { statusCode: 413 }));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(Object.assign(new Error("Invalid JSON body"), { statusCode: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function cleanText(value, maxLength = 1000) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function parseStringArray(value) {
  if (Array.isArray(value)) return value.map((item) => cleanText(item, 100)).filter(Boolean);
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
    styles: parseStringArray(wedding.preferred_styles_json),
    colors: cleanText(wedding.preferred_colors, 300),
    flowers: parseStringArray(wedding.flowers),
    decorations: parseStringArray(wedding.decorations),
    flowersAndDecor: cleanText(wedding.flowers_and_decor, 600),
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

function formatList(values, fallback = "לא צוין") {
  return values.length ? values.join(", ") : fallback;
}

function buildTelegramMessage(submission) {
  const lines = [
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
  ];

  if (submission.flowersAndDecor && !submission.flowers.length && !submission.decorations.length) {
    lines.push(`🌿 פרחים וקישוטים: ${submission.flowersAndDecor}`);
  }

  lines.push("", "הערות אישיות", submission.freeText || "לא נכתבו הערות");
  return lines.join("\n").slice(0, TELEGRAM_MAX_MESSAGE_LENGTH);
}

async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw Object.assign(new Error("Telegram is not configured"), { statusCode: 503 });
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Telegram rejected the notification with status ${response.status}`);
  }
}

function isRateLimited(req) {
  const address = req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const previous = requestTimes.get(address) || 0;
  requestTimes.set(address, now);
  return now - previous < 3000;
}

async function handleTelegramLead(req, res) {
  if (isRateLimited(req)) {
    sendJson(res, 429, { error: "Please wait before submitting again" });
    return;
  }

  const body = await readJsonBody(req);
  const submission = normalizeSubmission(body);
  const validationError = validateSubmission(submission);

  if (validationError) {
    sendJson(res, 400, { error: validationError });
    return;
  }

  await sendTelegramMessage(buildTelegramMessage(submission));
  sendJson(res, 200, { status: "sent" });
}

function serveStaticFile(req, res) {
  const requestPath = new URL(req.url, "http://localhost").pathname;
  const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const filePath = path.resolve(FRONTEND_DIR, relativePath);

  if (!filePath.startsWith(`${FRONTEND_DIR}${path.sep}`) || !fs.existsSync(filePath)) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
  };

  const stat = fs.statSync(filePath);
  if (!stat.isFile()) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    "Content-Length": stat.size,
    "X-Content-Type-Options": "nosniff",
  });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/health") {
      sendJson(res, 200, {
        status: "ok",
        telegramConfigured: Boolean(
          process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
        ),
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/telegram-lead") {
      await handleTelegramLead(req, res);
      return;
    }

    if (req.method === "GET" || req.method === "HEAD") {
      serveStaticFile(req, res);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    const statusCode = Number(error.statusCode) || 502;
    console.error("Request failed:", error.message);
    sendJson(res, statusCode, {
      error: statusCode >= 500 ? "Unable to deliver the form right now" : error.message,
    });
  }
});

server.listen(PORT, () => {
  console.log(`WedWise is running on http://localhost:${PORT}`);
});
