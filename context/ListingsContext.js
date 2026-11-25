
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

const ListingsContext = createContext(null);

const LISTINGS_STORAGE_KEY = "campusmart_listings";

export function ListingsProvider({ children }) {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved listings when the app starts.
  useEffect(() => {
    const loadListings = async () => {
      try {
        const savedListings = await AsyncStorage.getItem(
          LISTINGS_STORAGE_KEY
        );

        if (savedListings !== null) {
          const parsedListings = JSON.parse(savedListings);

          if (Array.isArray(parsedListings)) {
            setListings(parsedListings);
          }
        }
      } catch (error) {
        console.log("Error loading listings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadListings();
  }, []);

  // Save listings whenever they change, after the initial load.
  useEffect(() => {
    const saveListings = async () => {
      if (isLoading) return;

      try {
        await AsyncStorage.setItem(
          LISTINGS_STORAGE_KEY,
          JSON.stringify(listings)
        );
      } catch (error) {
        console.log("Error saving listings:", error);
      }
    };

    saveListings();
  }, [listings, isLoading]);

  // Add a new product.
  const addListing = (listing) => {
    const newListing = {
      ...listing,
      id: String(Date.now()),
      name: listing.name || listing.productName || "",
      images: listing.images || listing.photos || [],
      video: listing.video || null,
      status: listing.status || "Pending",
      createdAt: listing.createdAt || new Date().toISOString(),
    };

    setListings((previousListings) => [
      newListing,
      ...previousListings,
    ]);

    return newListing;
  };

  // Update an existing product.
  const updateListing = (id, updates) => {
    setListings((previousListings) =>
      previousListings.map((item) =>
        item.id === id
          ? { ...item, ...updates }
          : item
      )
    );
  };

  // Delete a product.
  const deleteListing = (id) => {
    setListings((previousListings) =>
      previousListings.filter((item) => item.id !== id)
    );
  };

  return (
    <ListingsContext.Provider
      value={{
        listings,
        addListing,
        updateListing,
        deleteListing,
        isLoading,
      }}
    >
      {children}
    </ListingsContext.Provider>
  );
}

export function useListings() {
  const context = useContext(ListingsContext);

  if (!context) {
    throw new Error(
      "useListings must be used inside ListingsProvider"
    );
  }

  return context;
}
