import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { Flag } from "lucide-react";

import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { thumb, PLACEHOLDER_IMAGE } from "../../utils/image";
import { categoryLabel } from "../../utils/catalog";
import { money } from "../../utils/format";
import StatusBadge from "../../components/ui/StatusBadge";
import VerifiedBadge from "../../components/ui/VerifiedBadge";
import usePageTitle from "../../hooks/usePageTitle";

const OUTCOME = { taken_down: "Taken down", dismissed: "Dismissed" };

// One listing and every open report against it
const ReportCard = ({ group, open, onDecided }) => {
  const { authHeader } = useAuth();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { product, reports } = group;

  const decide = async (decision) => {
    setBusy(true);
    setError("");
    try {
      await axios.patch(`${API}/admin/reports/product/${product._id}`, { decision, note }, authHeader);
      onDecided(product._id);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the decision");
    } finally {
      setBusy(false);
    }
  };

  const price = product.price > 0 ? money(product.price) : product.rent > 0 ? `${money(product.rent)}/day` : "";

  return (
    <article className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-cream border-b border-line text-sm">
        <span className="flex items-center gap-2 font-semibold">
          <Flag size={15} className="text-red-700" />
          {reports.length} report{reports.length > 1 ? "s" : ""}
        </span>
        {!open && reports[0]?.status && (
          <span className="text-muted">
            {OUTCOME[reports[0].status]}
            {reports[0].resolvedBy?.name && ` by ${reports[0].resolvedBy.name}`}
            {reports[0].resolvedAt && ` · ${format(new Date(reports[0].resolvedAt), "d MMM")}`}
          </span>
        )}
      </div>

      <div className="p-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-4 min-w-0">
          {/* THE LISTING */}
          <div className="flex gap-4">
            <img src={thumb(product.images?.[0], 200) || PLACEHOLDER_IMAGE} alt="" className="w-16 h-20 object-cover bg-cream border border-line flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {product.status && <StatusBadge status={product.status === "available" ? "live" : product.status} />}
                {product.status && product.status !== "rejected" && (
                  <Link to={`/product/${product._id}`} className="text-xs font-semibold text-brand hover:underline">
                    View listing
                  </Link>
                )}
              </div>
              <p className="mt-1 font-semibold truncate">{product.title}</p>
              <p className="text-[13px] text-muted">
                {[categoryLabel(product.category), price].filter(Boolean).join(" · ")}
              </p>
              {product.user && (
                <>
                  <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
                    Seller: {product.user.name}
                    {product.user.verification?.status === "verified" && <VerifiedBadge size={13} />}
                  </p>
                  <p className="text-xs text-muted truncate" title={product.user.email}>{product.user.email}</p>
                </>
              )}
            </div>
          </div>

          {/* WHAT PEOPLE SAID */}
          <ul className="flex flex-col gap-2">
            {reports.map((r) => (
              <li key={r._id} className="border border-line bg-paper px-3.5 py-2.5 text-sm">
                <p className="font-semibold">{r.reasonLabel}</p>
                {r.details && <p className="mt-0.5 text-[13px]">“{r.details}”</p>}
                <p className="mt-1 text-xs text-muted">
                  {r.reporter?.name || "A shopper"} · {format(new Date(r.createdAt), "d MMM yyyy, HH:mm")}
                </p>
              </li>
            ))}
          </ul>

          {!open && reports[0]?.resolution && (
            <p className="text-sm">
              <span className="font-semibold">Decision:</span> {reports[0].resolution}
            </p>
          )}
        </div>

        {/* DECISION */}
        {open && (
          <div className="flex flex-col gap-2">
            <label htmlFor={`note-${product._id}`} className="text-sm font-semibold">
              Your decision
            </label>
            <p className="-mt-1 text-xs text-muted">The seller sees this if the listing is taken down.</p>
            <textarea
              id={`note-${product._id}`}
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. The photos are copied from a brand's website."
              className="rounded-sm border border-[#d9cbb9] px-3 py-2 text-sm focus:outline-none focus:border-brand"
            />
            {error && <p role="alert" className="text-[13px] text-red-700">{error}</p>}
            <button type="button" disabled={busy || note.trim().length < 5} onClick={() => decide("take_down")} className="btn btn-dark btn-sm">
              Take listing down
            </button>
            <button type="button" disabled={busy || note.trim().length < 5} onClick={() => decide("dismiss")} className="btn btn-outline btn-sm">
              Dismiss, keep it live
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

const AdminReports = () => {
  usePageTitle("Admin · Reported listings");
  const { authHeader } = useAuth();
  const [tab, setTab] = useState("open");
  const [groups, setGroups] = useState(null);

  useEffect(() => {
    setGroups(null);
    axios
      .get(`${API}/admin/reports`, { ...authHeader, params: { status: tab } })
      .then(({ data }) => setGroups(data))
      .catch(() => setGroups([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Reported listings</h1>
        <p className="mt-1 text-sm text-muted">
          Shoppers flag listings that look fake, misdescribed or not allowed. Reports on the same listing are grouped together.
        </p>
      </div>

      <div className="tab-bar">
        {[
          ["open", "Open"],
          ["closed", "Decided"],
        ].map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={`tab ${tab === key ? "tab-active" : ""}`}>
            {label}
          </button>
        ))}
      </div>

      {!groups ? (
        <div className="h-40 panel animate-pulse" />
      ) : groups.length === 0 ? (
        <div className="rounded-sm border border-dashed border-[#d9cbb9] bg-white py-14 text-center text-sm text-muted">
          {tab === "open" ? "No reported listings. All clear." : "No decisions yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <ReportCard
              key={g.product._id}
              group={g}
              open={tab === "open"}
              onDecided={(id) => setGroups((list) => list.filter((x) => x.product._id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
