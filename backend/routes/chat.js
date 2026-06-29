const express = require("express");
const { createChatReply } = require("../services/chat-service");

const router = express.Router();
const requestLog = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 12;

function isRateLimited(clientId) {
  const now = Date.now();
  const recentRequests = (requestLog.get(clientId) || [])
    .filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(clientId, recentRequests);
    return true;
  }

  recentRequests.push(now);
  requestLog.set(clientId, recentRequests);
  return false;
}

router.post("/", async (req, res) => {
  const clientId = req.ip || req.socket.remoteAddress || "unknown";

  if (isRateLimited(clientId)) {
    return res.status(429).json({
      error: "Too many messages. Please wait a moment and try again.",
    });
  }

  try {
    const reply = await createChatReply(req.body?.messages);
    return res.json({ reply });
  } catch (error) {
    if (error.code === "INVALID_CHAT_INPUT") {
      return res.status(400).json({ error: "Please enter a message." });
    }

    if (error.code === "OPENAI_NOT_CONFIGURED") {
      console.error(error.message);
      return res.status(503).json({ error: "The chat is not configured yet." });
    }

    console.error("Chat request failed:", error.message);
    return res.status(502).json({
      error: "The assistant is temporarily unavailable. Please try again.",
    });
  }
});

module.exports = router;
