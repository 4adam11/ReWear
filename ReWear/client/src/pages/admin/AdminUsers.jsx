import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Search } from "lucide-react";

import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/ui/StatusBadge";
import usePageTitle from "../../hooks/usePageTitle";
import { toast, confirmAction } from "../../utils/feedback";

const AdminUsers = () => {
  usePageTitle("Admin · Users");
  const { authHeader } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API}/admin/users`, { ...authHeader, params: { search: query || undefined } })
      .then(({ data }) => setUsers(data))
      .catch((err) => setError(err.response?.data?.message || "Could not load users"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const toggleBlock = async (u) => {
    const blocking = !u.blocked;

    if (
      blocking &&
      !(await confirmAction({
        title: `Block ${u.name}?`,
        body: "They won't be able to log in, and their live listings will be hidden until you unblock them.",
        confirmLabel: "Block user",
        danger: true,
      }))
    ) {
      return;
    }

    try {
      const { data } = await axios.patch(`${API}/admin/users/${u._id}/block`, { blocked: blocking }, authHeader);
      setUsers((list) => list.map((x) => (x._id === u._id ? { ...x, blocked: data.blocked } : x)));
      toast.success(data.blocked ? `${u.name} is blocked.` : `${u.name} can log in again.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update this user. Please try again.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="mt-1 text-sm text-muted">Block accounts that break the rules. Their live listings are hidden too.</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
          }}
          className="relative md:w-72"
        >
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            className="field pl-9 pr-3 py-2"
          />
        </form>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="bg-white border border-line rounded-sm overflow-x-auto">
        <table className="w-full text-sm nums">
          <thead>
            <tr className="text-left text-muted border-b border-line">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium text-right">Listings</th>
              <th className="px-4 py-3 font-medium text-right">Orders</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-line-soft">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-faint">Loading…</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">No users found.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="hover:bg-cream">
                  <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{format(new Date(u.createdAt), "d MMM yyyy")}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{u.listings}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{u.orders}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {u.role === "admin" && <StatusBadge status="admin" />}
                      {u.blocked ? <StatusBadge status="blocked" /> : <span className="text-xs text-muted">Active</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== "admin" && (
                      <button
                        onClick={() => toggleBlock(u)}
                        className={`px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors ${u.blocked
                          ? "border-line text-ink-soft hover:bg-cream"
                          : "border-danger-line text-danger hover:bg-danger-tint"
                          }`}
                      >
                        {u.blocked ? "Unblock" : "Block"}
                      </button>
                    )}
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

export default AdminUsers;
