import { useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { TriangleAlert } from "lucide-react";

import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { Stars, StarPicker } from "../ui/Stars";

const DISPUTE_REASONS = {
  not_received: "Item not received",
  not_as_described: "Not as described",
  damaged: "Arrived damaged",
  wrong_item: "Wrong item sent",
  not_returned: "Rental not returned",
  other: "Something else",
};

const BUYER_REASONS = ["not_received", "not_as_described", "damaged", "wrong_item", "other"];

// Buyer rates the seller once the order is completed
export const ReviewBox = ({ order, onDone }) => {
  const { authHeader } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (order.reviewRating) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        You rated this seller <Stars value={order.reviewRating} />
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-dark btn-sm">
        Rate the seller
      </button>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await axios.post(`${API}/reviews`, { orderId: order._id, rating, comment }, authHeader);
      onDone(rating);
    } catch (err) {
      setError(err.response?.data?.message || "Could not post your review");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full rounded-sm border border-line p-4 flex flex-col gap-3">
      <p className="text-sm font-semibold">How was buying from {order.seller?.name || "this seller"}?</p>
      <StarPicker value={rating} onChange={setRating} />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Tell other buyers about it (optional)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Was it as described? How was the packing and delivery?"
          className="rounded-md border border-[#d9cbb9] px-3 py-2 focus:outline-none focus:border-brand"
        />
      </label>
      {error && <p className="text-[13px] text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !rating} className="btn btn-dark btn-sm">
          Post review
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-outline btn-sm">
          Cancel
        </button>
      </div>
    </form>
  );
};

// "Report a problem" (buyer) or "Report not returned" (seller, rentals)
export const ProblemBox = ({ order, role, onDone }) => {
  const { authHeader } = useAuth();
  const reasons = role === "seller" ? ["not_returned"] : BUYER_REASONS;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-outline btn-sm">
        <TriangleAlert size={15} />
        {role === "seller" ? "Report not returned" : "Report a problem"}
      </button>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.post(`${API}/disputes`, { orderId: order._id, reason, details }, authHeader);
      onDone(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send your report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full rounded-sm border border-line p-4 flex flex-col gap-3">
      <p className="text-sm font-semibold">Report a problem with this order</p>
      <p className="-mt-2 text-[13px] text-muted">A ReWear admin reviews every report and can refund the buyer.</p>
      {reasons.length > 1 && (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">What went wrong?</span>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 rounded-md border border-[#d9cbb9] px-3 bg-white">
            {reasons.map((r) => (
              <option key={r} value={r}>
                {DISPUTE_REASONS[r]}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Details</span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder={role === "seller" ? "When was it due back? Have you contacted the buyer?" : "Describe what happened"}
          className="rounded-md border border-[#d9cbb9] px-3 py-2 focus:outline-none focus:border-brand"
        />
      </label>
      {error && <p className="text-[13px] text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy || details.trim().length < 10} className="btn btn-dark btn-sm">
          Send report
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-outline btn-sm">
          Cancel
        </button>
      </div>
    </form>
  );
};

// Shows the latest problem report on an order and how it was resolved
export const DisputeBanner = ({ dispute }) => {
  if (!dispute) return null;

  const open = dispute.status === "open";
  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${open ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-cream border-line"}`}>
      <p className="font-semibold">
        {open ? "Problem reported" : dispute.status === "refunded" ? "Resolved: buyer refunded" : "Report closed by ReWear"} ·{" "}
        {DISPUTE_REASONS[dispute.reason]}
      </p>
      <p className="mt-0.5 text-[13px]">
        {open
          ? `Reported ${format(new Date(dispute.createdAt), "d MMM")}. A ReWear admin is looking into it.`
          : dispute.resolution}
      </p>
    </div>
  );
};
