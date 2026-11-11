// Picks a likely occasion for a new listing so sellers don't have to.
//  1. Words in the title or description decide it when they can ("bridal", "hoodie", "sequin"...).
//  2. Otherwise the photo check's hint (Indian or western wear) picks a sensible default.
// The seller can always change it. The first rule that matches wins, so order matters.
const RULES = [
  ["designer", /\b(designer|couture|runway|sabyasachi|manish malhotra|anita dongre|ritu kumar|tarun tahiliani)\b/i],
  ["wedding", /\b(bridal|bride|groom|wedding|shaadi|sherwani|lehenga|banarasi|reception)\b/i],
  ["party", /\b(party|sequins?|cocktail|gown|evening|sangeet|glitter|bodycon)\b/i],
  ["streetwear", /\b(hoodie|sweatshirt|tee|t-?shirt|graphic|oversized|cargo|bomber|sneakers|streetwear|utility|joggers?)\b/i],
  ["casual", /\b(casual|denim|jeans|shirt|everyday|khadi|linen|co-?ord|shorts)\b/i],
  ["ethnic", /\b(saree|sari|kurta|kurti|anarkali|salwar|dupatta|festive|chikankari|bandhani|ethnic|silk|bandhgala|palazzo)\b/i],
];

const STYLE_DEFAULT = { indian: "ethnic", western: "casual" };

// Returns { category, source: "title" | "photo" } or null when there is nothing to go on
export const suggestOccasion = ({ title = "", description = "", style } = {}) => {
  const text = `${title} ${description}`;
  const rule = RULES.find(([, re]) => re.test(text));
  if (rule) return { category: rule[0], source: "title" };

  return STYLE_DEFAULT[style] ? { category: STYLE_DEFAULT[style], source: "photo" } : null;
};
