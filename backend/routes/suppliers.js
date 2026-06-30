const express = require("express");
const router = express.Router();
const supabase = require("../services/supabase-client");
const { getRecommendations, recommendSupplierCategory } = require("../services/supplier-service");

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

// POST /api/suppliers/recommend
// Recommends non-venue suppliers from the supplier catalog. Venue recommendations
// intentionally stay under /api/venues/recommend.
router.post("/recommend", async (req, res) => {
  try {
    const { category, region, region_id, budget, guests, style } = req.body;

    if (!category) return res.status(400).json({ error: "Missing required field: category" });
    if (!budget || Number(budget) <= 0)
      return res.status(400).json({ error: "Missing required field: budget" });
    if (!guests || Number(guests) <= 0)
      return res.status(400).json({ error: "Missing required field: guests" });
    if (!region && !region_id)
      return res.status(400).json({ error: "Missing required field: region or region_id" });

    const result = await recommendSupplierCategory({
      category,
      region,
      region_id,
      budget,
      guests,
      style,
    });

    if (!result.suppliers.length) {
      return res.status(404).json({
        error: "No suppliers found for this category",
        ...result,
      });
    }

    return res.json(result);
  } catch (err) {
    if (err.message.includes("Unsupported supplier category")) {
      return res.status(400).json({ error: err.message });
    }

    console.error("Supplier recommend error:", err.message);
    return res.status(500).json({ error: "Failed to recommend suppliers" });
  }
});

module.exports = router;
