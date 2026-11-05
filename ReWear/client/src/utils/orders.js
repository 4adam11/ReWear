// An order with any rented item follows the rental flow (returned instead of completed by the buyer)
export const isRentalOrder = (order) => (order.items || []).some((i) => i.mode === "rent");
