// Single source of truth for listing options (the client has a matching list in src/utils/catalog.js)
export const CATEGORIES = ["wedding", "party", "ethnic", "casual", "streetwear", "designer"];
export const SIZES = ["S", "M", "L", "XL", "XXL"];
export const CONDITIONS = ["New", "Like New", "Good", "Used"];

// Older listings/filters used these spellings
export const normalizeCategory = (value) => {
  if (typeof value !== "string") return value;
  const v = value.trim().toLowerCase();
  return v === "street wear" ? "streetwear" : v;
};
