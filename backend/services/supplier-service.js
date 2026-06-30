const path = require("path");
const supabase = require("./supabase-client");

const suppliersData = require(path.join(__dirname, "../../data/demo-suppliers/suppliers.demo.json"));

const REGION_MAP = {
  "1": "ירושלים והסביבה",
  "2": "המרכז",
  "3": "הצפון",
  "4": "הדרום",
  center: "המרכז",
  north: "הצפון",
  south: "הדרום",
  jerusalem: "ירושלים והסביבה",
  sharon: "המרכז",
};

const STYLE_MAP = {
  classic: ["אלגנטי", "רומנטי", "מסורתי"],
  modern: ["מודרני", "מינימליסטי", "אלגנטי"],
  boho: ["בוהו", "כפרי", "רומנטי"],
  rustic: ["כפרי", "בוהו", "מינימליסטי"],
  traditional: ["מסורתי", "אלגנטי", "רומנטי"],
  romantic: ["רומנטי", "אלגנטי", "כפרי"],
  minimalist: ["מינימליסטי", "מודרני"],
};

const NON_VENUE_CATEGORIES = new Set([
  "די־ג׳יי",
  "צילום",
  "עיצוב ופרחים",
  "קייטרינג",
]);

const CATEGORY_BUDGET_SHARE = {
  "די־ג׳יי": 0.08,
  "צילום": 0.10,
  "עיצוב ופרחים": 0.09,
  "קייטרינג": 0.30,
};

function normalizeRegion(region) {
  const value = String(region || "").trim();
  return REGION_MAP[value.toLowerCase()] || value;
}

function normalizeStyles(style) {
  if (Array.isArray(style)) {
    return style.flatMap(normalizeStyles).filter(Boolean);
  }

  const value = String(style || "").trim();
  if (!value) return [];
  return STYLE_MAP[value.toLowerCase()] || [value];
}

function normalizeSupplier(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    region: row.region,
    city: row.city,
    priceMin: row.min_budget ?? row.price_min_ils ?? null,
    priceMax: row.max_budget ?? row.price_max_ils ?? null,
    priceUnit: row.price_unit || "",
    guestCapacityMin: row.guest_capacity_min ?? null,
    guestCapacityMax: row.guest_capacity_max ?? null,
    styles: row.style_tags || row.styles || [],
    tags: row.tags || [],
    description: row.description || "",
    contactInfo: row.contact_info || "",
    websiteUrl: row.website_url || "",
    isDemo: row.is_demo ?? true,
    infoSource: row.info_source || "",
    lastReviewedAt: row.last_reviewed_at || "",
  };
}

function getTargetBudget(category, budget, guests) {
  const totalBudget = Number(budget) || 0;
  const guestCount = Number(guests) || 0;
  const share = CATEGORY_BUDGET_SHARE[category] || 0.08;
  const categoryBudget = Math.round(totalBudget * share);

  if (category === "קייטרינג") {
    return {
      amount: guestCount > 0 ? Math.round(categoryBudget / guestCount) : 0,
      totalAmount: categoryBudget,
      unit: "לאורח",
    };
  }

  return {
    amount: categoryBudget,
    totalAmount: categoryBudget,
    unit: "לחבילה",
  };
}

function scoreBudget(supplier, target) {
  if (!target.amount || supplier.priceMin == null) {
    return { score: 0, reason: "" };
  }

  const min = Number(supplier.priceMin);
  const max = Number(supplier.priceMax ?? supplier.priceMin);
  const isInRange = min <= target.amount && target.amount <= max;

  if (isInRange) {
    return { score: 5, reason: "נמצא בטווח התקציב המשוער" };
  }

  if (min <= target.amount * 1.15) {
    return { score: 4, reason: "קרוב מאוד למסגרת התקציב" };
  }

  if (min <= target.amount * 1.35) {
    return { score: 2, reason: "מעט מעל המסגרת, שווה בדיקה" };
  }

  return { score: 0, reason: "" };
}

function scoreSupplier(supplier, context) {
  let score = 0;
  const reasons = [];

  if (supplier.region && supplier.region === context.region) {
    score += 6;
    reasons.push("מתאים לאזור שבחרתם");
  }

  const budgetScore = scoreBudget(supplier, context.targetBudget);
  score += budgetScore.score;
  if (budgetScore.reason) reasons.push(budgetScore.reason);

  const styles = Array.isArray(supplier.styles) ? supplier.styles : [];
  const styleMatches = styles.filter((style) => context.styles.includes(style));
  if (styleMatches.length) {
    score += styleMatches.length * 2;
    reasons.push(`מתאים לסגנון ${styleMatches.slice(0, 2).join(", ")}`);
  }

  if (
    context.guests > 0 &&
    supplier.guestCapacityMin != null &&
    supplier.guestCapacityMax != null &&
    supplier.guestCapacityMin <= context.guests &&
    context.guests <= supplier.guestCapacityMax
  ) {
    score += 3;
    reasons.push("מתאים לכמות האורחים");
  }

  if (!reasons.length) {
    reasons.push("התאמה ראשונית לפי נתוני השאלון");
  }

  return {
    ...supplier,
    score,
    reason: reasons.join(" · "),
  };
}

async function fetchSuppliersFromDatabase(category) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const { data, error } = await supabase
    .from("suppliers")
    .select(`
      id,
      name,
      category,
      region,
      city,
      min_budget,
      max_budget,
      price_unit,
      guest_capacity_min,
      guest_capacity_max,
      style_tags,
      tags,
      description,
      contact_info,
      website_url,
      is_demo,
      is_active,
      info_source,
      last_reviewed_at
    `)
    .eq("is_active", true)
    .eq("category", category);

  if (error) {
    throw new Error(`Supplier database query failed: ${error.message}`);
  }

  return data.map(normalizeSupplier);
}

function fetchSuppliersFromDemoCatalog(category) {
  return suppliersData.suppliers
    .filter((supplier) => supplier.is_active && supplier.category === category)
    .map(normalizeSupplier);
}

function rankSuppliers(suppliers, context) {
  return suppliers
    .map((supplier) => scoreSupplier(supplier, context))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.priceMin ?? Number.MAX_SAFE_INTEGER) - (b.priceMin ?? Number.MAX_SAFE_INTEGER);
    });
}

async function recommendSupplierCategory({ category, region, region_id, budget, guests, style }) {
  if (!NON_VENUE_CATEGORIES.has(category)) {
    const allowed = Array.from(NON_VENUE_CATEGORIES).join(", ");
    throw new Error(`Unsupported supplier category. Allowed categories: ${allowed}`);
  }

  const targetBudget = getTargetBudget(category, budget, guests);
  const context = {
    category,
    region: normalizeRegion(region || region_id),
    budget: Number(budget) || 0,
    guests: Number(guests) || 0,
    styles: normalizeStyles(style),
    targetBudget,
  };

  let source = "supabase";
  let suppliers = null;

  try {
    suppliers = await fetchSuppliersFromDatabase(category);
  } catch (err) {
    console.warn(`WedWise supplier DB fallback: ${err.message}`);
  }

  if (!suppliers) {
    source = "demo-json";
    suppliers = fetchSuppliersFromDemoCatalog(category);
  }

  return {
    category,
    source,
    region: context.region,
    targetBudget,
    suppliers: rankSuppliers(suppliers, context).slice(0, 3),
  };
}

function getRecommendations(submission) {
  const { region, budget, guests, wedding_style } = submission;
  const context = {
    region: normalizeRegion(region),
    budget: Number(budget) || 0,
    guests: Number(guests) || 0,
    styles: normalizeStyles(wedding_style),
    targetBudget: {
      amount: guests > 0 ? Math.floor(Number(budget) / Number(guests)) : 0,
      unit: "לאורח",
    },
  };

  const activeSuppliers = suppliersData.suppliers
    .filter((supplier) => supplier.is_active)
    .map(normalizeSupplier);

  const seen = {};
  const results = [];

  for (const supplier of rankSuppliers(activeSuppliers, context)) {
    if (results.length >= 10) break;
    const cat = supplier.category;
    if (!seen[cat]) seen[cat] = 0;
    if (seen[cat] < 3) {
      seen[cat]++;
      results.push(supplier);
    }
  }

  return results;
}

module.exports = {
  getRecommendations,
  recommendSupplierCategory,
  NON_VENUE_CATEGORIES,
};
