// Must match server/utils/catalog.js so every listing can be found by the filters.
// Each occasion has its own colour (used on tiles, banners and pills) and a short line of copy.
export const CATEGORIES = [
  { value: "wedding", label: "Wedding", title: "The Wedding Edit", tagline: "Lehengas, sherwanis and bridal sarees for the big day and every function around it.", color: "#7a2331", tint: "#f6e7e6" },
  { value: "party", label: "Party", title: "Party Picks", tagline: "Sequins, gowns and cocktail looks for sangeets, receptions and nights out.", color: "#5a2d58", tint: "#f2e9f1" },
  { value: "ethnic", label: "Ethnic", title: "Festive Ethnic", tagline: "Anarkalis, kurta sets and sarees for Diwali, Eid, pujas and family dinners.", color: "#8c5210", tint: "#f8eedd" },
  { value: "casual", label: "Casual", title: "Everyday Casual", tagline: "Kurtis, co-ords and easy cottons you'll actually wear every week.", color: "#4f6146", tint: "#ecf0e8" },
  { value: "streetwear", label: "Streetwear", title: "Street Style", tagline: "Graphic tees, hoodies, jackets and denim with a story already in them.", color: "#33363d", tint: "#ebecee" },
  { value: "designer", label: "Designer", title: "Designer Labels", tagline: "Designer and couture pieces at a fraction of the boutique price.", color: "#7a5a1e", tint: "#f5efe1" },
];

export const SIZES = ["S", "M", "L", "XL", "XXL"];

export const CONDITIONS = ["New", "Like New", "Good", "Used"];

// Optional garment measurements a seller can add (inches)
export const MEASUREMENTS = [
  { key: "bust", label: "Bust / chest" },
  { key: "waist", label: "Waist" },
  { key: "hips", label: "Hips" },
  { key: "length", label: "Length" },
  { key: "shoulder", label: "Shoulder" },
];

export const categoryInfo = (value) => CATEGORIES.find((c) => c.value === value);

export const categoryLabel = (value) => categoryInfo(value)?.label || value;
