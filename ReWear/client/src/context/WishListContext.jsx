import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import axios from "axios";
import { useAuth } from "./AuthContext";
import API from "../utils/api";
import { toast } from "../utils/feedback";

const WishlistContext =
  createContext();

const readWishlist = (userId) => {
  if (!userId) return [];

  try {
    return (
      JSON.parse(
        localStorage.getItem(
          `wishlist_${userId}`
        )
      ) || []
    );
  } catch {
    return [];
  }
};

export const WishlistProvider = ({
  children,
}) => {
  const { user } = useAuth();

  const userId = user?._id;

  const [wishlist, setWishlist] =
    useState(() => readWishlist(userId));

  const [owner, setOwner] =
    useState(userId);

  // RELOAD WHEN THE LOGGED-IN USER CHANGES
  // (so one user's list never shows up or gets saved for another)
  if (owner !== userId) {
    setOwner(userId);
    setWishlist(readWishlist(userId));
  }

  // SAVE
  useEffect(() => {
    if (!userId) return;

    localStorage.setItem(
      `wishlist_${userId}`,
      JSON.stringify(wishlist)
    );
  }, [userId, wishlist]);

  // TOGGLE
  const toggleWishlist = (
    product
  ) => {
    // BLOCK IF LOGGED OUT
    if (!userId) {
      // Back to this page after logging in
      const from = window.location.pathname + window.location.search;
      toast("Log in to save items to your wishlist.", "info", { label: "Log in", to: "/login", state: { from } });
      return;
    }

    // Tell the server too, so sellers can see how many people saved a listing
    const id = product._id || product.id;
    const saving = !wishlist.some((p) => (p._id || p.id) === id);
    axios
      .post(`${API}/products/${id}/save`, { saved: saving }, { headers: { Authorization: `Bearer ${user?.token}` } })
      .catch(() => {});

    setWishlist((prev) => {
      const exists = prev.find(
        (p) =>
          (p._id || p.id) ===
          (product._id ||
            product.id)
      );

      // REMOVE
      if (exists) {
        return prev.filter(
          (p) =>
            (p._id || p.id) !==
            (product._id ||
              product.id)
        );
      }

      // ADD
      // Keep only what the card shows (full products with photos can fill browser storage)
      const { _id, id, title, images, price, rent, mode, category, size, condition } = product;

      return [
        { _id, id, title, images: images?.slice(0, 1), price, rent, mode, category, size, condition },
        ...prev,
      ];
    });
  };

  // CLEAR
  const clearWishlist = () => {
    setWishlist([]);

    if (userId) {
      localStorage.removeItem(
        `wishlist_${userId}`
      );
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () =>
  useContext(WishlistContext);