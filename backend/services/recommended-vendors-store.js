/**
 * Saves the vendors recommended to a specific couple (submission) so we keep a
 * record of what each couple was shown in their report.
 *
 * Two kinds of vendors are stored in the same table, tagged by vendor_type:
 *   - 'venue'    → wedding halls from the venue recommender
 *   - 'supplier' → other vendors (photographer, catering, music, ...) by category
 *
 * All saving is best-effort: a failure here must never break the recommendation
 * response the couple is waiting for. Callers should not await-throw on it.
 */

const supabase = require("./supabase-client");

function toRow(submissionId, vendorType, category, item) {
  return {
    submission_id: submissionId,
    vendor_type: vendorType,
    category: category || null,
    source_id: item.id != null ? String(item.id) : null,
    name: item.name || "",
    name_english: item.nameEnglish || null,
    city: item.city || null,
    region: item.region || null,
    price_min: item.priceMin ?? null,
    price_max: item.priceMax ?? null,
    price_unit: item.priceUnit || null,
    score: item.score ?? null,
    reason: item.reason || null,
    details: item,
  };
}

/**
 * Replace the previously stored recommendations for this couple + type (+ category)
 * with the fresh set, then insert. Replacing avoids piling up duplicate rows when a
 * couple re-opens the same recommendations.
 */
async function saveRecommendedVendors(submissionId, vendorType, category, items) {
  if (!submissionId || !Array.isArray(items) || !items.length) return;

  try {
    let del = supabase
      .from("recommended_vendors")
      .delete()
      .eq("submission_id", submissionId)
      .eq("vendor_type", vendorType);
    // Suppliers are shown per category, so only clear the same category.
    // Venues have a single set, so clear all venues for the couple.
    if (vendorType === "supplier" && category) del = del.eq("category", category);
    await del;

    const rows = items.map((item) => toRow(submissionId, vendorType, category, item));
    const { error } = await supabase.from("recommended_vendors").insert(rows);
    if (error) console.error("recommended_vendors insert error:", error.message);
  } catch (err) {
    console.error("saveRecommendedVendors failed (non-blocking):", err.message);
  }
}

module.exports = { saveRecommendedVendors };
