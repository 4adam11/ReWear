import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AlertTriangle, ArrowRight } from "lucide-react";

import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const Stat = ({ label, value, to, tone = "text-ink" }) => {
  const body = (
    <div className="bg-white border border-line rounded-lg p-5 h-full hover:border-gray-300 transition">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  );

  return to ? <Link to={to}>{body}</Link> : body;
};

const AdminOverview = () => {
  const { authHeader } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${API}/admin/stats`, authHeader)
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.response?.data?.message || "Could not load stats"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!stats) return <div className="h-40 rounded-lg bg-white border border-line animate-pulse" />;

  const { listings } = stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Overview</h1>
        <p className="mt-1 text-sm text-muted">What needs your attention today.</p>
      </div>

      {listings.pending > 0 && (
        <Link
          to="/admin/listings"
          className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800 hover:bg-amber-100 transition"
        >
          <span className="flex items-center gap-3 text-sm font-medium">
            <AlertTriangle size={18} />
            {listings.pending} listing{listings.pending === 1 ? "" : "s"} waiting for review
            {stats.flagged > 0 && ` (${stats.flagged} flagged by the AI check)`}
          </span>
          <ArrowRight size={18} />
        </Link>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Listings</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="In review" value={listings.pending} to="/admin/listings" tone="text-amber-700" />
          <Stat label="Live" value={listings.live} to="/admin/listings?status=live" tone="text-emerald-700" />
          <Stat label="Rejected" value={listings.rejected} to="/admin/listings?status=rejected" />
          <Stat label="Paused" value={listings.paused} to="/admin/listings?status=paused" />
          <Stat label="Sold" value={listings.sold} to="/admin/listings?status=sold" />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Marketplace</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Users" value={stats.users} to="/admin/users" />
          <Stat label="Blocked users" value={stats.blocked} to="/admin/users" />
          <Stat label="Orders" value={stats.orders} to="/admin/orders" />
          <Stat label="Sales value" value={`₹${stats.revenue.toLocaleString("en-IN")}`} />
        </div>
      </section>
    </div>
  );
};

export default AdminOverview;
