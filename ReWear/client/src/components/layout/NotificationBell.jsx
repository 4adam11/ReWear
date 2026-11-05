import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const POLL_MS = 60000;

const NotificationBell = () => {
  const navigate = useNavigate();
  const { user, authHeader } = useAuth();

  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], unread: 0 });
  const ref = useRef();

  const load = () =>
    axios
      .get(`${API}/notifications`, authHeader)
      .then(({ data }) => setData(data))
      .catch(() => {});

  // Check for new notifications every minute
  useEffect(() => {
    if (!user) return;

    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openItem = (n) => {
    if (!n.read) {
      axios.patch(`${API}/notifications/${n._id}/read`, {}, authHeader).catch(() => {});
      setData((d) => ({
        items: d.items.map((i) => (i._id === n._id ? { ...i, read: true } : i)),
        unread: Math.max(d.unread - 1, 0),
      }));
    }

    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const markAll = () => {
    axios.patch(`${API}/notifications/read-all`, {}, authHeader).catch(() => {});
    setData((d) => ({ items: d.items.map((i) => ({ ...i, read: true })), unread: 0 }));
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${data.unread ? ` (${data.unread} unread)` : ""}`}
        className="relative w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-100 transition"
      >
        <Bell size={18} className="text-gray-700" />

        {data.unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-600 text-white text-[10px] font-semibold flex items-center justify-center">
            {data.unread > 9 ? "9+" : data.unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>

            {data.unread > 0 && (
              <button onClick={markAll} className="text-xs font-medium text-indigo-600 hover:underline">
                Mark all as read
              </button>
            )}
          </div>

          {data.items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-gray-500 text-center">You're all caught up.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-gray-100">
              {data.items.map((n) => (
                <li key={n._id}>
                  <button
                    onClick={() => openItem(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${n.read ? "" : "bg-indigo-50/50"}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-pink-600 flex-shrink-0" />}

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        {n.message && <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{n.message}</p>}
                        <p className="mt-1 text-[11px] text-gray-400">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
