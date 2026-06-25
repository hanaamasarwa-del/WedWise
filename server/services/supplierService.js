const path = require("path");
const suppliersData = require(path.join(__dirname, "../../backend/database/demo_suppliers.json"));

// Maps English region values (from the questionnaire) to Hebrew region names in the DB
const REGION_MAP = {
  center: "המרכז",
  north: "הצפון",
  south: "הדרום",
  jerusalem: "ירושלים והסביבה",
  sharon: "המרכז", // Sharon is part of the Center region
};

// Maps English wedding style values to Hebrew style tags used in the DB
const STYLE_MAP = {
  classic: ["אלגנטי", "רומנטי", "מסורתי"],
  modern: ["מודרני", "מינימליסטי", "אלגנטי"],
  boho: ["בוהו", "כפרי", "רומנטי"],
  rustic: ["כפרי", "בוהו", "מינימליסטי"],
  traditional: ["מסורתי", "אלגנטי", "רומנטי"],
  romantic: ["רומנטי", "אלגנטי", "כפרי"],
  minimalist: ["מינימליסטי", "מודרני"],
};

function scoreSupplier(supplier, regionHe, budgetPerGuest, hebrewStyles) {
  let score = 0;
  const reasons = [];

  // Region match (highest weight)
  if (supplier.region === regionHe) {
    score += 4;
    reasons.push("matches your region");
  }

  // Budget compatibility: price_min_ils per guest (for venues/catering) or total package
  if (supplier.price_unit === "לאורח") {
    if (supplier.price_min_ils <= budgetPerGuest) {
      score += 3;
      reasons.push("fits your budget per guest");
    }
  } else if (supplier.price_unit === "לחבילה") {
    // Package suppliers — we just accept them if price_min is reasonable
    if (supplier.price_min_ils <= budgetPerGuest * 50) {
      score += 2;
      reasons.push("fits within your overall budget");
    }
  }

  // Style tag overlap
  const supplierStyles = supplier.styles || [];
  const overlap = supplierStyles.filter((s) => hebrewStyles.includes(s));
  if (overlap.length > 0) {
    score += overlap.length;
    reasons.push(`matches your ${overlap.length > 1 ? "preferred styles" : "preferred style"}`);
  }

  return { score, reason: reasons.join(", ") };
}

function getRecommendations(submission) {
  const { region, budget, guests, wedding_style } = submission;

  const regionHe = REGION_MAP[region?.toLowerCase()] || null;
  const budgetPerGuest = guests > 0 ? Math.floor(budget / guests) : 0;
  const hebrewStyles = STYLE_MAP[wedding_style?.toLowerCase()] || [];

  const activeSuppliers = suppliersData.suppliers.filter((s) => s.is_active);

  const scored = activeSuppliers
    .map((supplier) => {
      const { score, reason } = scoreSupplier(supplier, regionHe, budgetPerGuest, hebrewStyles);
      return {
        id: supplier.id,
        name: supplier.name,
        category: supplier.category,
        region: supplier.region,
        city: supplier.city,
        priceMin: supplier.price_min_ils,
        priceMax: supplier.price_max_ils,
        priceUnit: supplier.price_unit,
        styles: supplier.styles,
        description: supplier.description,
        websiteUrl: supplier.website_url,
        score,
        reason,
      };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Return top 10 across categories, ensuring variety
  const seen = {};
  const results = [];
  for (const s of scored) {
    if (results.length >= 10) break;
    const cat = s.category;
    if (!seen[cat]) seen[cat] = 0;
    if (seen[cat] < 3) {
      seen[cat]++;
      results.push(s);
    }
  }

  return results;
}

module.exports = { getRecommendations };
