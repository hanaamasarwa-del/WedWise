const express = require("express");
const router = express.Router();
const supabase = require("../services/supabase-client");
const { sendFollowUpNotification } = require("../services/telegram-service");

function cleanText(value, maxLength = 1000) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function normalizeArrayText(value) {
  if (Array.isArray(value)) return value.map((item) => cleanText(item, 80)).filter(Boolean);
  if (!value) return [];
  return String(value).split(",").map((item) => cleanText(item, 80)).filter(Boolean);
}

function normalizePayload(body) {
  const lead = body.lead || {};
  const questionnaire = body.questionnaire || {};

  return {
    decision: cleanText(body.decision, 40),
    submissionId: cleanText(body.submissionId, 80) || null,
    leadId: cleanText(body.leadId, 80) || null,
    reportText: cleanText(body.reportText, 4000),
    imageGenerated: Boolean(body.imageGenerated),
    lead: {
      fullName: cleanText(lead.fullName || lead.full_name, 150),
      phone: cleanText(lead.phone, 40),
      email: cleanText(lead.email, 200),
    },
    questionnaire: {
      budget: Number(questionnaire.budget || questionnaire.estimated_budget_ils) || 0,
      guests: Number(questionnaire.guestCount || questionnaire.guest_count) || 0,
      region: cleanText(questionnaire.regionName || questionnaire.region_name || questionnaire.region, 100),
      style: cleanText(questionnaire.style || questionnaire.preferred_style, 120),
      colors: cleanText(questionnaire.colors || questionnaire.preferred_colors, 300),
      flowers: normalizeArrayText(questionnaire.flowers),
      decorations: normalizeArrayText(questionnaire.decorations),
      freeText: cleanText(questionnaire.freeText || questionnaire.free_text, 1200),
      inspirationUrl: cleanText(questionnaire.inspirationUrl || questionnaire.inspiration_url, 500) || null,
    },
  };
}

function validatePayload(payload) {
  if (!["continue", "thinking"].includes(payload.decision)) return "Invalid decision";
  if (!payload.lead.fullName) return "Full name is required";
  if (!payload.lead.phone || payload.lead.phone.length < 9) return "A valid phone number is required";
  if (payload.questionnaire.budget <= 0) return "Budget must be positive";
  if (payload.questionnaire.guests < 20) return "Guest count must be at least 20";
  if (!payload.questionnaire.region) return "Region is required";
  if (!payload.questionnaire.style) return "Wedding style is required";
  return null;
}

async function ensureSubmission(payload) {
  if (payload.submissionId) return payload.submissionId;

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      budget: payload.questionnaire.budget,
      guests: payload.questionnaire.guests,
      region: payload.questionnaire.region,
      wedding_style: payload.questionnaire.style,
      colors: payload.questionnaire.colors
        ? payload.questionnaire.colors.split(",").map((color) => cleanText(color, 80)).filter(Boolean)
        : [],
      flowers: payload.questionnaire.flowers,
      decorations: payload.questionnaire.decorations,
      personal_text: payload.questionnaire.freeText,
      inspiration_url: payload.questionnaire.inspirationUrl,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to save submission: ${error.message}`);
  return data.id;
}

async function ensureLead(payload, submissionId) {
  if (payload.leadId) return payload.leadId;

  const { data, error } = await supabase
    .from("leads")
    .insert({
      submission_id: submissionId,
      full_name: payload.lead.fullName,
      phone: payload.lead.phone,
      email: payload.lead.email || null,
      consent_to_contact: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to save lead: ${error.message}`);
  return data.id;
}

// Sort the contact into the matching outcome table based on their decision:
// "continue" -> secured_clients, "thinking" -> potential_clients.
async function recordClientOutcome(payload, submissionId, leadId) {
  const table = payload.decision === "continue" ? "secured_clients" : "potential_clients";
  const { error } = await supabase.from(table).insert({
    submission_id: submissionId,
    lead_id: leadId,
    full_name: payload.lead.fullName,
    phone: payload.lead.phone,
    email: payload.lead.email || null,
  });

  if (error) throw new Error(`Failed to save client outcome: ${error.message}`);
}

router.post("/", async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    const validationError = validatePayload(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    let databaseStatus = "saved";
    let databaseError = null;
    let submissionId = payload.submissionId;
    let leadId = payload.leadId;
    let followUpId = null;

    try {
      submissionId = await ensureSubmission(payload);
      leadId = await ensureLead(payload, submissionId);

      const { data, error } = await supabase
        .from("wedding_follow_ups")
        .insert({
          submission_id: submissionId,
          lead_id: leadId,
          decision: payload.decision,
          image_generated: payload.imageGenerated,
          report_summary: payload.reportText,
        })
        .select("id")
        .single();

      if (error) throw new Error(`Failed to save follow-up decision: ${error.message}`);
      followUpId = data.id;

      await recordClientOutcome(payload, submissionId, leadId);
    } catch (dbErr) {
      console.error("Wedding follow-up database error:", dbErr.message);
      databaseStatus = "failed";
      databaseError = dbErr.message;
    }

    let telegramStatus = "not_sent";
    try {
      const telegramResult = await sendFollowUpNotification({
        decision: payload.decision,
        fullName: payload.lead.fullName,
        phone: payload.lead.phone,
        email: payload.lead.email,
        budget: payload.questionnaire.budget,
        guests: payload.questionnaire.guests,
        region: payload.questionnaire.region,
        style: payload.questionnaire.style,
        colors: payload.questionnaire.colors,
        flowers: payload.questionnaire.flowers.join(", "),
        decorations: payload.questionnaire.decorations.join(", "),
        freeText: payload.questionnaire.freeText,
      });
      telegramStatus = telegramResult.status;
    } catch (telegramErr) {
      console.error("Wedding follow-up Telegram error:", telegramErr.message);
      telegramStatus = "failed";
    }

    if (databaseStatus === "failed" && telegramStatus === "failed") {
      return res.status(500).json({
        error: "Failed to save or notify wedding follow-up",
        databaseStatus,
        databaseError,
        telegramStatus,
      });
    }

    return res.status(databaseStatus === "saved" ? 201 : 202).json({
      status: databaseStatus === "saved" ? "saved" : "notified",
      followUpId,
      submissionId,
      leadId,
      databaseStatus,
      databaseError,
      telegramStatus,
    });
  } catch (err) {
    console.error("Wedding follow-up error:", err.message);
    return res.status(500).json({
      error: "Failed to save wedding follow-up",
      message: err.message,
    });
  }
});

module.exports = router;
