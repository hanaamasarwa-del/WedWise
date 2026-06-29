const supabase = require("./supabase-client");

// Generates a mock image for a wedding concept.
// Replace this function body with a real image generation API call (e.g. DALL-E, Stability AI) when ready.
async function getOrCreateImage(submissionId, imagePrompt) {
  // Return existing image if already generated
  const { data: existing } = await supabase
    .from("generated_images")
    .select("*")
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (existing) return { image: existing, created: false };

  // Mock: return a placeholder image URL
  const placeholderUrl = `https://placehold.co/1024x1024?text=WedWise+Wedding+Concept`;

  const { data: image, error } = await supabase
    .from("generated_images")
    .insert({
      submission_id: submissionId,
      image_url: placeholderUrl,
      prompt_used: imagePrompt,
    })
    .select("*")
    .single();

  if (error) throw new Error("Failed to save image: " + error.message);

  return { image, created: true };
}

module.exports = { getOrCreateImage };
