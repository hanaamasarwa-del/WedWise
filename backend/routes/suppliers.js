const express = require("express");
const router = express.Router();
const supabase = require("../services/supabase-client");
const { getRecommendations } = require("../services/supplier-service");

// GET /api/suppliers/recommendations?submissionId=uuid
router.get("/recommendations", async (req, res) => {
  try {
    const { submissionId } = req.query;

    if (!submissionId)
      return res.status(400).json({ error: "Missing required query param: submissionId" });

    const { data: submission, error } = await supabase
      .from("submissions").select("*").eq("id", submissionId).single();

    if (error || !submission)
      return res.status(404).json({ error: "Submission not found" });

    const suppliers = getRecommendations(submission);
    res.json({ submissionId, suppliers });
  } catch (err) {
    console.error("Suppliers error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
