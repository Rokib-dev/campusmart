
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

const CartContext = createContext(null);

const CART_STORAGE_KEY = "campusmart_cart";

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  // LOAD SAVED CART WHEN THE APP OPENS.
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await AsyncStorage.getItem(
          CART_STORAGE_KEY
        );

        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);

          if (Array.isArray(parsedCart)) {
            setCartItems(parsedCart);
          }
        }
      } catch (error) {
        console.log("Error loading cart:", error);
      } finally {
        setIsCartLoaded(true);
      }
    };

    loadCart();
  }, []);

  // SAVE CART WHENEVER IT CHANGES.
  useEffect(() => {
    if (!isCartLoaded) return;

    const saveCart = async () => {
      try {
        await AsyncStorage.setItem(
          CART_STORAGE_KEY,
          JSON.stringify(cartItems)
        );
      } catch (error) {
        console.log("Error saving cart:", error);
      }
    };

    saveCart();
  }, [cartItems, isCartLoaded]);

  // ADD A PRODUCT TO THE CART.
  const addToCart = (product) => {
    const productId =
      product.id || `${product.name}-${product.price}`;

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.id === productId
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: Number(item.quantity || 0) + 1,
              }
            : item
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          id: productId,
          quantity: 1,
        },
      ];
    });
  };

  // REMOVE A PRODUCT COMPLETELY.
  const removeFromCart = (productId) => {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== productId
      )
    );
  };

  // INCREASE OR DECREASE QUANTITY.
  const updateQuantity = (productId, quantity) => {
    const newQuantity = Number(quantity);

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: newQuantity,
            }
          : item
      )
    );
  };

  // EMPTY THE ENTIRE CART.
  const clearCart = () => {
    setCartItems([]);
  };

  // CALCULATE TOTAL NUMBER OF ITEMS.
  const cartCount = cartItems.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}
