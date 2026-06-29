const express = require("express");
const router = express.Router();
const { generateWeddingImage } = require("../services/image-service");

// POST /api/generate-image
router.post("/generate-image", async (req, res) => {
  const { reportText, description, questionnaire } = req.body;
  const sourceText = reportText || description;

  if (!sourceText || String(sourceText).trim().length < 30) {
    return res.status(400).json({
      error: "Missing required field: reportText",
      message: "Please provide a wedding report or description with at least 30 characters.",
    });
  }

  try {
    const result = await generateWeddingImage({
      reportText: sourceText,
      questionnaire,
    });

    res.json({
      imageUrl: result.image,
      promptUsed: result.promptUsed,
      model: result.model,
    });
  } catch (err) {
    console.error("Image generation error:", err);
    res.status(err.statusCode || 500).json({
      error: "Failed to generate image",
      message: err.message || "Unexpected image generation error",
    });
  }
});

module.exports = router;
