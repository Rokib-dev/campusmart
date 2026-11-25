
import React, { useCallback, useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  StatusBar,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useListings } from "../context/ListingsContext";
import { useCart } from "../context/CartContext";
import { useUsers } from "../context/UsersContext";

const PURPLE = "#8B5CF6";
const DARK = "#1B153B";
const BACKGROUND = "#F7F3FF";
const WHITE = "#FFFFFF";

const banners = [
  { id: "1", image: require("../assets/images/banner 1.jpg") },
  { id: "2", image: require("../assets/images/banner 2.jpg") },
  { id: "3", image: require("../assets/images/banner 3.jpg") },
  { id: "4", image: require("../assets/images/banner 4.jpg") },
];

const categories = [
  { name: "Phones & Tablets", icon: "phone-portrait-outline" },
  { name: "Computers", icon: "laptop-outline" },
  { name: "Electronics", icon: "headset-outline" },
  { name: "Fashion", icon: "shirt-outline" },
  { name: "Shoes", icon: "footsteps-outline" },
  { name: "Books & Study", icon: "book-outline" },
  { name: "Beauty", icon: "sparkles-outline" },
  { name: "Home & Hostel", icon: "bed-outline" },
];

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { listings } = useListings();
  const { cartCount } = useCart();
  const { currentUser } = useUsers();

  const [activeBanner, setActiveBanner] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Refresh this student's unread notification count whenever Home is focused.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadUnreadNotifications = async () => {
        try {
          const savedNotifications = await AsyncStorage.getItem(
            "campusmart_notifications"
          );

          const notifications = savedNotifications
            ? JSON.parse(savedNotifications)
            : [];

          const studentEmail = currentUser?.email
            ?.trim()
            .toLowerCase();

          const unreadCount = Array.isArray(notifications)
            ? notifications.filter((notification) => {
                const notificationEmail = notification.userEmail
                  ?.trim()
                  .toLowerCase();

                return (
                  studentEmail &&
                  notificationEmail === studentEmail &&
                  notification.isRead !== true
                );
              }).length
            : 0;

          if (isActive) {
            setUnreadNotificationCount(unreadCount);
          }
        } catch (error) {
          console.log("Error loading unread notifications:", error);

          if (isActive) {
            setUnreadNotificationCount(0);
          }
        }
      };

      loadUnreadNotifications();

      return () => {
        isActive = false;
      };
    }, [currentUser?.email])
  );

  // Show only approved products.
  const products = (listings || []).filter((item) => {
    return String(item.status || "").trim().toLowerCase() === "active";
  });

  // Automatic banner carousel.
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((previous) => (previous + 1) % banners.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  // Greeting based on time.
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";

    return "Good evening";
  };

  // Format price.
  const formatPrice = (price) => {
    const numericPrice = Number(
      String(price || 0).replace(/,/g, "")
    );

    if (!Number.isFinite(numericPrice)) {
      return "\u20A60";
    }

    return "\u20A6" + numericPrice.toLocaleString("en-NG");
  };

  // Open search.
  const openSearch = (category) => {
    navigation.navigate(
      "Search",
      category ? { category } : undefined
    );
  };

  // Open cart.
  const openCart = () => {
    navigation.navigate("Cart");
  };

  // Get product image.
  const getProductImage = (product) => {
    const images = Array.isArray(product.images)
      ? product.images
      : Array.isArray(product.photos)
      ? product.photos
      : [];

    if (images.length > 0) {
      const firstImage = images[0];

      if (typeof firstImage === "string") {
        return firstImage;
      }

      if (firstImage && firstImage.uri) {
        return firstImage.uri;
      }
    }

    if (typeof product.image === "string") {
      return product.image;
    }

    if (product.image && product.image.uri) {
      return product.image.uri;
    }

    return null;
  };

  // Open product details.
  const openProduct = (product) => {
    const normalizedProduct = {
      ...product,
      id: product.id || product._id,
      name: product.name || product.productName || "Unnamed Product",
      price: product.price,
      condition: product.condition || "Not specified",
      images: Array.isArray(product.images)
        ? product.images
        : Array.isArray(product.photos)
        ? product.photos
        : [],
      video: product.video || null,
    };

    navigation.navigate("ProductDetails", {
      product: normalizedProduct,
    });
  };

  // Open sell screen.
  const openSell = () => {
    navigation.navigate("Sell");
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={WHITE}
      />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10 },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              {getGreeting()}, welcome back
            </Text>
          </View>

          {/* CART AND NOTIFICATIONS */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.cartButton}
              onPress={openCart}
              activeOpacity={0.7}
            >
              <Ionicons
                name="cart-outline"
                size={24}
                color={DARK}
              />

              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartCount > 99 ? "99+" : cartCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* NOTIFICATION BUTTON */}
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate("Notifications")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="notifications-outline"
                size={23}
                color={DARK}
              />

              {unreadNotificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH BAR */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => openSearch()}
        >
          <Ionicons
            name="search-outline"
            size={21}
            color="#999"
          />

          <Text style={styles.searchPlaceholder}>
            Search for anything...
          </Text>

          <Ionicons
            name="options-outline"
            size={21}
            color={PURPLE}
          />
        </TouchableOpacity>
      </View>

      {/* HOME CONTENT */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 110 + insets.bottom },
        ]}
      >
        {/* BANNER CAROUSEL */}
        <View style={styles.bannerSection}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={openSell}
          >
            <Image
              source={banners[activeBanner].image}
              style={styles.banner}
              resizeMode="cover"
            />
          </TouchableOpacity>

          <View style={styles.bannerDots}>
            {banners.map((banner, index) => (
              <TouchableOpacity
                key={banner.id}
                onPress={() => setActiveBanner(index)}
                style={[
                  styles.dot,
                  activeBanner === index && styles.activeDot,
                ]}
              />
            ))}
          </View>
        </View>

        {/* CATEGORIES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Categories
            </Text>

            <TouchableOpacity onPress={() => openSearch()}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.name}
                style={styles.categoryItem}
                activeOpacity={0.75}
                onPress={() => openSearch(category.name)}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons
                    name={category.icon}
                    size={25}
                    color={PURPLE}
                  />
                </View>

                <Text style={styles.categoryName}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* POPULAR PRODUCTS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Popular Items
              </Text>

              <Text style={styles.sectionSubtitle}>
                Discover items from students
              </Text>
            </View>

            <TouchableOpacity onPress={() => openSearch()}>
              <Text style={styles.seeAll}>View all</Text>
            </TouchableOpacity>
          </View>

          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="storefront-outline"
                  size={38}
                  color={PURPLE}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No products available yet
              </Text>

              <Text style={styles.emptyDescription}>
                Products listed by students will appear here.
                Be the first to put something up for sale.
              </Text>

              <TouchableOpacity
                style={styles.emptyButton}
                onPress={openSell}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="add"
                  size={19}
                  color={WHITE}
                />

                <Text style={styles.emptyButtonText}>
                  List an Item
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {products.map((product, index) => (
                <ProductCard
                  key={product.id || product._id || index}
                  product={product}
                  width={width}
                  onPress={() => openProduct(product)}
                  getImage={getProductImage}
                  formatPrice={formatPrice}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <View
        style={[
          styles.bottomNav,
          { paddingBottom: Math.max(insets.bottom, 10) },
        ]}
      >
        <NavItem
          icon="home"
          label="Home"
          active
          onPress={() => navigation.navigate("Home")}
        />

        <NavItem
          icon="search-outline"
          label="Search"
          onPress={() => navigation.navigate("Search")}
        />

        <TouchableOpacity
          style={styles.sellNavButton}
          onPress={openSell}
          activeOpacity={0.8}
        >
          <View style={styles.sellIcon}>
            <Ionicons
              name="add"
              size={28}
              color={WHITE}
            />
          </View>

          <Text style={styles.navLabel}>Sell</Text>
        </TouchableOpacity>

        {/* CORRECTED ORDERS BUTTON */}
        <NavItem
          icon="receipt-outline"
          label="Orders"
          onPress={() => navigation.navigate("Orders")}
        />

        <NavItem
          icon="person-outline"
          label="Profile"
          onPress={() => navigation.navigate("Profile")}
        />
      </View>
    </View>
  );
}

// PRODUCT CARD
function ProductCard({
  product,
  width,
  onPress,
  getImage,
  formatPrice,
}) {
  const imageUri = getImage(product);

  const productName =
    product.name || product.productName || "Unnamed Product";

  const condition = product.condition || "Not specified";

  const cardWidth = width < 360 ? "48%" : "48.5%";

  return (
    <TouchableOpacity
      style={[styles.productCard, { width: cardWidth }]}
      activeOpacity={0.85}
      onPress={onPress}
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
              size={38}
              color="#B8A6E8"
            />
          </View>
        )}

        <View style={styles.conditionBadge}>
          <Text style={styles.conditionText}>
            {condition}
          </Text>
        </View>
      </View>

      <View style={styles.productInfo}>
        <Text
          style={styles.productName}
          numberOfLines={1}
        >
          {productName}
        </Text>

        <Text style={styles.productPrice}>
          {formatPrice(product.price)}
        </Text>

        <View style={styles.sellerRow}>
          <Ionicons
            name="person-circle-outline"
            size={15}
            color="#888"
          />

          <Text
            style={styles.sellerText}
            numberOfLines={1}
          >
            {product.seller || product.sellerName || "Student Seller"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// BOTTOM NAVIGATION ITEM
function NavItem({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={23}
        color={active ? PURPLE : "#999"}
      />

      <Text
        style={[
          styles.navLabel,
          active && styles.activeNavLabel,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// STYLES
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  header: {
    backgroundColor: WHITE,
    paddingHorizontal: 18,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    zIndex: 10,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  greetingContainer: {
    flex: 1,
  },

  greeting: {
    fontSize: 12,
    color: "#888",
    marginTop: 3,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  cartButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#F5F0FF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#E5484D",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: WHITE,
  },

  cartBadgeText: {
    color: WHITE,
    fontSize: 9,
    fontWeight: "900",
  },

  notificationButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#F5F0FF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#E5484D",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: WHITE,
  },

  notificationBadgeText: {
    color: WHITE,
    fontSize: 9,
    fontWeight: "900",
  },

  searchBar: {
    height: 48,
    backgroundColor: "#F5F3F9",
    borderRadius: 13,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: "#999",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 18,
  },

  bannerSection: {
    marginHorizontal: 16,
    marginBottom: 22,
  },

  banner: {
    width: "100%",
    height: 175,
    borderRadius: 18,
  },

  bannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 11,
    gap: 6,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: "#D5C9ED",
  },

  activeDot: {
    width: 20,
    backgroundColor: PURPLE,
  },

  section: {
    marginBottom: 25,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: DARK,
  },

  sectionSubtitle: {
    color: "#999",
    fontSize: 11,
    marginTop: 4,
  },

  seeAll: {
    fontSize: 12,
    fontWeight: "700",
    color: PURPLE,
  },

  categoryContainer: {
    paddingHorizontal: 16,
    gap: 13,
  },

  categoryItem: {
    width: 83,
    alignItems: "center",
  },

  categoryIcon: {
    width: 61,
    height: 61,
    borderRadius: 18,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    elevation: 1,
  },

  categoryName: {
    fontSize: 10,
    color: DARK,
    fontWeight: "600",
    textAlign: "center",
  },

  emptyContainer: {
    backgroundColor: WHITE,
    marginHorizontal: 16,
    paddingHorizontal: 24,
    paddingVertical: 30,
    borderRadius: 18,
    alignItems: "center",
  },

  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 25,
    backgroundColor: "#F3EDFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  emptyTitle: {
    color: DARK,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDescription: {
    color: "#999",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },

  emptyButton: {
    backgroundColor: PURPLE,
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 17,
  },

  emptyButtonText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "800",
  },

  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    rowGap: 14,
  },

  productCard: {
    backgroundColor: WHITE,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 2,
  },

  productImageContainer: {
    height: 145,
    backgroundColor: "#F0EBF8",
    position: "relative",
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  conditionBadge: {
    position: "absolute",
    top: 9,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  conditionText: {
    color: DARK,
    fontSize: 9,
    fontWeight: "700",
  },

  productInfo: {
    padding: 11,
  },

  productName: {
    color: DARK,
    fontSize: 12,
    fontWeight: "700",
  },

  productPrice: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 7,
  },

  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },

  sellerText: {
    color: "#999",
    fontSize: 10,
    flex: 1,
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    elevation: 15,
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  navLabel: {
    fontSize: 10,
    color: "#999",
    fontWeight: "600",
  },

  activeNavLabel: {
    color: PURPLE,
    fontWeight: "800",
  },

  sellNavButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },

  sellIcon: {
    width: 43,
    height: 32,
    borderRadius: 11,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },
});
