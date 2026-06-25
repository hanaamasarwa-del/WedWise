const supabase = require("./supabase-client");

// Generates a mock AI report from a submission.
// Replace this function body with a real Claude/OpenAI API call when ready.
async function generateReport(submission) {
  const {
    region,
    budget,
    guests,
    wedding_style,
    colors,
    decorations,
    flowers,
    personal_text,
  } = submission;

  const regionLabel = {
    center: "Central Israel",
    north: "Northern Israel",
    south: "Southern Israel",
    jerusalem: "Jerusalem Area",
    sharon: "Sharon Region",
  }[region?.toLowerCase()] || region;

  const styleLabel =
    wedding_style.charAt(0).toUpperCase() + wedding_style.slice(1);

  const colorList = colors?.length ? colors.join(", ") : "your selected colors";
  const decorList = decorations?.length ? decorations.join(", ") : "elegant decorations";
  const flowerList = flowers?.length ? flowers.join(", ") : "floral arrangements";

  let budgetFit = "medium";
  if (budget < 60000) budgetFit = "low";
  else if (budget > 200000) budgetFit = "high";

  const budgetNotes =
    budgetFit === "low"
      ? "On this budget, prioritize venue and catering. Choose simpler floral and decoration options."
      : budgetFit === "high"
      ? "Your budget allows for a premium experience across all categories including luxury venue, high-end catering, and full decoration."
      : "Your budget should be spread across venue, catering, DJ, photography, and floral design.";

  const title = `${styleLabel} Wedding in ${regionLabel}`;
  const summary = `Based on your preferences, your wedding direction is a ${wedding_style} and romantic event for ${guests} guests in the ${regionLabel}. ${personal_text ? "Your personal note adds: " + personal_text.slice(0, 100) + (personal_text.length > 100 ? "..." : "") : ""}`;
  const designConcept = `A ${wedding_style} design based on ${colorList} colors, featuring ${decorList} and soft ${flowerList}.`;
  const imagePrompt = `A realistic ${wedding_style} wedding design concept, ${colorList} color palette, ${flowerList} floral accents, ${decorList}, romantic atmosphere, no specific venue shown, atmospheric wedding inspiration image, professional photography style.`;

  return {
    title,
    summary,
    event_type: `${wedding_style} evening wedding`,
    budget_fit: budgetFit,
    budget_notes: budgetNotes,
    design_concept: designConcept,
    image_prompt: imagePrompt,
  };
}

async function getOrCreateReport(submissionId) {
  // Return existing report if already generated
  const { data: existing } = await supabase
    .from("ai_reports")
    .select("*")
    .eq("submission_id", submissionId)
    .maybeSingle();

  if (existing) return { report: existing, created: false };

  // Fetch submission
  const { data: submission, error: subErr } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (subErr || !submission) {
    throw new Error("Submission not found");
  }

  const reportData = await generateReport(submission);

  const { data: report, error } = await supabase
    .from("ai_reports")
    .insert({ submission_id: submissionId, ...reportData })
    .select("*")
    .single();

  if (error) throw new Error("Failed to save report: " + error.message);

  return { report, created: true };
}

module.exports = { getOrCreateReport };
