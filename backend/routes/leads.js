const express = require("express");
const router = express.Router();
const supabase = require("../services/supabase-client");
const { sendLeadNotification } = require("../services/telegram-service");

// POST /api/leads
router.post("/", async (req, res) => {
  try {
    const { submissionId, fullName, phone, email, preferredContactTime, suppressTelegram } = req.body;

    if (!submissionId)
      return res.status(400).json({ error: "Missing required field: submissionId" });
    if (!fullName)
      return res.status(400).json({ error: "Missing required field: fullName" });
    if (!phone)
      return res.status(400).json({ error: "Missing required field: phone" });

    const row = {
      submission_id: submissionId,
      full_name: fullName,
      phone,
      email: email || null,
      preferred_contact_time: preferredContactTime || null,
    };

    const { data, error } = await supabase.from("leads").insert(row).select("id").single();

    if (error) {
      console.error("Supabase lead insert error:", error);
      return res.status(500).json({ error: "Failed to save lead" });
    }

    let telegramStatus = suppressTelegram ? "skipped" : "mock_logged";
    if (!suppressTelegram) {
      try {
        const result = await sendLeadNotification({ ...row, id: data.id });
        telegramStatus = result.status;
      } catch (telegramErr) {
        console.error("Telegram send error:", telegramErr.message);
        telegramStatus = "failed";
      }
    }

    res.status(201).json({ leadId: data.id, status: "saved", telegramStatus });
  } catch (err) {
    console.error("Leads POST error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
