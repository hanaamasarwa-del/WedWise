const express = require("express");
const router = express.Router();
const { getOrCreateImage } = require("../services/imageService");

// POST /api/generate-image
router.post("/generate-image", async (req, res) => {
  const { submissionId, imagePrompt } = req.body;

  if (!submissionId) {
    return res.status(400).json({ error: "Missing required field: submissionId" });
  }
  if (!imagePrompt) {
    return res.status(400).json({ error: "Missing required field: imagePrompt" });
  }

  try {
    const { image } = await getOrCreateImage(submissionId, imagePrompt);

    res.json({
      imageId: image.id,
      submissionId: image.submission_id,
      imageUrl: image.image_url,
      promptUsed: image.prompt_used,
      createdAt: image.created_at,
    });
  } catch (err) {
    console.error("Image generation error:", err);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

module.exports = router;
