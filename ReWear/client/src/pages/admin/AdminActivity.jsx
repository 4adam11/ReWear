import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";

import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const LABELS = {
  approve_listing: "Approved listing",
  reject_listing: "Rejected listing",
  block_user: "Blocked user",
  unblock_user: "Unblocked user",
  refund_dispute: "Refunded buyer",
  reject_dispute: "Rejected report",
};

const AdminActivity = () => {
  const { authHeader } = useAuth();
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/admin/activity`, authHeader)
      .then(({ data }) => setLogs(data))
      .catch(() => setLogs([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Activity log</h1>
        <p className="mt-1 text-sm text-muted">Every admin decision, who made it and when. The latest 100 are shown.</p>
      </div>

      {!logs ? (
        <div className="h-40 rounded-lg bg-white border border-line animate-pulse" />
      ) : logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#d9cbb9] bg-white py-14 text-center text-sm text-muted">
          No admin actions yet.
        </div>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-line">
                <th scope="col" className="px-4 py-3 font-medium">When</th>
                <th scope="col" className="px-4 py-3 font-medium">Admin</th>
                <th scope="col" className="px-4 py-3 font-medium">Action</th>
                <th scope="col" className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efe6da]">
              {logs.map((l) => (
                <tr key={l._id}>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{format(new Date(l.createdAt), "d MMM, HH:mm")}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{l.admin?.name || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">{LABELS[l.action] || l.action}</td>
                  <td className="px-4 py-3 min-w-[240px]">{l.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminActivity;
