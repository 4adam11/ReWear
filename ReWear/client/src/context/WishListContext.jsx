import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import { useAuth } from "./AuthContext";

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
      alert(
        "Please login to use wishlist"
      );

      return;
    }

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