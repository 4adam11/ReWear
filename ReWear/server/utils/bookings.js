import Order from "../models/Order.js";

export const DAY_MS = 24 * 60 * 60 * 1000;

// Rental dates are calendar days ("2026-11-12"), stored as UTC midnight,
// so time zones can't shift a booking by a day.
export const parseDay = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCDate() === d ? date : null;
};

export const todayUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

// Rentals on this product that haven't ended yet (cancelled orders don't count)
export const upcomingRentals = async (productId) => {
  const orders = await Order.find({
    status: "placed",
    items: {
      $elemMatch: { product: productId, mode: "rent", rentEnd: { $gte: todayUtc() } },
    },
  }).select("items");

  return orders
    .flatMap((o) => o.items)
    .filter((i) => i.mode === "rent" && i.product.toString() === productId.toString() && i.rentEnd >= todayUtc())
    .map((i) => ({ start: i.rentStart, end: i.rentEnd }))
    .sort((a, b) => a.start - b.start);
};

// True if [start, end] (inclusive days) overlaps an existing booking
export const hasRentalClash = (productId, start, end) =>
  Order.exists({
    status: "placed",
    items: {
      $elemMatch: {
        product: productId,
        mode: "rent",
        rentStart: { $lte: end },
        rentEnd: { $gte: start },
      },
    },
  });

// Runs fn while holding a per-product lock, so two orders for the same item
// can't both pass the availability check at the same moment (single server process).
const locks = new Map();

export const withProductLocks = async (productIds, fn) => {
  const ids = [...new Set(productIds.map(String))].sort();
  const previous = ids.map((id) => locks.get(id) || Promise.resolve());

  let release;
  const current = new Promise((resolve) => (release = resolve));
  ids.forEach((id) => locks.set(id, current));

  await Promise.all(previous);

  try {
    return await fn();
  } finally {
    release();
    ids.forEach((id) => {
      if (locks.get(id) === current) locks.delete(id);
    });
  }
};
