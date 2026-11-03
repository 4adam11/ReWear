import { createContext, useContext, useState } from "react";
import { useAuth } from "./AuthContext";
import { getCartKey } from "../utils/cart";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  const [cartItems, setCartItems] = useState([]);

  // EMPTY THE CART WHEN A DIFFERENT USER LOGS IN OR OUT
  const [owner, setOwner] = useState(user?._id);

  if (owner !== user?._id) {
    setOwner(user?._id);
    setCartItems([]);
  }

  // GET SAFE ID (product + buy/rent + dates)
  const getItemId = getCartKey;

  // ADD TO CART
  // Each listing is one physical item: adding it again (e.g. with new rental
  // dates or buy instead of rent) replaces the existing line.
  // Returns "added" or "updated".
  const addToCart = (product) => {
    const productId = product._id || product.id;

    const exists = cartItems.some(
      (item) =>
        (item._id || item.id) === productId
    );

    setCartItems((prev) => [
      ...prev.filter(
        (item) =>
          (item._id || item.id) !== productId
      ),
      {
        ...product,
        quantity: 1,
      },
    ]);

    return exists ? "updated" : "added";
  };

  // REMOVE
  const removeFromCart = (id) => {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          getItemId(item) !== id
      )
    );
  };

  // UPDATE QUANTITY
  const updateQuantity = (id, type) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (
          getItemId(item) !== id
        ) {
          return item;
        }

        // Second-hand items are one of a kind, so never more than 1
        if (type === "inc") {
          return item;
        }

        if (
          type === "dec" &&
          item.quantity > 1
        ) {
          return {
            ...item,
            quantity:
              item.quantity - 1,
          };
        }

        return item;
      })
    );
  };

  // CLEAR
  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context =
    useContext(CartContext);

  // SAFETY FALLBACK
  if (!context) {
    return {
      cartItems: [],
      addToCart: () => { },
      removeFromCart: () => { },
      updateQuantity: () => { },
      clearCart: () => { },
    };
  }

  return context;
};