import { useState } from "react";
import axios from "axios";
import { CircleCheck } from "lucide-react";

import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import Modal from "../ui/Modal";

const REASONS = [
  ["fake", "Looks fake or counterfeit"],
  ["misdescribed", "Photos or details don't match"],
  ["prohibited", "Not allowed on ReWear"],
  ["offensive", "Offensive or inappropriate"],
  ["wrong_category", "Listed in the wrong occasion"],
  ["other", "Something else"],
];

// Lets a shopper flag a listing; an admin reviews every report
const ReportListing = ({ product, onClose }) => {
  const { authHeader } = useAuth();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.post(`${API}/reports`, { productId: product._id, reason, details }, authHeader);
      setDone(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send your report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Report this listing" onClose={onClose}>
      {done ? (
        <div className="flex flex-col items-start gap-3">
          <CircleCheck size={32} className="text-[#3f6b4a]" />
          <p className="text-[15px]">{done}</p>
          <p className="text-sm text-muted">You'll get an alert when it has been reviewed.</p>
          <button type="button" onClick={onClose} className="btn btn-dark btn-sm mt-2">
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Tell us what's wrong with <strong className="text-ink">{product.title}</strong>. The seller won't see who reported it.
          </p>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-semibold mb-1">What's the problem?</legend>
            {REASONS.map(([value, label]) => (
              <label
                key={value}
                className={`flex items-center gap-3 px-3.5 py-2.5 border cursor-pointer text-sm ${reason === value ? "border-ink bg-cream" : "border-line hover:border-ink"}`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={value}
                  checked={reason === value}
                  onChange={() => setReason(value)}
                  className="w-4 h-4 accent-[#6b4430]"
                />
                {label}
              </label>
            ))}
          </fieldset>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold">
              Details {reason === "other" ? "(required)" : "(optional)"}
            </span>
            <textarea
              rows={3}
              maxLength={1000}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="What did you notice?"
              className="rounded-sm border border-[#d9cbb9] px-3 py-2 focus:outline-none focus:border-brand"
            />
          </label>

          {error && <p role="alert" className="text-[13px] text-red-700">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || !reason || (reason === "other" && details.trim().length < 10)}
              className="btn btn-dark btn-sm"
            >
              Send report
            </button>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ReportListing;
