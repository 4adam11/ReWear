import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, ClipboardCheck, Users, Package, ShieldCheck, TriangleAlert, History, Flag, BadgeCheck } from "lucide-react";

const LINKS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/listings", label: "Review queue", icon: ClipboardCheck },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/orders", label: "Orders", icon: Package },
  { to: "/admin/disputes", label: "Problem reports", icon: TriangleAlert },
  { to: "/admin/reports", label: "Reported listings", icon: Flag },
  { to: "/admin/verification", label: "Seller verification", icon: BadgeCheck },
  { to: "/admin/activity", label: "Activity log", icon: History },
];

const AdminLayout = () => (
  <div className="min-h-screen bg-paper">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <ShieldCheck size={16} />
        Admin panel
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* SIDEBAR */}
        <nav className="w-full lg:w-56 flex-shrink-0 bg-white border border-line rounded-sm p-2 flex lg:flex-col gap-1 overflow-x-auto lg:sticky lg:top-24">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium whitespace-nowrap transition-colors ${isActive
                  ? "bg-cream text-brand font-semibold"
                  : "text-muted hover:bg-cream hover:text-ink"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* PAGE */}
        <div className="flex-1 min-w-0 w-full">
          <Outlet />
        </div>

      </div>
    </div>
  </div>
);

export default AdminLayout;
