// Shared by Cart and Checkout so both pages show the same numbers.
// `total` is set on the product page: the sale price, or rent per day x days.
export const getItemPrice = (item) =>
  item.total ?? item.price ?? item.rent ?? 0;

// Buying and renting the same product (or renting it for different dates) are separate lines
export const getCartKey = (item) =>
  item.cartKey ||
  [item._id || item.id, item.mode || "sale", item.rentStart || ""].join(":");

// Only what the server needs; it looks up real prices itself
export const toOrderItems = (items) =>
  items.map((item) => ({
    product: item._id || item.id,
    quantity: item.quantity || 1,
    mode: item.mode === "rent" ? "rent" : "sale",
    rentStart: item.rentStart,
    rentEnd: item.rentEnd,
  }));
