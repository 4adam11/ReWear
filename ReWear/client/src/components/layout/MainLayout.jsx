import { useLocation } from "react-router-dom";

import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileTabBar from "./MobileTabBar";
import { showsTabBar } from "../../utils/layout";

const MainLayout = ({ children }) => {

  const location = useLocation();

  // PAGES WHERE NAVBAR & FOOTER SHOULD HIDE
  const hideLayout =
    location.pathname === "/login";

  return (

    // Room at the bottom on phones so the tab bar never covers the footer
    <div className={`min-h-screen flex flex-col ${showsTabBar(location.pathname) ? "pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0" : ""}`}>

      {/* Lets keyboard users jump past the header */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-sm focus:bg-ink focus:text-paper focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      {/* NAVBAR */}
      {!hideLayout && <Navbar />}

      {/* MAIN CONTENT */}
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>

      {/* FOOTER */}
      {!hideLayout && <Footer />}

      <MobileTabBar />

    </div>
  );
};

export default MainLayout;