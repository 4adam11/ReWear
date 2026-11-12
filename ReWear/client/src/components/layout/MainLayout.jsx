import { useLocation } from "react-router-dom";

import Navbar from "./Navbar";
import Footer from "./Footer";

const MainLayout = ({ children }) => {

  const location = useLocation();

  // PAGES WHERE NAVBAR & FOOTER SHOULD HIDE
  const hideLayout =
    location.pathname === "/login";

  return (

    <div className="min-h-screen flex flex-col">

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

    </div>
  );
};

export default MainLayout;