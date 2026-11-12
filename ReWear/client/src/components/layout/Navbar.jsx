import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  MessageCircle,
  Heart,
  ShoppingBag,
  User,
  LayoutDashboard,
  ListChecks,
  Truck,
  Package,
  ShieldCheck,
  LogOut,
  HandCoins,
  Settings,
  Wallet,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishListContext";
import { CATEGORIES } from "../../utils/catalog";
import Logo from "../ui/Logo";
import NotificationBell from "./NotificationBell";
import SearchBar from "./SearchBar";
import API from "../../utils/api";
import axios from "axios";

// Round icon button on the dark header bar (the name is read out to screen readers)
export const HeaderIcon = ({ icon: Icon, label, count, as: Tag = Link, ...props }) => (
  <Tag
    aria-label={label}
    title={label}
    {...props}
    className="relative flex items-center justify-center w-10 h-10 rounded-full text-paper hover:bg-white/10"
  >
    <Icon size={21} strokeWidth={1.8} />
    {count > 0 && (
      <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#e8c39e] text-ink text-[10px] font-bold flex items-center justify-center">
        {count > 9 ? "9+" : count}
      </span>
    )}
  </Tag>
);

const AccountMenu = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) {
    return <HeaderIcon icon={User} label="Log in" to="/login" />;
  }

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const items = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Package, label: "My orders", path: "/orders" },
    { icon: ListChecks, label: "My listings", path: "/seller/listings" },
    { icon: Truck, label: "Orders to fulfil", path: "/seller/orders" },
    { icon: Wallet, label: "Earnings", path: "/seller/earnings" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: HandCoins, label: "Offers", path: "/offers" },
    { icon: Settings, label: "Account settings", path: "/account" },
    ...(isAdmin ? [{ icon: ShieldCheck, label: "Admin panel", path: "/admin" }] : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <HeaderIcon
        as="button"
        type="button"
        icon={User}
        label={user.name?.split(" ")[0] || "Account"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      />

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-60 rounded-lg border border-line bg-white shadow-lg py-2 z-50">
          <div className="px-4 pb-2 mb-1 border-b border-line">
            <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
            <p className="text-xs text-muted truncate">{isAdmin ? "Admin" : user.email}</p>
          </div>

          {items.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              role="menuitem"
              onClick={() => go(path)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-cream"
            >
              <Icon size={17} className="text-muted" />
              {label}
            </button>
          ))}

          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
              navigate("/login");
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 border-t border-line mt-1"
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

// Chat icon with the number of unread messages (checked every minute while logged in)
const MessagesIcon = () => {
  const { user, authHeader } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;

    const load = () =>
      axios
        .get(`${API}/chats/unread`, authHeader)
        .then(({ data }) => setUnread(data.unread))
        .catch(() => {});

    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
    // Also re-check when moving between pages (e.g. after reading a chat)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token, location.pathname]);

  if (!user) return null;

  return (
    <span className="hidden sm:block">
      <HeaderIcon icon={MessageCircle} label={unread ? `Messages (${unread} unread)` : "Messages"} to="/messages" count={unread} />
    </span>
  );
};

// The two ways to shop, as tabs next to the logo
const BuyRentSwitch = () => {
  const location = useLocation();
  const [params] = useSearchParams();
  const mode = location.pathname === "/explore" ? params.get("mode") : null;

  const cls = (active) =>
    `h-[60px] -my-2.5 px-3 sm:px-4 flex items-center font-display text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors ${active ? "bg-[#4a3426] text-white" : "text-paper/85 hover:text-white"}`;

  return (
    <nav aria-label="Shop" className="hidden sm:flex items-stretch">
      <Link to="/explore?mode=sale" className={cls(mode === "sale")}>Buy</Link>
      <Link to="/explore?mode=rent" className={cls(mode === "rent")}>Rent</Link>
    </nav>
  );
};

const CategoryBar = () => {
  const location = useLocation();
  const [params] = useSearchParams();
  const onExplore = location.pathname === "/explore";
  const activeCategory = onExplore ? params.get("category") : null;
  const activeMode = onExplore ? params.get("mode") : null;

  const isNewIn = onExplore && !activeCategory && !activeMode && !params.get("search");
  const linkClass = (active) =>
    `px-3 py-2.5 whitespace-nowrap text-[13px] font-medium transition-colors ${active ? "bg-paper text-ink" : "text-paper/90 hover:bg-white/10 hover:text-white"}`;

  return (
    <nav aria-label="Categories" className="bg-[#4a3426]">
      <div className="scroll-row max-w-7xl mx-auto px-4 sm:px-6 flex items-stretch overflow-x-auto">
        <Link to="/explore" className={linkClass(isNewIn)}>
          New in
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c.value} to={`/explore?category=${c.value}`} className={`${linkClass(activeCategory === c.value)} inline-flex items-center gap-1.5`}>
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full ring-1 ring-white/40" style={{ backgroundColor: c.color }} />
            {c.label}
          </Link>
        ))}
        <Link to="/explore?mode=rent" className={linkClass(!activeCategory && activeMode === "rent")}>
          Rentals
        </Link>
      </div>
    </nav>
  );
};

const Navbar = () => {
  const { cartItems } = useCart();
  const { wishlist } = useWishlist();

  return (
    <header className="sticky top-0 z-40">
      {/* UTILITY STRIP */}
      <div className="hidden md:block bg-paper border-b border-line text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-8 flex items-center justify-between">
          <span className="text-muted">Every listing is checked by the ReWear team before it goes live</span>
          <span className="flex items-center gap-5">
            <Link to="/sell" className="font-medium text-ink hover:text-brand">Sell on ReWear</Link>
            <Link to="/howitworks" className="font-medium text-ink hover:text-brand">How it works</Link>
          </span>
        </div>
      </div>

      {/* MAIN BAR */}
      <div className="bg-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-x-4 sm:gap-x-8 gap-y-2.5">
        <Link to="/" aria-label="ReWear home" className="flex-shrink-0">
          <Logo size={34} textClassName="font-display text-[22px] font-bold tracking-tight text-paper" />
        </Link>

        <BuyRentSwitch />

        <SearchBar />

        <nav aria-label="Account" className="flex items-center gap-0.5 ml-auto md:ml-0">
          <HeaderIcon icon={Plus} label="Sell" to="/sell" />
          <HeaderIcon icon={Heart} label="Wishlist" to="/wishlist" count={wishlist.length} />
          <MessagesIcon />
          <NotificationBell />
          <HeaderIcon icon={ShoppingBag} label="Bag" to="/cart" count={cartItems.length} />
          <AccountMenu />
        </nav>
      </div>
      </div>

      <CategoryBar />
    </header>
  );
};

export default Navbar;
