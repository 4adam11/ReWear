import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { Plus, ChevronRight } from "lucide-react";

import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { thumb, PLACEHOLDER_IMAGE } from "../utils/image";
import StatusBadge from "../components/ui/StatusBadge";
import { money } from "../utils/format";
import usePageTitle from "../hooks/usePageTitle";

const statusOf = (o) => (o.status === "placed" ? "confirmed" : o.status);

const Stat = ({ label, value, to, note }) => (
  <Link to={to} className="bg-white border border-line rounded-sm p-4 hover:border-brand transition-colors">
    <p className="text-[13px] text-muted">{label}</p>
    <p className="mt-1 text-2xl font-bold nums">{value}</p>
    {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
  </Link>
);

const Panel = ({ title, to, linkText, children }) => (
  <section className="bg-white border border-line rounded-sm">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-line-soft">
      <h2 className="text-base font-bold">{title}</h2>
      {to && (
        <Link to={to} className="text-[13px] font-semibold text-brand hover:underline">
          {linkText}
        </Link>
      )}
    </div>
    {children}
  </section>
);

const Row = ({ to, image, title, sub, badge }) => (
  <li>
    <Link to={to} className="flex items-center gap-3.5 px-5 py-3 hover:bg-cream">
      <img src={thumb(image, 120) || PLACEHOLDER_IMAGE} alt="" className="w-11 h-14 rounded-sm object-cover bg-cream border border-line flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{title}</p>
        <p className="text-xs text-muted truncate">{sub}</p>
      </div>
      {badge}
      <ChevronRight size={16} className="text-muted flex-shrink-0" />
    </Link>
  </li>
);

const Empty = ({ children }) => <p className="px-5 py-8 text-sm text-muted text-center">{children}</p>;

const Dashboard = () => {
  usePageTitle("Dashboard");
  const { user, authHeader } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/products/mine`, authHeader),
      axios.get(`${API}/orders`, authHeader),
      axios.get(`${API}/orders/sales`, authHeader),
    ])
      .then(([p, o, s]) => setData({ listings: p.data, purchases: o.data, sales: s.data }))
      .catch(() => setData({ listings: [], purchases: [], sales: [], failed: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-sm bg-white border border-line animate-pulse" />
        ))}
      </div>
    );
  }

  const { listings, purchases, sales } = data;
  const live = listings.filter((p) => ["live", "available"].includes(p.status));
  const pending = listings.filter((p) => p.status === "pending");
  const rejected = listings.filter((p) => p.status === "rejected");
  const toAct = sales.filter((o) => ["confirmed", "accepted"].includes(statusOf(o)));
  const earnings = sales.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + (o.earnings || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Hi, {user?.name?.split(" ")[0]}</h1>
          <p className="text-sm text-muted">Your shop and orders at a glance.</p>
        </div>
        <Link to="/sell" className="btn btn-dark">
          <Plus size={17} />
          List an item
        </Link>
      </div>

      {data.failed && (
        <p role="alert" className="rounded-sm bg-danger-tint border border-danger-line px-4 py-3 text-sm text-danger-strong">
          Some of your details couldn't be loaded. Please refresh the page.
        </p>
      )}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat label="Live listings" value={live.length} to="/seller/listings" />
        <Stat label="Waiting for review" value={pending.length} to="/seller/listings" note={rejected.length ? `${rejected.length} need changes` : undefined} />
        <Stat label="Orders to fulfil" value={toAct.length} to="/seller/orders" />
        <Stat label="Earnings" value={money(earnings)} to="/seller/earnings" note="See the breakdown" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <Panel title="Needs your attention" to="/seller/orders" linkText="All sales">
          {toAct.length === 0 && rejected.length === 0 ? (
            <Empty>Nothing to do right now.</Empty>
          ) : (
            <ul className="divide-y divide-line-soft">
              {toAct.slice(0, 5).map((o) => (
                <Row
                  key={o._id}
                  to="/seller/orders"
                  image={o.items[0]?.image}
                  title={o.items.map((i) => i.title).join(", ")}
                  sub={`${statusOf(o) === "confirmed" ? "Accept this order" : "Ship this order"} · ${o.buyer || "Buyer"} · ${money(o.earnings)}`}
                  badge={<StatusBadge status={statusOf(o)} />}
                />
              ))}
              {rejected.slice(0, 3).map((p) => (
                <Row
                  key={p._id}
                  to={`/sell/${p._id}`}
                  image={p.images?.[0]}
                  title={p.title}
                  sub={p.review?.rejectReason ? `Rejected: ${p.review.rejectReason}` : "Rejected by an admin. Edit and resubmit."}
                  badge={<StatusBadge status="rejected" />}
                />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Your recent orders" to="/orders" linkText="All orders">
          {purchases.length === 0 ? (
            <Empty>
              You haven't ordered anything yet.{" "}
              <Link to="/explore" className="font-semibold text-brand hover:underline">
                Start shopping
              </Link>
            </Empty>
          ) : (
            <ul className="divide-y divide-line-soft">
              {purchases.slice(0, 5).map((o) => (
                <Row
                  key={o._id}
                  to="/orders"
                  image={o.items[0]?.image}
                  title={o.items.map((i) => i.title).join(", ")}
                  sub={`${format(new Date(o.createdAt), "d MMM yyyy")} · ${money(o.total)}`}
                  badge={<StatusBadge status={statusOf(o)} />}
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Your listings" to="/seller/listings" linkText="Manage listings">
        {listings.length === 0 ? (
          <Empty>
            You haven't listed anything yet.{" "}
            <Link to="/sell" className="font-semibold text-brand hover:underline">
              List your first item
            </Link>
          </Empty>
        ) : (
          <ul className="divide-y divide-line-soft">
            {listings.slice(0, 5).map((p) => (
              <Row
                key={p._id}
                to={`/product/${p._id}`}
                image={p.images?.[0]}
                title={p.title}
                sub={[p.price > 0 && money(p.price), p.rent > 0 && `${money(p.rent)}/day`].filter(Boolean).join(" · ")}
                badge={<StatusBadge status={p.status === "available" ? "live" : p.status} />}
              />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
};

export default Dashboard;
