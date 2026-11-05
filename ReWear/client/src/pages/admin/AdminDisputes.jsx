import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";

import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { money } from "../../utils/format";
import StatusBadge from "../../components/ui/StatusBadge";
import usePageTitle from "../../hooks/usePageTitle";

const DisputeCard = ({ dispute, onResolved }) => {
  const { authHeader } = useAuth();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const resolve = async (decision) => {
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.patch(`${API}/admin/disputes/${dispute._id}/resolve`, { decision, note }, authHeader);
      onResolved({ ...dispute, ...data, buyer: dispute.buyer, seller: dispute.seller, order: dispute.order, resolvedBy: dispute.resolvedBy });
    } catch (err) {
      setError(err.response?.data?.message || "Could not resolve");
    } finally {
      setBusy(false);
    }
  };

  const order = dispute.order;
  const open = dispute.status === "open";

  return (
    <article className="bg-white border border-line rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-cream border-b border-line text-sm">
        <span className="flex items-center gap-2">
          <StatusBadge status={dispute.status === "open" ? "open" : dispute.status} />
          <span className="font-semibold">{dispute.reasonLabel}</span>
          <span className="text-muted">· reported by the {dispute.raisedBy}</span>
        </span>
        <span className="text-xs text-muted">{format(new Date(dispute.createdAt), "d MMM yyyy, HH:mm")}</span>
      </div>

      <div className="p-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex flex-col gap-3 min-w-0">
          <p className="text-sm leading-relaxed whitespace-pre-line">“{dispute.details}”</p>

          {order && (
            <div className="rounded-md border border-line p-3 text-[13px]">
              <p className="font-semibold">{order.items.map((i) => i.title).join(", ")}</p>
              <p className="text-muted">
                Order #{order._id.slice(-6).toUpperCase()} · {money(order.total)} · {order.paymentMethod?.toUpperCase()} · now {order.status}
                {order.shipping?.trackingNumber && ` · ${order.shipping.courier} ${order.shipping.trackingNumber}`}
              </p>
            </div>
          )}

          {open ? (
            <div className="flex flex-col gap-2">
              <label htmlFor={`note-${dispute._id}`} className="text-sm font-medium">
                Your decision, shown to both sides
              </label>
              <textarea
                id={`note-${dispute._id}`}
                rows={2}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. The courier confirmed the parcel was lost, so the buyer is refunded."
                className="rounded-md border border-[#d9cbb9] px-3 py-2 text-sm focus:outline-none focus:border-brand"
              />
              {error && <p className="text-[13px] text-red-700">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || note.trim().length < 5}
                  onClick={() => resolve("refund")}
                  className="h-9 px-4 rounded-md bg-brand text-white text-[13px] font-semibold hover:bg-brand-dark disabled:opacity-50"
                >
                  Refund the buyer
                </button>
                <button
                  type="button"
                  disabled={busy || note.trim().length < 5}
                  onClick={() => resolve("reject")}
                  className="h-9 px-4 rounded-md border border-line text-[13px] font-semibold hover:border-brand disabled:opacity-50"
                >
                  Reject report, order continues
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm">
              <span className="font-semibold">{dispute.status === "refunded" ? "Refunded" : "Rejected"}</span>
              {dispute.resolvedBy?.name && ` by ${dispute.resolvedBy.name}`}
              {dispute.resolvedAt && ` on ${format(new Date(dispute.resolvedAt), "d MMM")}`}: {dispute.resolution}
            </p>
          )}
        </div>

        <dl className="text-[13px] flex flex-col gap-3">
          <div>
            <dt className="text-muted">Buyer</dt>
            <dd className="font-medium">{dispute.buyer?.name}</dd>
            <dd className="text-muted break-all">{dispute.buyer?.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Seller</dt>
            <dd className="font-medium">{dispute.seller?.name}</dd>
            <dd className="text-muted break-all">{dispute.seller?.email}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
};

const AdminDisputes = () => {
  usePageTitle("Admin · Problem reports");
  const { authHeader } = useAuth();
  const [tab, setTab] = useState("open");
  const [disputes, setDisputes] = useState(null);

  useEffect(() => {
    setDisputes(null);
    axios
      .get(`${API}/admin/disputes`, { ...authHeader, params: { status: tab === "open" ? "open" : "refunded" } })
      .then(({ data }) => setDisputes(data))
      .catch(() => setDisputes([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Problem reports</h1>
        <p className="mt-1 text-sm text-muted">Buyers and sellers report problems with orders. You decide whether the buyer is refunded.</p>
      </div>

      <div className="flex gap-1 bg-white border border-line rounded-lg p-1 w-fit">
        {[
          ["open", "Open"],
          ["closed", "Resolved"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === key ? "bg-brand text-white" : "text-muted hover:bg-cream"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {!disputes ? (
        <div className="h-40 rounded-lg bg-white border border-line animate-pulse" />
      ) : disputes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#d9cbb9] bg-white py-14 text-center text-sm text-muted">
          {tab === "open" ? "No open reports. Nice." : "No resolved reports yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <DisputeCard
              key={d._id}
              dispute={d}
              onResolved={(next) => setDisputes((list) => (tab === "open" ? list.filter((x) => x._id !== next._id) : list))}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDisputes;
