import { NavLink, useLocation } from "react-router-dom";
import { Home, Search, Plus, Heart, ShoppingBag } from "lucide-react";

import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishListContext";
import { showsTabBar } from "../../utils/layout";

const Tab = ({ to, icon: Icon, label, count, end, match }) => {
  const { pathname } = useLocation();
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => {
        const on = match ? match(pathname) : isActive;
        return `relative flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-medium transition-colors ${
          on ? "text-ink" : "text-muted"
        }`;
      }}
    >
      {({ isActive }) => {
        const on = match ? match(pathname) : isActive;
        return (
          <>
            <span className="relative">
              <Icon size={22} strokeWidth={on ? 2.2 : 1.8} className={on && Icon === Heart ? "fill-ink" : ""} aria-hidden="true" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center nums">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </span>
            {label}
            {count > 0 && <span className="sr-only">({count})</span>}
            {on && <span className="absolute top-0 inset-x-5 h-0.5 bg-ink" aria-hidden="true" />}
          </>
        );
      }}
    </NavLink>
  );
};

// Bottom navigation on phones, like most shopping apps
const MobileTabBar = () => {
  const { pathname } = useLocation();
  const { cartItems } = useCart();
  const { wishlist } = useWishlist();

  if (!showsTabBar(pathname)) return null;

  return (
    <nav
      aria-label="Main"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-line pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex">
        <Tab to="/" end icon={Home} label="Home" />
        <Tab to="/explore" icon={Search} label="Shop" match={(p) => p.startsWith("/explore") || p.startsWith("/product")} />
        <Tab to="/sell" icon={Plus} label="Sell" />
        <Tab to="/wishlist" icon={Heart} label="Saved" count={wishlist.length} />
        <Tab to="/cart" icon={ShoppingBag} label="Bag" count={cartItems.length} />
      </div>
    </nav>
  );
};

export default MobileTabBar;
