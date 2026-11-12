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
        title="Alerts"
        className="relative flex items-center justify-center w-11 h-11 rounded-full text-paper hover:bg-white/10 transition-colors"
      >
        <Bell size={21} strokeWidth={1.8} />

        {data.unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-gold text-ink text-[10px] font-bold flex items-center justify-center">
            {data.unread > 9 ? "9+" : data.unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-sm border border-transparent bg-white shadow-menu overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <p className="text-sm font-semibold text-ink">Notifications</p>

            {data.unread > 0 && (
              <button onClick={markAll} className="text-xs font-medium text-brand hover:underline">
                Mark all as read
              </button>
            )}
          </div>

          {data.items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted text-center">You're all caught up.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto overscroll-contain divide-y divide-line-soft">
              {data.items.map((n) => (
                <li key={n._id}>
                  <button
                    onClick={() => openItem(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-cream transition-colors ${n.read ? "" : "bg-cream"}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-accent flex-shrink-0" />}

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{n.title}</p>
                        {n.message && <p className="mt-0.5 text-xs text-muted line-clamp-2">{n.message}</p>}
                        <p className="mt-1 text-[11px] text-faint">
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
