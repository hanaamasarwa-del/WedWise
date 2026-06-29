const express = require("express");
const router = express.Router();
const { recommendVenues } = require("../services/venue-recommendation-service");

// POST /api/venues/recommend  { region_id, budget, guests }
router.post("/recommend", (req, res) => {
  try {
    const { region_id, budget, guests } = req.body || {};

    if (!region_id)
      return res.status(400).json({ error: "Missing required field: region_id" });

    const result = recommendVenues({ region_id, budget, guests });

    if (!result.venues.length)
      return res.status(404).json({ error: "No venues found for this region", ...result });

    res.json(result);
  } catch (err) {
    console.error("Venue recommend error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
