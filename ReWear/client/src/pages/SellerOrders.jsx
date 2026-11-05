import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Truck, MapPin, Check, X } from "lucide-react";

import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { thumb, PLACEHOLDER_IMAGE } from "../utils/image";
import StatusBadge from "../components/ui/StatusBadge";
import OrderProgress from "../components/orders/OrderProgress";
import { isRentalOrder } from "../utils/orders";
import { money } from "../utils/format";
import { ProblemBox, DisputeBanner } from "../components/orders/OrderExtras";
import usePageTitle from "../hooks/usePageTitle";

const TABS = [
  { key: "confirmed", label: "New" },
  { key: "accepted", label: "To ship" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "refunded", label: "Refunded" },
];

const COURIERS = ["Delhivery", "Blue Dart", "DTDC", "Ekart", "India Post", "Self delivery"];

const statusOf = (o) => (o.status === "placed" ? "confirmed" : o.status);

const SaleCard = ({ order, onUpdate }) => {
  const { authHeader } = useAuth();
  const [form, setForm] = useState(null); // "ship" | "decline"
  const [courier, setCourier] = useState(COURIERS[0]);
  const [tracking, setTracking] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const status = statusOf(order);
  const rental = isRentalOrder(order);
  const returnBy = rental
    ? new Date(Math.max(...order.items.map((i) => new Date(i.rentEnd || 0))))
    : null;

  const act = async (action, body = {}) => {
    setBusy(true);
    setError("");

    try {
      const { data } = await axios.patch(`${API}/orders/${order._id}/${action}`, body, authHeader);
      onUpdate({ ...order, ...data, items: order.items, buyer: order.buyer });
      setForm(null);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="bg-white border border-line rounded-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-gray-50 border-b border-line text-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-gray-600">
          <StatusBadge status={status} />
          <span>
            {format(new Date(order.createdAt), "d MMM yyyy, HH:mm")}
          </span>
          <span>
            Buyer <span className="text-ink">{order.buyer || "—"}</span>
          </span>
          <span>
            You earn <span className="text-ink font-medium">{money(order.earnings)}</span>
          </span>
        </div>
        <span className="font-mono text-xs text-muted">#{order._id.slice(-6).toUpperCase()}</span>
      </div>

      <div className="p-5 grid md:grid-cols-[1fr_260px] gap-6">
        <div className="space-y-4 min-w-0">
          {status === "refunded" ? (
            <p className="text-sm text-muted">Refunded to the buyer after a problem report.</p>
          ) : status === "cancelled" ? (
            <p className="text-sm text-red-700">
              Cancelled by the {order.cancel?.by || "buyer"}
              {order.cancel?.reason ? `: ${order.cancel.reason}` : "."}
            </p>
          ) : (
            <OrderProgress order={order} />
          )}

          <ul className="divide-y divide-gray-100">
            {order.items.map((item, idx) => (
              <li key={idx} className="py-3 first:pt-0 flex gap-4">
                <img
                  src={thumb(item.image, 200) || PLACEHOLDER_IMAGE}
                  alt={item.title}
                  loading="lazy"
                  className="w-14 h-16 rounded-lg object-cover border border-line flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">{item.title}</p>
                  <p className="text-sm text-gray-600">
                    {item.mode === "rent"
                      ? `Rental ${format(new Date(item.rentStart), "d MMM")} – ${format(new Date(item.rentEnd), "d MMM")}`
                      : "Sale"}
                  </p>
                </div>
                <p className="text-sm text-ink whitespace-nowrap">{money(item.lineTotal)}</p>
              </li>
            ))}
          </ul>

          {order.shipping?.trackingNumber && (
            <p className="flex items-center gap-2 text-sm text-gray-700">
              <Truck size={16} />
              {order.shipping.courier} · <span className="font-mono">{order.shipping.trackingNumber}</span>
            </p>
          )}

          {/* WHAT TO DO NEXT */}
          {status === "delivered" && !rental && (
            <p className="text-sm text-muted">Waiting for the buyer to confirm everything is as described.</p>
          )}
          {status === "delivered" && rental && (
            <p className="text-sm text-muted">Due back by {format(returnBy, "d MMM yyyy")}. Confirm once you have it.</p>
          )}

          <DisputeBanner dispute={order.dispute} />

          {status === "delivered" && rental && order.dispute?.status !== "open" && !form && (
            <ProblemBox order={order} role="seller" onDone={(dispute) => onUpdate({ ...order, dispute })} />
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* SHIP FORM */}
          {form === "ship" && (
            <div className="rounded-sm border border-line p-4 space-y-3">
              <p className="text-sm font-medium text-ink">Shipping details</p>
              <div className="flex flex-wrap gap-3">
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="rounded-sm border border-line px-3 py-2 text-sm bg-white"
                >
                  {COURIERS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder={courier === "Self delivery" ? "e.g. Hand-delivered" : "Tracking number"}
                  className="flex-1 min-w-[180px] rounded-sm border border-line px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  disabled={busy || !tracking.trim()}
                  onClick={() => act("ship", { courier, trackingNumber: tracking })}
                  className="btn btn-dark btn-sm"
                >
                  Mark as shipped
                </button>
                <button onClick={() => setForm(null)} className="btn btn-outline btn-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* DECLINE FORM */}
          {form === "decline" && (
            <div className="rounded-sm border border-line p-4 space-y-3">
              <p className="text-sm font-medium text-ink">Why can't you fulfil this order?</p>
              <p className="text-xs text-muted -mt-2">The buyer will see this, and the item goes back on sale.</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="e.g. Found a stain while packing"
                className="w-full rounded-sm border border-line px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  disabled={busy || reason.trim().length < 5}
                  onClick={() => act("cancel", { reason })}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-40"
                >
                  Cancel order
                </button>
                <button onClick={() => setForm(null)} className="btn btn-outline btn-sm">
                  Back
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ADDRESS + ACTIONS */}
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <p className="flex items-center gap-1.5 font-medium text-ink">
              <MapPin size={14} />
              Ship to
            </p>
            <p className="mt-1 text-gray-700">{order.address?.name}</p>
            <p className="text-gray-600">{order.address?.address}</p>
            <p className="text-gray-600">{order.address?.phone}</p>
          </div>

          {!form && (
            <div className="flex flex-col gap-2">
              {status === "confirmed" && (
                <button
                  disabled={busy}
                  onClick={() => act("accept")}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-40"
                >
                  <Check size={16} />
                  Accept order
                </button>
              )}

              {status === "accepted" && (
                <button
                  onClick={() => setForm("ship")}
                  className="btn btn-dark btn-sm"
                >
                  <Truck size={16} />
                  Mark as shipped
                </button>
              )}

              {status === "shipped" && (
                <button
                  disabled={busy}
                  onClick={() => act("deliver")}
                  className="btn btn-dark btn-sm"
                >
                  Mark as delivered
                </button>
              )}

              {status === "delivered" && rental && order.dispute?.status !== "open" && (
                <button
                  disabled={busy}
                  onClick={() => window.confirm("Confirm the outfit has been returned to you?") && act("return")}
                  className="btn btn-dark btn-sm"
                >
                  Confirm return
                </button>
              )}

              {["confirmed", "accepted"].includes(status) && (
                <button
                  onClick={() => setForm("decline")}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50"
                >
                  <X size={16} />
                  {status === "confirmed" ? "Decline" : "Cancel order"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

const SellerOrders = () => {
  usePageTitle("Orders to fulfil");
  const { authHeader } = useAuth();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("confirmed");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/orders/sales`, authHeader)
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = Object.fromEntries(TABS.map((t) => [t.key, orders.filter((o) => statusOf(o) === t.key).length]));
  const shown = orders.filter((o) => statusOf(o) === tab);

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <div>
          <h1 className="page-title">Orders to fulfil</h1>
          <p className="mt-1 text-sm text-muted">Accept new orders, ship them with tracking, and confirm rental returns.</p>
        </div>

        <div className="tab-bar">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`tab ${tab === t.key ? "tab-active" : ""}`}
            >
              {t.label}
              <span className={`ml-1.5 ${counts[t.key] && ["confirmed", "accepted"].includes(t.key) && tab !== t.key ? "text-pink-700 font-semibold" : "opacity-70"}`}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-48 rounded-sm bg-white border border-line animate-pulse" />
        ) : shown.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
            <p className="text-ink font-medium">Nothing here</p>
            <p className="mt-1 text-sm text-muted">
              {tab === "confirmed" ? "No new orders right now." : "No orders in this stage."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {shown.map((o) => (
              <SaleCard
                key={o._id}
                order={o}
                onUpdate={(updated) => setOrders((list) => list.map((x) => (x._id === updated._id ? updated : x)))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOrders;
