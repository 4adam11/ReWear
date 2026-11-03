import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";

import Landing from "./pages/Landing";
import ScrollProgress from "./components/ui/ScrollProgress";
import CustomCursor from "./components/ui/CustomCursor";
import ScrollToTop from "./components/ui/ScrolltoTop";

import ProtectedRoute from "./components/ProtectedRoute";

// Each page is downloaded only when it's first visited, so the home page
// doesn't wait for the calendar, checkout, dashboard, etc.
const Explore = lazy(() => import("./pages/Explore"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Login = lazy(() => import("./pages/Login"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Orders = lazy(() => import("./pages/Orders"));
const HowItWorks = lazy(() => import("./pages/HowitWorks"));
const Sell = lazy(() => import("./pages/Sell"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/WishList"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#1f3a2e] animate-spin" />
  </div>
);

function App() {
  return (
    <Router>

      {/* GLOBAL UI */}
      <ScrollToTop/>
      <ScrollProgress />
      <CustomCursor />

      <MainLayout>
        <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Landing />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/howitworks" element={<HowItWorks />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* 🔒 PROTECTED ROUTES */}
          <Route
            path="/sell"
            element={
              <ProtectedRoute>
                <Sell />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />

          <Route
            path="/success"
            element={
              <ProtectedRoute>
                <OrderSuccess />
              </ProtectedRoute>
            }
          />

        </Routes>
        </Suspense>
      </MainLayout>

    </Router>
  );
}

export default App;