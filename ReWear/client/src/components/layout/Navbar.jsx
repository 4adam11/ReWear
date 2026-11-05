import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
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
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishListContext";
import { CATEGORIES } from "../../utils/catalog";
import Logo from "../ui/Logo";
import NotificationBell from "./NotificationBell";

// Icon with a small label under it, like most shopping sites
export const HeaderIcon = ({ icon: Icon, label, count, as: Tag = Link, ...props }) => (
  <Tag
    aria-label={label}
    {...props}
    className="relative flex flex-col items-center gap-0.5 min-w-[40px] sm:min-w-[48px] px-1.5 sm:px-2 py-1 text-[12px] font-medium text-ink hover:text-brand"
  >
    <Icon size={20} strokeWidth={1.8} />
    <span className="hidden sm:block">{label}</span>
    {count > 0 && (
      <span className="absolute top-0 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-brand text-white text-[10px] font-semibold flex items-center justify-center">
        {count > 9 ? "9+" : count}
      </span>
    )}
  </Tag>
);

const SearchBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const current = location.pathname === "/explore" ? params.get("search") || "" : "";
  const [text, setText] = useState(current);

  // Keep the box in step with the URL (back button, category links)
  useEffect(() => {
    setText(current);
  }, [current]);

  const submit = (e) => {
    e.preventDefault();

    const next = new URLSearchParams(location.pathname === "/explore" ? params : undefined);
    const q = text.trim();

    if (q) next.set("search", q);
    else next.delete("search");
    next.delete("page");

    navigate(`/explore?${next}`);
  };

  return (
    <form role="search" onSubmit={submit} className="flex flex-1 min-w-0 order-last basis-full md:order-none md:basis-auto">
      <label htmlFor="site-search" className="sr-only">
        Search ReWear
      </label>
      <input
        id="site-search"
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search lehengas, sherwanis, sarees, kurtas…"
        className="flex-1 min-w-0 h-11 px-4 rounded-l-md border border-r-0 border-[#d9cbb9] bg-paper text-sm text-ink placeholder:text-muted focus:outline-none focus:border-brand focus:bg-white"
      />
      <button
        type="submit"
        aria-label="Search"
        className="w-[52px] h-11 rounded-r-md bg-brand text-white flex items-center justify-center hover:bg-brand-dark"
      >
        <Search size={18} />
      </button>
    </form>
  );
};

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

const CategoryBar = () => {
  const location = useLocation();
  const [params] = useSearchParams();
  const onExplore = location.pathname === "/explore";
  const activeCategory = onExplore ? params.get("category") : null;
  const activeMode = onExplore ? params.get("mode") : null;

  const linkClass = (active, accent) =>
    `px-3 py-3 whitespace-nowrap text-sm ${active ? "font-semibold text-brand shadow-[inset_0_-2px_0_#6b4430]" : accent ? "font-semibold text-brand hover:text-brand-dark" : "font-medium text-ink hover:text-brand"}`;

  return (
    <nav aria-label="Categories" className="border-t border-[#efe6da]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-stretch gap-1 overflow-x-auto">
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            to={`/explore?category=${c.value}`}
            className={`${linkClass(activeCategory === c.value)} inline-flex items-center gap-1.5`}
            style={activeCategory === c.value ? { color: c.color, boxShadow: `inset 0 -2px 0 ${c.color}` } : undefined}
          >
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
            {c.label}
          </Link>
        ))}

        <span className="w-px bg-line my-2.5 mx-2 flex-shrink-0" aria-hidden="true" />

        <Link to="/explore?mode=rent" className={linkClass(!activeCategory && activeMode === "rent", true)}>
          Rent an outfit
        </Link>
        <Link to="/explore?mode=sale" className={linkClass(!activeCategory && activeMode === "sale", true)}>
          Buy pre-loved
        </Link>
        <NavLink to="/howitworks" className={({ isActive }) => `${linkClass(isActive)} ml-auto hidden md:block`}>
          How it works
        </NavLink>
      </div>
    </nav>
  );
};

const Navbar = () => {
  const { cartItems } = useCart();
  const { wishlist } = useWishlist();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2.5">
        <Link to="/" aria-label="ReWear home" className="flex-shrink-0">
          <Logo size={36} textClassName="text-[21px] font-bold tracking-tight text-ink" />
        </Link>

        <SearchBar />

        <nav aria-label="Account" className="flex items-center gap-0.5 ml-auto md:ml-0">
          <HeaderIcon icon={Plus} label="Sell" to="/sell" />
          <HeaderIcon icon={Heart} label="Wishlist" to="/wishlist" count={wishlist.length} />
          <NotificationBell />
          <HeaderIcon icon={ShoppingBag} label="Bag" to="/cart" count={cartItems.length} />
          <AccountMenu />
        </nav>
      </div>

      <CategoryBar />
    </header>
  );
};

export default Navbar;
