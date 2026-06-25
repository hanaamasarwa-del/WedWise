const express = require("express");
const router = express.Router();
const { getOrCreateReport } = require("../services/ai-report-service");

// POST /api/generate-report
router.post("/generate-report", async (req, res) => {
  const { submissionId } = req.body;

  if (!submissionId) {
    return res.status(400).json({ error: "Missing required field: submissionId" });
  }

  try {
    const { report } = await getOrCreateReport(submissionId);

    res.json({
      reportId: report.id,
      submissionId: report.submission_id,
      title: report.title,
      summary: report.summary,
      eventType: report.event_type,
      budgetFit: report.budget_fit,
      budgetNotes: report.budget_notes,
      designConcept: report.design_concept,
      imagePrompt: report.image_prompt,
      createdAt: report.created_at,
    });
  } catch (err) {
    if (err.message === "Submission not found") {
      return res.status(404).json({ error: "Submission not found" });
    }
    console.error("Report generation error:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

module.exports = router;
