import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { BadgeCheck, CircleCheck, Circle, Clock } from "lucide-react";

import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

// "Verified seller" on the account page: what it is, what's needed, and the request
const VerificationCard = () => {
  const { authHeader } = useAuth();
  const [info, setInfo] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${API}/users/me`, authHeader)
      .then(({ data }) => setInfo({ verification: data.verification, checks: data.verificationChecks }))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!info) return null;

  const { verification, checks } = info;
  const status = verification?.status || "none";
  const ready = checks.every((c) => c.done);

  const request = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.post(`${API}/users/me/verification`, { note }, authHeader);
      setInfo((i) => ({ ...i, verification: data.verification }));
    } catch (err) {
      setError(err.response?.data?.message || "Could not send your request");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="verify-h">
      <div className="px-5 py-4 border-b border-[#efe6da] flex items-start gap-3">
        <BadgeCheck size={26} className="text-[#2f6a8a] flex-shrink-0" aria-hidden="true" />
        <div>
          <h2 id="verify-h" className="text-base font-bold">Verified seller</h2>
          <p className="text-[13px] text-muted">
            A badge on your listings and shop that tells buyers the ReWear team has checked your record.
          </p>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {status === "verified" && (
          <p className="flex items-center gap-2 text-sm font-semibold text-[#2f6a8a]">
            <BadgeCheck size={18} />
            You're verified
            {verification.reviewedAt && <span className="font-normal text-muted">since {format(new Date(verification.reviewedAt), "d MMM yyyy")}</span>}
          </p>
        )}

        {status === "pending" && (
          <p className="flex items-center gap-2 text-sm">
            <Clock size={17} className="text-amber-700" />
            Your request is with an admin
            {verification.requestedAt && ` (sent ${format(new Date(verification.requestedAt), "d MMM")})`}. You'll get an alert when they decide.
          </p>
        )}

        {status === "rejected" && verification.reason && (
          <p className="rounded-sm border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
            Your last request was declined: {verification.reason}. You can ask again once that's sorted.
          </p>
        )}

        {(status === "none" || status === "rejected") && (
          <>
            <ul className="flex flex-col gap-2 text-sm">
              {checks.map((c) => (
                <li key={c.key} className="flex items-center gap-2.5">
                  {c.done ? (
                    <CircleCheck size={17} className="text-[#3f6b4a] flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <Circle size={17} className="text-muted flex-shrink-0" aria-hidden="true" />
                  )}
                  <span className={c.done ? "" : "text-muted"}>
                    {c.label}
                    <span className="sr-only">{c.done ? " (done)" : " (not yet)"}</span>
                  </span>
                </li>
              ))}
            </ul>

            <form onSubmit={request} className="flex flex-col gap-2">
              <label htmlFor="verify-note" className="text-sm font-medium">
                Anything the admin should know? <span className="text-muted font-normal">(optional)</span>
              </label>
              <textarea
                id="verify-note"
                rows={2}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. I run a small boutique and sell my old stock here."
                className="rounded-sm border border-[#d9cbb9] px-3 py-2 text-sm focus:outline-none focus:border-brand"
              />
              {error && <p role="alert" className="text-[13px] text-red-700">{error}</p>}
              <button type="submit" disabled={!ready || busy} className="btn btn-dark btn-sm self-start">
                Ask to be verified
              </button>
              {!ready && <p className="text-xs text-muted">Finish the steps above first.</p>}
            </form>
          </>
        )}
      </div>
    </section>
  );
};

export default VerificationCard;
