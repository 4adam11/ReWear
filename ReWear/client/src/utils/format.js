// "₹1,23,456" (Indian digit grouping)
export const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
