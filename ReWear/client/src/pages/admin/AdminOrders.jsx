import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";

import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/ui/StatusBadge";
import usePageTitle from "../../hooks/usePageTitle";

const PAYMENT = { card: "Card", upi: "UPI", cod: "Cash on delivery" };

const AdminOrders = () => {
  usePageTitle("Admin · Orders");
  const { authHeader } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${API}/admin/orders`, authHeader)
      .then(({ data }) => setOrders(data))
      .catch((err) => setError(err.response?.data?.message || "Could not load orders"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Orders</h1>
        <p className="mt-1 text-sm text-muted">The 100 most recent orders across the marketplace.</p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="bg-white border border-line rounded-sm overflow-x-auto">
        <table className="w-full text-sm nums">
          <thead>
            <tr className="text-left text-muted border-b border-line">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Buyer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-line-soft">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-faint">Loading…</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">No orders yet.</td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o._id} className="hover:bg-cream align-top">
                  <td className="px-4 py-3 font-mono text-xs text-ink-soft">#{o._id.slice(-6).toUpperCase()}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{format(new Date(o.createdAt), "d MMM yyyy, HH:mm")}</td>
                  <td className="px-4 py-3">
                    <p className="text-ink">{o.user?.name || "Deleted user"}</p>
                    <p className="text-xs text-muted">{o.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {(o.items || []).map((i, idx) => (
                      <p key={idx} className="whitespace-nowrap">
                        {i.title || "Item"}
                        <span className="text-xs text-muted">
                          {" "}· {i.mode === "rent" ? `rent ${i.days}d` : "buy"}
                          {i.seller?.name ? ` · from ${i.seller.name}` : ""}
                        </span>
                      </p>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-muted">{PAYMENT[o.paymentMethod] || "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">₹{(o.total || 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status || "placed"} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
