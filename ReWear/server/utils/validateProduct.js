import { CATEGORIES, SIZES, CONDITIONS, normalizeCategory } from "./catalog.js";

const MAX_IMAGES = 6;
const MAX_IMAGE_CHARS = 500;
// Photos are uploaded (and moderated) through /api/uploads first; listings only carry the URLs
const IMAGE_RE = /^https:\/\/\S+$/;

const optionalString = (value, max) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.trim().length > max) return null;
  return value.trim();
};

const optionalPrice = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1000000) return null;
  return n;
};

// Builds a product from an allow-list of fields so clients can't set _id, user, timestamps, etc.
// Returns { error } or { data }.
export const validateProduct = (body) => {
  const title = optionalString(body.title, 120);
  if (!title) return { error: "Title is required (max 120 characters)" };

  const mode = body.mode === "sale" ? "sell" : body.mode;
  if (!["sell", "rent", "both"].includes(mode)) {
    return { error: "Mode must be sell, rent or both" };
  }

  const price = optionalPrice(body.price);
  const rent = optionalPrice(body.rent);
  if (price === null || rent === null) return { error: "Invalid price" };

  if ((mode === "sell" || mode === "both") && !(price > 0)) {
    return { error: "A selling price is required" };
  }
  if ((mode === "rent" || mode === "both") && !(rent > 0)) {
    return { error: "A rent per day is required" };
  }

  const images = body.images;
  if (!Array.isArray(images) || images.length === 0 || images.length > MAX_IMAGES) {
    return { error: `Add between 1 and ${MAX_IMAGES} images` };
  }
  for (const img of images) {
    if (typeof img !== "string" || img.length > MAX_IMAGE_CHARS || !IMAGE_RE.test(img)) {
      return { error: "Invalid image link" };
    }
  }

  const fields = {
    description: optionalString(body.description, 2000),
    category: optionalString(body.category, 50),
    size: optionalString(body.size, 10),
    condition: optionalString(body.condition, 30)
  };
  for (const [key, value] of Object.entries(fields)) {
    if (value === null) return { error: `Invalid ${key}` };
  }

  // Only the options the site offers, so every listing can be found by the filters
  fields.category = normalizeCategory(fields.category);
  if (!CATEGORIES.includes(fields.category)) return { error: "Please choose a category" };
  if (!SIZES.includes(fields.size)) return { error: "Please choose a size" };
  if (!CONDITIONS.includes(fields.condition)) return { error: "Please choose a condition" };

  // Sell page sends react-date-range's [{ startDate, endDate }]
  let availability;
  const range = Array.isArray(body.availability) ? body.availability[0] : body.availability;
  if (range && (mode === "rent" || mode === "both")) {
    const startDate = new Date(range.startDate);
    const endDate = new Date(range.endDate);
    if (isNaN(startDate) || isNaN(endDate) || endDate < startDate) {
      return { error: "Invalid availability dates" };
    }
    availability = { startDate, endDate };
  }

  return {
    data: {
      title,
      mode,
      price: mode === "rent" ? undefined : price,
      rent: mode === "sell" ? undefined : rent,
      images,
      availability,
      ...fields
    }
  };
};
