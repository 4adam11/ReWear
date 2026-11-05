import {
  Heart,
  ShoppingCart,
  Menu,
  X,
  LayoutDashboard,
  Package,
  Plus,
  LogOut,
  ListChecks,
  Truck,
  ShieldCheck,
} from "lucide-react";

import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Logo from "../ui/Logo";
import NotificationBell from "./NotificationBell";


const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const dropdownRef = useRef();

  // CLOSE DROPDOWN ON OUTSIDE CLICK
  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // INITIALS
  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const navLinkStyles = ({ isActive }) =>
    `transition duration-300 hover:text-indigo-600 ${isActive ? "text-indigo-600" : "text-gray-700"
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200/60 bg-white/75 backdrop-blur-xl">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="h-16 sm:h-20 flex items-center justify-between">

          {/* LEFT */}
          <div className="flex items-center gap-8">

            {/* LOGO */}
            <Link to="/" aria-label="ReWear home">
              <Logo
                size={36}
                textClassName="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
              />
            </Link>

            {/* DESKTOP NAV */}
            <div className="hidden lg:flex items-center gap-8 text-sm font-semibold">

              <NavLink to="/explore" className={navLinkStyles}>
                Explore
              </NavLink>

              <button
                onClick={() => navigate(user ? "/sell" : "/login")}
                className="text-gray-700 hover:text-indigo-600 transition duration-300"
              >
                Sell
              </button>

              <NavLink to="/howitworks" className={navLinkStyles}>
                How It Works
              </NavLink>

              <button
                onClick={() => navigate(user ? "/orders" : "/login")}
                className="text-gray-700 hover:text-indigo-600 transition duration-300"
              >
                Orders
              </button>

            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* WISHLIST */}
            <NavLink
              to="/wishlist"
              className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-100 transition duration-300"
            >
              <Heart size={18} className="text-gray-700" />
            </NavLink>

            {/* NOTIFICATIONS */}
            <NotificationBell />

            {/* CART */}
            <NavLink
              to="/cart"
              className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-100 transition duration-300"
            >
              <ShoppingCart size={18} className="text-gray-700" />
            </NavLink>

            {/* LOGIN */}
            {!user ? (
              <NavLink
                to="/login"
                className="hidden sm:flex px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition duration-300"
              >
                Login
              </NavLink>
            ) : (
              <div className="relative" ref={dropdownRef}>

                {/* AVATAR */}
                <button
                  onClick={() => setOpen(!open)}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold flex items-center justify-center shadow-md hover:scale-105 transition duration-300"
                >
                  {getInitials(user.name || "U")}
                </button>

                {/* DROPDOWN */}
                {open && (
                  <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-gray-200 bg-white shadow-2xl p-3">

                    {/* USER INFO */}
                    <div className="pb-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-800 truncate">
                        {user.name}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        {isAdmin ? "Admin" : user.email}
                      </p>
                    </div>

                    {/* MENU */}
                    <div className="pt-3 space-y-1">

                      <button
                        onClick={() => {
                          navigate("/dashboard");
                          setOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition duration-300 text-gray-700"
                      >
                        <LayoutDashboard size={18} />
                        Dashboard
                      </button>

                      <button
                        onClick={() => {
                          navigate("/seller/listings");
                          setOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition duration-300 text-gray-700"
                      >
                        <ListChecks size={18} />
                        My Listings
                      </button>

                      <button
                        onClick={() => {
                          navigate("/seller/orders");
                          setOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition duration-300 text-gray-700"
                      >
                        <Truck size={18} />
                        Orders to Fulfil
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            navigate("/admin");
                            setOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition duration-300 text-gray-700"
                        >
                          <ShieldCheck size={18} />
                          Admin Panel
                        </button>
                      )}

                      <button
                        onClick={() => {
                          navigate("/orders");
                          setOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition duration-300 text-gray-700"
                      >
                        <Package size={18} />
                        My Orders
                      </button>

                      <button
                        onClick={() => {
                          navigate("/sell");
                          setOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition duration-300 text-gray-700"
                      >
                        <Plus size={18} />
                        Sell Item
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          navigate("/login");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition duration-300"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>

                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={() => navigate(user ? "/sell" : "/login")}
              className="hidden md:flex items-center gap-2 px-5 lg:px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md hover:scale-105 transition duration-300"
            >
              <Plus size={16} />
              Start Selling
            </button>

            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center"
            >
              {mobileMenu ? (
                <X size={20} className="text-gray-700" />
              ) : (
                <Menu size={20} className="text-gray-700" />
              )}
            </button>

          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenu && (
          <div className="lg:hidden pb-5 animate-in fade-in slide-in-from-top-2 duration-300">

            <div className="flex flex-col gap-2 pt-2">

              <NavLink
                to="/explore"
                className="px-4 py-3 rounded-xl hover:bg-gray-100 text-gray-700 font-medium"
                onClick={() => setMobileMenu(false)}
              >
                Explore
              </NavLink>

              <button
                onClick={() => {
                  navigate(user ? "/sell" : "/login");
                  setMobileMenu(false);
                }}
                className="text-left px-4 py-3 rounded-xl hover:bg-gray-100 text-gray-700 font-medium"
              >
                Sell
              </button>

              <NavLink
                to="/howitworks"
                className="px-4 py-3 rounded-xl hover:bg-gray-100 text-gray-700 font-medium"
                onClick={() => setMobileMenu(false)}
              >
                How It Works
              </NavLink>

              <button
                onClick={() => {
                  navigate(user ? "/orders" : "/login");
                  setMobileMenu(false);
                }}
                className="text-left px-4 py-3 rounded-xl hover:bg-gray-100 text-gray-700 font-medium"
              >
                Orders
              </button>

              {!user && (
                <NavLink
                  to="/login"
                  onClick={() => setMobileMenu(false)}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold text-center mt-2"
                >
                  Login
                </NavLink>
              )}

            </div>
          </div>
        )}

      </div>
    </nav>
  );
};

export default Navbar;