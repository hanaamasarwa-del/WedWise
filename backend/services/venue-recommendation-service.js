/**
 * Venue recommendation service.
 *
 * Given a couple's region, total budget and guest count, returns the 3 best-matching
 * wedding venues from the curated regional data files (data/venues/*.json).
 *
 * Matching never hard-excludes venues — every venue in the region gets a score, so the
 * service can always return 3 results even when a region is sparse or data is missing.
 */

const path = require("path");

// region_id (from the questionnaire) -> regional data file
const REGION_FILES = {
  1: "venues_jerusalem.json", // ירושלים והסביבה
  2: "venues_central.json", //   המרכז (Sharon + Shfela + Tel Aviv)
  3: "venues_north.json", //     הצפון
  4: "venues_south.json", //     הדרום
};

// Share of the total budget the report allocates to the venue itself.
const VENUE_BUDGET_SHARE = 0.45;

const venuesByRegion = {};
function loadRegion(regionId) {
  if (venuesByRegion[regionId]) return venuesByRegion[regionId];
  const file = REGION_FILES[regionId];
  if (!file) return [];
  const data = require(path.join(__dirname, "..", "data", "venues", file));
  venuesByRegion[regionId] = data;
  return data;
}

function buildMapsUrl(venue) {
  const parts = [venue.name_hebrew || venue.name_english, venue.address || venue.city, "אולם אירועים"]
    .filter(Boolean)
    .join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts)}`;
}

function scoreVenue(venue, perGuestBudget, guests) {
  const reasons = [];

  // ── Budget score (0–100) ──
  let budgetScore = 50;
  const min = venue.price_per_person_min;
  const max = venue.price_per_person_max ?? min;
  if (perGuestBudget > 0 && min != null) {
    if (max <= perGuestBudget) {
      budgetScore = 100; // fully within budget
      reasons.push("מתאים לתקציב שלכם");
    } else if (min <= perGuestBudget) {
      budgetScore = 75; // entry price affordable, upper range a stretch
      reasons.push("בטווח התקציב שלכם");
    } else {
      // above budget — degrade by how far over the cheapest seat is
      const over = (min - perGuestBudget) / perGuestBudget;
      budgetScore = Math.max(10, 60 - over * 60);
    }
  }

  // ── Capacity score (0–100) ──
  let capacityScore = 45; // neutral when capacity data is missing
  const cMin = venue.capacity_min;
  const cMax = venue.capacity_max;
  if (guests > 0 && cMin != null && cMax != null) {
    if (guests >= cMin && guests <= cMax) {
      capacityScore = 100;
      reasons.push("מתאים למספר האורחים");
    } else {
      const dist = guests < cMin ? (cMin - guests) / cMin : (guests - cMax) / cMax;
      capacityScore = dist <= 0.15 ? 65 : Math.max(10, 60 - dist * 80);
    }
  }

  const score = budgetScore * 0.6 + capacityScore * 0.4;
  return { score, reasons };
}

/**
 * @param {{ region_id:number, budget:number, guests:number }} input
 * @returns {{ region_id:number, perGuestBudget:number, venues:Array }}
 */
function recommendVenues({ region_id, budget, guests }) {
  const regionId = Number(region_id);
  const totalBudget = Number(budget) || 0;
  const guestCount = Number(guests) || 0;
  const perGuestBudget =
    guestCount > 0 ? Math.round((totalBudget * VENUE_BUDGET_SHARE) / guestCount) : 0;

  const pool = loadRegion(regionId);

  const ranked = pool
    .map((v) => {
      const { score, reasons } = scoreVenue(v, perGuestBudget, guestCount);
      return {
        id: v.id,
        name: v.name_hebrew || v.name_english,
        nameEnglish: v.name_english || null,
        city: v.city || null,
        address: v.address || null,
        region: v.region || null,
        priceMin: v.price_per_person_min ?? null,
        priceMax: v.price_per_person_max ?? null,
        capacityMin: v.capacity_min ?? null,
        capacityMax: v.capacity_max ?? null,
        imageUrl: v.image_url || null,
        imageIsGeneric: v.image_is_generic === true,
        website: v.website || null,
        mapsUrl: buildMapsUrl(v),
        reason: reasons.join(" · ") || "התאמה אזורית",
        score: Math.round(score),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return { region_id: regionId, perGuestBudget, venues: ranked };
}

module.exports = { recommendVenues, REGION_FILES };
