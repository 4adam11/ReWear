// Must match server/utils/catalog.js so every listing can be found by the filters
export const CATEGORIES = [
  { value: "wedding", label: "Wedding" },
  { value: "party", label: "Party" },
  { value: "ethnic", label: "Ethnic" },
  { value: "casual", label: "Casual" },
  { value: "streetwear", label: "Streetwear" },
  { value: "designer", label: "Designer" },
];

export const SIZES = ["S", "M", "L", "XL", "XXL"];

export const CONDITIONS = ["New", "Like New", "Good", "Used"];

export const categoryLabel = (value) =>
  CATEGORIES.find((c) => c.value === value)?.label || value;
