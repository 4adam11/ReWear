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
  const addToCart = (product) => {
    const productId = getItemId(product);

    setCartItems((prev) => {
      // CHECK IF EXISTS
      const existing = prev.find(
        (item) =>
          getItemId(item) === productId
      );

      // IF EXISTS -> INCREASE QUANTITY
      if (existing) {
        return prev.map((item) =>
          getItemId(item) === productId
            ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
            : item
        );
      }

      // NEW ITEM
      return [
        ...prev,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
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

        if (type === "inc") {
          return {
            ...item,
            quantity:
              item.quantity + 1,
          };
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