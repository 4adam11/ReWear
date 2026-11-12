import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { Truck, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";

import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { thumb, PLACEHOLDER_IMAGE } from "../utils/image";
import StatusBadge from "../components/ui/StatusBadge";
import OrderProgress from "../components/orders/OrderProgress";
import { isRentalOrder } from "../utils/orders";
import { money } from "../utils/format";
import { ReviewBox, ProblemBox, DisputeBanner } from "../components/orders/OrderExtras";
import usePageTitle from "../hooks/usePageTitle";
import { toast, confirmAction } from "../utils/feedback";

const PAYMENT = { card: "Card", upi: "UPI", cod: "Cash on delivery" };

const TIMELINE_LABEL = {
  confirmed: "Order confirmed",
  accepted: "Accepted by seller",
  shipped: "Shipped",
  delivered: "Delivered",
  returned: "Returned to seller",
  dispute_opened: "Problem reported",
  dispute_closed: "Problem report closed",
  refunded: "Refunded",
  completed: "Completed",
  cancelled: "Cancelled",
};

const OrderCard = ({ order, onUpdate }) => {
  const { authHeader } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const rental = isRentalOrder(order);
  const status = order.status === "placed" ? "confirmed" : order.status;

  const act = async (action, confirmText) => {
    if (confirmText && !(await confirmAction(confirmText))) return;

    setBusy(true);
    try {
      const { data } = await axios.patch(`${API}/orders/${order._id}/${action}`, {}, authHeader);
      onUpdate({ ...order, ...data, seller: order.seller });
    } catch (err) {
      toast.error(err.response?.data?.message || "That didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="bg-white border border-line rounded-sm overflow-hidden">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-cream border-b border-line text-sm">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted">
          <span>
            Ordered <span className="text-ink">{format(new Date(order.createdAt), "d MMM yyyy")}</span>
          </span>
          <span>
            Total <span className="text-ink font-medium">{money(order.total)}</span>
          </span>
          <span>
            Sold by <span className="text-ink">{order.seller?.name || "a ReWear seller"}</span>
          </span>
        </div>

        <span className="font-mono text-xs text-muted">#{order._id.slice(-6).toUpperCase()}</span>
      </div>

      <div className="p-5 space-y-5">

        {/* STATUS */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          {rental && <span className="text-xs text-muted">Rental</span>}
          <span className="text-xs text-muted">· {PAYMENT[order.paymentMethod]}</span>
        </div>

        {status === "refunded" ? (
          <p className="text-sm text-muted">This order was refunded after a problem report.</p>
        ) : status === "cancelled" ? (
          <p className="text-sm text-danger">
            Cancelled by the {order.cancel?.by || "buyer"}
            {order.cancel?.reason ? `: ${order.cancel.reason}` : "."}
          </p>
        ) : (
          <OrderProgress order={order} />
        )}

        {/* TRACKING */}
        {order.shipping?.trackingNumber && (
          <div className="flex items-center gap-2 text-sm text-ink-soft rounded-sm bg-cream px-3 py-2">
            <Truck size={16} />
            {order.shipping.courier} · Tracking <span className="font-mono">{order.shipping.trackingNumber}</span>
          </div>
        )}

        {/* ITEMS */}
        <ul className="divide-y divide-line-soft">
          {order.items.map((item, idx) => (
            <li key={idx} className="py-3 first:pt-0 flex gap-4">
              <Link to={`/product/${item.product}`} className="flex-shrink-0">
                <img
                  src={thumb(item.image || item.images?.[0], 200) || PLACEHOLDER_IMAGE}
                  alt={item.title}
                  loading="lazy"
                  className="w-16 h-20 rounded-sm object-cover border border-line"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.product}`} className="font-medium text-ink hover:underline">
                  {item.title || "Item"}
                </Link>
                <p className="text-sm text-muted">
                  {item.mode === "rent"
                    ? `Rent ${format(new Date(item.rentStart), "d MMM")} – ${format(new Date(item.rentEnd), "d MMM")} (${item.days} day${item.days > 1 ? "s" : ""})`
                    : "Bought"}
                </p>
              </div>

              <p className="text-sm font-medium text-ink whitespace-nowrap">{money(item.lineTotal)}</p>
            </li>
          ))}
        </ul>

        {/* WHAT HAPPENS NEXT */}
        {status === "delivered" && rental && (
          <p className="text-sm text-muted">
            Please return the outfit to the seller by{" "}
            {format(new Date(Math.max(...order.items.map((i) => new Date(i.rentEnd || 0)))), "d MMM")}. The order completes when they confirm it's back.
          </p>
        )}

        <DisputeBanner dispute={order.dispute} />

        {/* ACTIONS + DETAILS */}
        <div className="flex flex-wrap items-center gap-2">
          {status === "completed" && (
            <ReviewBox order={order} onDone={(rating) => onUpdate({ ...order, reviewRating: rating })} />
          )}

          {["shipped", "delivered"].includes(status) && order.dispute?.status !== "open" && (
            <ProblemBox order={order} role="buyer" onDone={(dispute) => onUpdate({ ...order, dispute })} />
          )}

          {status === "shipped" && (
            <button
              disabled={busy}
              onClick={() => act("deliver")}
              className="btn btn-dark btn-sm"
            >
              I've received it
            </button>
          )}

          {status === "delivered" && !rental && order.dispute?.status !== "open" && (
            <button
              disabled={busy}
              onClick={() =>
                act("complete", {
                  title: "Complete this order?",
                  body: "Check everything is as described first. Once the order is completed you can't report a problem with it, but you can leave a review.",
                  confirmLabel: "Complete order",
                })
              }
              className="btn btn-dark btn-sm"
            >
              Everything's fine, complete order
            </button>
          )}

          {["confirmed", "accepted"].includes(status) && (
            <button
              disabled={busy}
              onClick={() =>
                act("cancel", {
                  title: "Cancel this order?",
                  body: "The seller will be told, and the item goes back on sale.",
                  confirmLabel: "Cancel order",
                  cancelLabel: "Keep order",
                  danger: true,
                })
              }
              className="px-4 py-2 rounded-sm border border-danger-line text-danger text-sm font-medium hover:bg-danger-tint disabled:opacity-40"
            >
              Cancel order
            </button>
          )}

          {order.items[0]?.product && (
            <Link to={`/messages/new?product=${order.items[0].product}`} className="text-sm font-semibold text-brand hover:underline">
              Message seller
            </Link>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="ml-auto inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
          >
            {open ? "Hide details" : "Order details"}
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {open && (
          <div className="grid sm:grid-cols-2 gap-5 border-t border-line pt-4 text-sm">
            <div>
              <p className="font-medium text-ink">Delivery address</p>
              <p className="mt-1 text-muted">{order.address?.name}</p>
              <p className="text-muted">{order.address?.address}</p>
              <p className="text-muted">{order.address?.phone}</p>

              <p className="mt-4 font-medium text-ink">Payment</p>
              <p className="mt-1 text-muted">
                Items {money(order.subtotal)}
                {order.discount > 0 && ` · Discount −${money(order.discount)}`} · Total {money(order.total)}
              </p>
            </div>

            <div>
              <p className="font-medium text-ink">History</p>
              <ol className="mt-2 space-y-2">
                {(order.timeline || []).map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-faint flex-shrink-0" />
                    <div>
                      <p className="text-ink">{TIMELINE_LABEL[t.status] || t.status}</p>
                      <p className="text-xs text-muted">
                        {format(new Date(t.at), "d MMM yyyy, HH:mm")}
                        {t.note ? ` · ${t.note}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

const FILTERS = [
  { key: "all", label: "All orders" },
  { key: "active", label: "In progress" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "refunded", label: "Refunded" },
];

const Orders = () => {
  usePageTitle("My orders");
  const { authHeader } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${API}/orders`, authHeader)
      .then(({ data }) => setOrders(data))
      .catch(() => setError("Failed to load orders"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = orders.filter((o) =>
    filter === "all" ? true
      : filter === "active" ? !["completed", "cancelled", "refunded"].includes(o.status)
        : o.status === filter
  );

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        <div>
          <h1 className="page-title">My orders</h1>
          <p className="mt-1 text-sm text-muted">Track deliveries, rentals and returns.</p>
        </div>

        <div className="tab-bar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`tab ${filter === f.key ? "tab-active" : ""}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-56 rounded-sm bg-white border border-line animate-pulse" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-sm border border-dashed border-line-strong bg-white py-16 text-center">
            <ShoppingBag className="mx-auto text-faint" size={28} />
            <p className="mt-3 text-ink font-medium">No orders here</p>
            <Link to="/explore" className="mt-2 inline-block text-sm text-brand hover:underline">
              Browse pre-loved fashion
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {shown.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onUpdate={(updated) => setOrders((list) => list.map((o) => (o._id === updated._id ? updated : o)))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
