import { Link, Navigate, useLocation } from "react-router-dom";
import { CircleCheck } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { money } from "../utils/format";
import usePageTitle from "../hooks/usePageTitle";

const NEXT = [
  "The seller gets your order and accepts it.",
  "They ship it and add the courier's tracking number.",
  "You confirm when it arrives. Rentals go back to the seller after your dates.",
];

const OrderSuccess = () => {
  usePageTitle("Order placed");
  const { state } = useLocation();
  const { user } = useAuth();
  const orders = state?.orders;

  // Only reachable straight after placing an order
  if (!orders?.length) return <Navigate to="/orders" replace />;

  const total = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const itemCount = orders.reduce((sum, o) => sum + o.items.length, 0);

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white border border-line rounded-sm p-7 sm:p-9">
        <CircleCheck size={40} className="text-[#3f6b4a]" />
        <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-[0.04em]">
          Order placed{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          {itemCount} item{itemCount > 1 ? "s" : ""} · {money(total)}
          {state.paymentMethod === "cod" ? " · Pay on delivery" : ""}
          {orders.length > 1 ? ` · split into ${orders.length} orders, one per seller` : ""}
        </p>

        <div className="mt-6 border-t border-[#efe6da] pt-5">
          <h2 className="text-sm font-bold">What happens next</h2>
          <ol className="mt-3 flex flex-col gap-2.5">
            {NEXT.map((text, i) => (
              <li key={text} className="flex gap-3 text-sm leading-relaxed">
                <span className="flex-none w-6 h-6 rounded-full bg-[#f1e6d8] text-brand text-xs font-bold flex items-center justify-center">{i + 1}</span>
                {text}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted">We'll send you a notification at every step.</p>
        </div>

        <div className="mt-7 flex flex-wrap gap-2.5">
          <Link to="/orders" className="btn btn-dark">
            Track your order
          </Link>
          <Link to="/explore" className="btn btn-outline">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
