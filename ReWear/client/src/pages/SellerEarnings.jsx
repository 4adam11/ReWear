import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { Download } from "lucide-react";

import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { money } from "../utils/format";
import StatusBadge from "../components/ui/StatusBadge";
import DayBars from "../components/admin/DayBars";
import usePageTitle from "../hooks/usePageTitle";

const FILTERS = [
  ["all", "All orders"],
  ["earned", "Earned"],
  ["pending", "On the way"],
  ["lost", "Cancelled or refunded"],
];

const inFilter = (o, f) =>
  f === "all" ? true
    : f === "earned" ? o.status === "completed"
      : f === "pending" ? ["confirmed", "accepted", "shipped", "delivered"].includes(o.status)
        : ["cancelled", "refunded"].includes(o.status);

const Tile = ({ label, value, note }) => (
  <div className="panel p-4">
    <p className="text-[13px] text-muted">{label}</p>
    <p className="mt-1 text-2xl font-bold nums">{value}</p>
    {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
  </div>
);

// Spreadsheet-friendly copy of the orders shown
const downloadCsv = (orders) => {
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    ["Date", "Order", "Items", "Buyer", "Type", "Status", "Amount (INR)"],
    ...orders.map((o) => [
      format(new Date(o.createdAt), "yyyy-MM-dd"),
      `#${o._id.slice(-6).toUpperCase()}`,
      o.items.map((i) => i.title).join("; "),
      o.buyer,
      o.kind === "rent" ? "Rental" : "Sale",
      o.status,
      o.amount,
    ]),
  ];
  const blob = new Blob([lines.map((l) => l.map(cell).join(",")).join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rewear-earnings-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const SellerEarnings = () => {
  usePageTitle("Earnings");
  const { authHeader } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    axios
      .get(`${API}/orders/earnings`, authHeader)
      .then(({ data }) => setData(data))
      .catch(() => setError("Your earnings couldn't be loaded. Please refresh the page."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <p role="alert" className="max-w-6xl mx-auto px-4 py-10 text-sm text-danger">{error}</p>;

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 panel animate-pulse" />
        ))}
      </div>
    );
  }

  const { totals, months, orders } = data;
  const shown = orders.filter((o) => inFilter(o, filter));
  const split = totals.fromSales + totals.fromRentals;
  const salesShare = split ? Math.round((totals.fromSales / split) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Earnings</h1>
          <p className="mt-2 text-sm text-muted max-w-2xl">
            What buyers pay for your items, after any promo discount. Payment is collected on delivery, so an order counts as earned once it's completed.
          </p>
        </div>
        <Link to="/seller/orders" className="btn btn-outline btn-sm">
          Orders to fulfil
        </Link>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Tile label="Earned" value={money(totals.earned)} note={`${totals.completedOrders} completed order${totals.completedOrders === 1 ? "" : "s"}`} />
        <Tile label="On the way" value={money(totals.pending)} note={`${totals.pendingOrders} order${totals.pendingOrders === 1 ? "" : "s"} not completed yet`} />
        <Tile label="Average per order" value={money(totals.average)} note="Completed orders" />
        <Tile label="Cancelled or refunded" value={money(totals.lostAmount)} note={`${totals.lostOrders} order${totals.lostOrders === 1 ? "" : "s"}`} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-stretch">
        <DayBars
          title="Earned per month"
          series={months}
          field="earned"
          formatValue={money}
          total={months.reduce((s, m) => s + m.earned, 0)}
          period="Last 12 months"
          labelOf={(d) => format(parseISO(d), "MMM yyyy")}
          endLabel="This month"
        />

        <div className="panel p-5 flex flex-col gap-4">
          <p className="text-sm font-semibold">Where it comes from</p>
          {split ? (
            <>
              <div className="flex h-3 overflow-hidden" aria-hidden="true">
                <span className="bg-ink" style={{ width: `${salesShare}%` }} />
                <span className="bg-caramel" style={{ width: `${100 - salesShare}%` }} />
              </div>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2"><span className="w-3 h-3 bg-ink" aria-hidden="true" />Sales</dt>
                  <dd className="font-semibold">{money(totals.fromSales)} · {salesShare}%</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2"><span className="w-3 h-3 bg-caramel" aria-hidden="true" />Rentals</dt>
                  <dd className="font-semibold">{money(totals.fromRentals)} · {100 - salesShare}%</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="text-sm text-muted">Nothing earned yet. Completed sales and rentals will show here.</p>
          )}
          <p className="mt-auto text-xs text-muted">From completed orders only.</p>
        </div>
      </div>

      <section aria-labelledby="orders-h" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="orders-h" className="text-lg font-bold uppercase tracking-[0.04em]">Your sales</h2>
          <button type="button" onClick={() => downloadCsv(shown)} disabled={!shown.length} className="btn btn-outline btn-sm">
            <Download size={15} />
            Download CSV
          </button>
        </div>

        <div className="tab-bar">
          {FILTERS.map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key)} className={`tab ${filter === key ? "tab-active" : ""}`}>
              {label}
              <span className="ml-1.5 opacity-70">{orders.filter((o) => inFilter(o, key)).length}</span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="rounded-sm border border-dashed border-line-strong bg-white py-12 text-center text-sm text-muted">
            {orders.length ? "No orders in this group." : "No sales yet. Orders for your listings will show here."}
          </div>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm nums">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-line">
                  <th scope="col" className="px-4 py-3 font-medium">Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Items</th>
                  <th scope="col" className="px-4 py-3 font-medium">Buyer</th>
                  <th scope="col" className="px-4 py-3 font-medium">Type</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {shown.map((o) => (
                  <tr key={o._id}>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">{format(new Date(o.createdAt), "d MMM yyyy")}</td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <span className="block truncate">{o.items.map((i) => i.title).join(", ")}</span>
                      <span className="block text-xs text-muted font-mono">#{o._id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3">{o.buyer}</td>
                    <td className="px-4 py-3">{o.kind === "rent" ? "Rental" : "Sale"}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${["cancelled", "refunded"].includes(o.status) ? "text-muted line-through" : ""}`}>
                      {money(o.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default SellerEarnings;
