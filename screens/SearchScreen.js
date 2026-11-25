
import React, { useMemo, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useListings } from "../context/ListingsContext";

const categories = [
  "All",
  "Phones & Tablets",
  "Computers",
  "Electronics",
  "Fashion",
  "Shoes",
  "Books & Study",
  "Beauty",
  "Home & Hostel",
];

const popularSearches = [
  "iPhone",
  "Laptop",
  "Sneakers",
  "Bags",
  "Books",
  "Headphones",
];

export default function SearchScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const { listings } = useListings();

  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    route?.params?.category || "All"
  );

  const isDesktop = width >= 768;

  // Only admin-approved products are available to students.
  const activeListings = useMemo(() => {
    return (listings || []).filter((item) => {
      return (
        String(item.status || "").trim().toLowerCase() === "active"
      );
    });
  }, [listings]);

  // Filter products by category and search text.
  const filteredProducts = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return activeListings.filter((item) => {
      const productName = String(
        item.name || item.productName || ""
      ).toLowerCase();

      const description = String(
        item.description || ""
      ).toLowerCase();

      const category = String(
        item.category || ""
      ).toLowerCase();

      const location = String(
        item.location || ""
      ).toLowerCase();

      const matchesCategory =
        selectedCategory === "All" ||
        category === selectedCategory.toLowerCase();

      const matchesSearch =
        !search ||
        productName.includes(search) ||
        description.includes(search) ||
        category.includes(search) ||
        location.includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [activeListings, searchText, selectedCategory]);

  const getProductName = (item) => {
    return item.name || item.productName || "Untitled Product";
  };

  const getProductImage = (item) => {
    const images = item.images || item.photos || [];

    if (!images.length) {
      return null;
    }

    const firstImage = images[0];

    if (typeof firstImage === "string") {
      return firstImage;
    }

    return firstImage?.uri || null;
  };

  const formatPrice = (price) => {
    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice)) {
      return "Price unavailable";
    }

    return `₦${numericPrice.toLocaleString("en-NG")}`;
  };

  const openProduct = (item) => {
    const normalizedProduct = {
      ...item,
      name: getProductName(item),
      images: item.images || item.photos || [],
    };

    navigation.navigate("ProductDetails", {
      product: normalizedProduct,
    });
  };

  const selectPopularSearch = (item) => {
    setSearchText(item);
    setSelectedCategory("All");
  };

  const clearSearch = () => {
    setSearchText("");
    setSelectedCategory("All");
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.content,
          isDesktop && styles.desktopContent,
        ]}
      >
        {/* HEADER */}
        <View
          style={[
            styles.header,
            {
              height: 70 + insets.top,
              paddingTop: insets.top,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#1B153B"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Search</Text>

          <View style={styles.headerSpace} />
        </View>

        {/* SEARCH BOX */}
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={22}
            color="#8B5CF6"
          />

          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search for products..."
            placeholderTextColor="#9B94AA"
            style={styles.searchInput}
            autoCapitalize="none"
            returnKeyType="search"
          />

          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons
                name="close-circle"
                size={21}
                color="#A7A0B5"
              />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 110 + insets.bottom },
          ]}
        >
          {/* CATEGORIES */}
          <Text style={styles.sectionTitle}>Categories</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScrollWrap}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((category) => {
              const active = selectedCategory === category;

              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    active && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      active && styles.categoryTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* POPULAR SEARCHES */}
          {!searchText.trim() && selectedCategory === "All" && (
            <>
              <Text style={styles.sectionTitle}>
                Popular Searches
              </Text>

              <View style={styles.popularContainer}>
                {popularSearches.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.popularItem}
                    onPress={() => selectPopularSearch(item)}
                  >
                    <Ionicons
                      name="trending-up-outline"
                      size={18}
                      color="#8B5CF6"
                    />

                    <Text style={styles.popularText}>
                      {item}
                    </Text>

                    <Ionicons
                      name="arrow-forward-outline"
                      size={17}
                      color="#A7A0B5"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* SEARCH RESULTS */}
          <View style={styles.resultsHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {searchText.trim() || selectedCategory !== "All"
                  ? "Search Results"
                  : "Available Products"}
              </Text>

              <Text style={styles.resultsCount}>
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1
                  ? "product found"
                  : "products found"}
              </Text>
            </View>

            {(searchText.trim() ||
              selectedCategory !== "All") && (
              <TouchableOpacity onPress={clearSearch}>
                <Text style={styles.clearText}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {filteredProducts.map((item) => {
                const imageUri = getProductImage(item);

                return (
                  <TouchableOpacity
                    key={String(item.id)}
                    style={[
                      styles.productCard,
                      {
                        width: isDesktop ? "31.5%" : "48%",
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => openProduct(item)}
                  >
                    <View style={styles.productImageContainer}>
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Ionicons
                            name="image-outline"
                            size={35}
                            color="#B9ADD3"
                          />
                        </View>
                      )}

                      <View style={styles.approvedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={12}
                          color="#27845A"
                        />
                        <Text style={styles.approvedText}>
                          Available
                        </Text>
                      </View>
                    </View>

                    <View style={styles.productInfo}>
                      <Text
                        style={styles.productName}
                        numberOfLines={2}
                      >
                        {getProductName(item)}
                      </Text>

                      <Text style={styles.productPrice}>
                        {formatPrice(item.price)}
                      </Text>

                      <Text
                        style={styles.productCategory}
                        numberOfLines={1}
                      >
                        {item.category || "Other"}
                      </Text>

                      {item.location ? (
                        <View style={styles.locationRow}>
                          <Ionicons
                            name="location-outline"
                            size={13}
                            color="#938BA4"
                          />
                          <Text
                            style={styles.locationText}
                            numberOfLines={1}
                          >
                            {item.location}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="search-outline"
                  size={38}
                  color="#8B5CF6"
                />
              </View>

              <Text style={styles.emptyTitle}>
                {searchText.trim() || selectedCategory !== "All"
                  ? "No products found"
                  : "No products available yet"}
              </Text>

              <Text style={styles.emptyText}>
                {searchText.trim() || selectedCategory !== "All"
                  ? "Try another search term or choose a different category."
                  : "Approved products will appear here when sellers publish their listings and the admin approves them."}
              </Text>

              {(searchText.trim() ||
                selectedCategory !== "All") && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={clearSearch}
                >
                  <Text style={styles.resetButtonText}>
                    Clear Search
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        {/* BOTTOM NAVIGATION */}
        <View
          style={[
            styles.bottomNav,
            {
              height: 78 + insets.bottom,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("Home")}
          >
            <Ionicons
              name="home-outline"
              size={23}
              color="#9B94AA"
            />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Ionicons
              name="search"
              size={23}
              color="#8B5CF6"
            />
            <Text
              style={[
                styles.navText,
                styles.navTextActive,
              ]}
            >
              Search
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sellButton}
            onPress={() => navigation.navigate("Sell")}
          >
            <Ionicons
              name="add"
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("Orders")}
          >
            <Ionicons
              name="receipt-outline"
              size={23}
              color="#9B94AA"
            />
            <Text style={styles.navText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons
              name="person-outline"
              size={23}
              color="#9B94AA"
            />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3FF",
  },

  content: {
    flex: 1,
  },

  desktopContent: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
  },

  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 21,
    fontWeight: "800",
    color: "#1B153B",
  },

  headerSpace: {
    width: 42,
  },

  searchBox: {
    marginHorizontal: 20,
    height: 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE8FA",
  },

  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#1B153B",
  },

  scrollContent: {
    paddingTop: 28,
    paddingBottom: 110,
    paddingHorizontal: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1B153B",
    marginBottom: 14,
    marginTop: 5,
  },

  categoryScrollWrap: {
    marginHorizontal: -20,
    flexGrow: 0,
  },

  categoryScroll: {
    paddingBottom: 25,
    paddingHorizontal: 20,
    gap: 10,
  },

  categoryButton: {
    paddingHorizontal: 17,
    paddingVertical: 11,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E9E1F7",
  },

  categoryButtonActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },

  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5E576F",
  },

  categoryTextActive: {
    color: "#FFFFFF",
  },

  popularContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 30,
  },

  popularItem: {
    minHeight: 58,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0ECF7",
  },

  popularText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#332B4D",
    fontWeight: "600",
  },

  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  resultsCount: {
    color: "#938BA4",
    fontSize: 13,
    marginTop: -8,
  },

  clearText: {
    color: "#8B5CF6",
    fontSize: 13,
    fontWeight: "700",
  },

  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },

  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEE8F6",
    marginBottom: 2,
  },

  productImageContainer: {
    height: 145,
    backgroundColor: "#EEE8F6",
    position: "relative",
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEE8F6",
  },

  approvedBadge: {
    position: "absolute",
    left: 8,
    top: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },

  approvedText: {
    color: "#27845A",
    fontSize: 10,
    fontWeight: "700",
  },

  productInfo: {
    padding: 11,
  },

  productName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1B153B",
    minHeight: 36,
  },

  productPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#8B5CF6",
    marginTop: 7,
  },

  productCategory: {
    color: "#777083",
    fontSize: 11,
    marginTop: 5,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 3,
  },

  locationText: {
    color: "#938BA4",
    fontSize: 10,
    flex: 1,
  },

  emptyState: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 45,
    paddingBottom: 35,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#EDE5FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1B153B",
    marginBottom: 8,
    textAlign: "center",
  },

  emptyText: {
    textAlign: "center",
    color: "#777083",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 400,
  },

  resetButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },

  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEE8F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 55,
  },

  navText: {
    fontSize: 11,
    marginTop: 4,
    color: "#9B94AA",
    fontWeight: "600",
  },

  navTextActive: {
    color: "#8B5CF6",
  },

  sellButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -25,
    elevation: 5,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
});
