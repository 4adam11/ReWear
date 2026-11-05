import { format } from "date-fns";
import { Check } from "lucide-react";

export const isRentalOrder = (order) => (order.items || []).some((i) => i.mode === "rent");

const steps = (order) =>
  isRentalOrder(order)
    ? ["confirmed", "accepted", "shipped", "delivered", "returned"]
    : ["confirmed", "accepted", "shipped", "delivered", "completed"];

const LABELS = {
  confirmed: "Confirmed",
  accepted: "Accepted",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  returned: "Returned",
};

// Where the order is in its journey; rentals finish at "returned"
const reachedIndex = (order) => {
  const list = steps(order);
  const status = order.status === "placed" ? "confirmed" : order.status;

  if (status === "completed") return list.length - 1;
  return Math.max(list.indexOf(status), 0);
};

// When each step happened, from the order's timeline
const stepTime = (order, step) => {
  const entry = [...(order.timeline || [])].reverse().find((t) => t.status === step);
  return entry ? format(new Date(entry.at), "d MMM") : null;
};

// Amazon-style progress bar: Confirmed -> Accepted -> Shipped -> Delivered -> Completed/Returned
const OrderProgress = ({ order }) => {
  if (order.status === "cancelled") return null;

  const list = steps(order);
  const reached = reachedIndex(order);

  return (
    <ol className="flex items-start w-full">
      {list.map((step, i) => {
        const done = i <= reached;
        const time = done ? stepTime(order, step) : null;

        return (
          <li key={step} className="flex-1 flex flex-col items-center relative">
            {i > 0 && (
              <span
                className={`absolute top-3 right-1/2 w-full h-0.5 ${i <= reached ? "bg-emerald-500" : "bg-gray-200"}`}
                aria-hidden="true"
              />
            )}

            <span
              className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 ${done ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-gray-300"}`}
            >
              {done && <Check size={14} strokeWidth={3} />}
            </span>

            <span className={`mt-1.5 text-[11px] sm:text-xs text-center ${done ? "text-gray-900 font-medium" : "text-gray-400"}`}>
              {LABELS[step]}
            </span>
            {time && <span className="text-[10px] text-gray-400">{time}</span>}
          </li>
        );
      })}
    </ol>
  );
};

export default OrderProgress;
