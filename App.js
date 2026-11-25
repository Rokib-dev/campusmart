
import React from "react";
import AppNavigator from "./AppNavigator";

import { CartProvider } from "./context/CartContext";
import { ListingsProvider } from "./context/ListingsContext";
import { UsersProvider } from "./context/UsersContext";

export default function App() {
  return (
    <UsersProvider>
      <CartProvider>
        <ListingsProvider>
          <AppNavigator />
        </ListingsProvider>
      </CartProvider>
    </UsersProvider>
  );
}
