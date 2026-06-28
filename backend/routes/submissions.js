const express = require("express");
const router = express.Router();
const supabase = require("../services/supabase-client");

// POST /api/submissions
router.post("/", async (req, res) => {
  try {
    const {
      budget,
      guests,
      region,
      weddingStyle,
      colors,
      decorations,
      flowers,
      personalText,
      inspirationUrl,
    } = req.body;

    if (!budget || budget <= 0)
      return res.status(400).json({ error: "Missing required field: budget (must be a positive number)" });
    if (!guests || guests <= 0)
      return res.status(400).json({ error: "Missing required field: guests (must be a positive number)" });
    if (!region)
      return res.status(400).json({ error: "Missing required field: region" });
    if (!weddingStyle)
      return res.status(400).json({ error: "Missing required field: weddingStyle" });

    const row = {
      budget: Number(budget),
      guests: Number(guests),
      region,
      wedding_style: weddingStyle,
      colors: Array.isArray(colors) ? colors : [],
      decorations: Array.isArray(decorations) ? decorations : [],
      flowers: Array.isArray(flowers) ? flowers : [],
      personal_text: personalText || "",
      inspiration_url: inspirationUrl || null,
    };

    const { data, error } = await supabase.from("submissions").insert(row).select("id").single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Failed to save submission" });
    }

    res.status(201).json({ submissionId: data.id, status: "saved" });
  } catch (err) {
    console.error("Submissions POST error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/submissions/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from("submissions").select("*").eq("id", id).single();

    if (error || !data) return res.status(404).json({ error: "Submission not found" });

    res.json({
      id: data.id,
      budget: data.budget,
      guests: data.guests,
      region: data.region,
      weddingStyle: data.wedding_style,
      colors: data.colors,
      decorations: data.decorations,
      flowers: data.flowers,
      personalText: data.personal_text,
      inspirationUrl: data.inspiration_url,
      createdAt: data.created_at,
    });
  } catch (err) {
    console.error("Submissions GET error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
