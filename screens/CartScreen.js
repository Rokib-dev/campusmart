
import React from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
  Alert,
  Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";

const PURPLE = "#8B5CF6";
const DARK = "#1B153B";
const BACKGROUND = "#F5F0FF";
const MUTED = "#888399";
const WHITE = "#FFFFFF";

export default function CartScreen({ navigation }) {
  const { width } = useWindowDimensions();

  const isSmallPhone = width < 380;
  const isDesktop = width >= 768;

  const {
    cartItems,
    cartCount,
    removeFromCart,
    updateQuantity,
  } = useCart();

  // Delivery is charged once per order.
  const deliveryFee = cartItems.length > 0 ? 500 : 0;

  // Calculate subtotal.
  const subtotal = cartItems.reduce((total, item) => {
    const price = Math.max(0, Number(item.price) || 0);
    const quantity = Math.max(0, Number(item.quantity) || 0);

    return total + price * quantity;
  }, 0);

  const total = subtotal + deliveryFee;

  // Format prices in Naira.
  const formatPrice = (amount) => {
    return "₦" + Number(amount || 0).toLocaleString("en-NG");
  };

  // Get product name.
  const getProductName = (item) => {
    return item.name || item.productName || "CampusMart Product";
  };

  // Get product image.
  const getProductImage = (item) => {
    const images =
      Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : Array.isArray(item.photos) && item.photos.length > 0
        ? item.photos
        : [];

    const image = images[0] || item.image || null;

    if (!image) return null;

    if (typeof image === "string") {
      return { uri: image };
    }

    if (image.uri) {
      return { uri: image.uri };
    }

    return null;
  };

  // Increase quantity.
  const increaseQuantity = (item) => {
    const currentQuantity = Number(item.quantity) || 0;

    updateQuantity(item.id, currentQuantity + 1);
  };

  // Decrease quantity.
  const decreaseQuantity = (item) => {
    const currentQuantity = Number(item.quantity) || 0;

    if (currentQuantity <= 1) {
      handleRemove(item);
      return;
    }

    updateQuantity(item.id, currentQuantity - 1);
  };

  // Remove product.
  const handleRemove = (item) => {
    Alert.alert(
      "Remove Product",
      `Remove ${getProductName(item)} from your cart?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeFromCart(item.id),
        },
      ]
    );
  };

  // Open checkout.
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert(
        "Your cart is empty",
        "Add a product before checkout."
      );
      return;
    }

    navigation.navigate("Checkout");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.container,
            isDesktop && styles.desktopContainer,
            isSmallPhone && styles.smallPhoneContainer,
          ]}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={DARK}
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>My Cart</Text>

            <View style={styles.cartIcon}>
              <Ionicons
                name="cart-outline"
                size={23}
                color={PURPLE}
              />
            </View>
          </View>

          <Text style={styles.subtitle}>
            Review your items before checkout.
          </Text>

          {/* EMPTY CART */}
          {cartItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="cart-outline"
                  size={55}
                  color={PURPLE}
                />
              </View>

              <Text style={styles.emptyTitle}>
                Your cart is empty
              </Text>

              <Text style={styles.emptyText}>
                Browse the marketplace and add products
                you want to buy.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate("Home")}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>
                  Explore Marketplace
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color={WHITE}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* ITEMS HEADER */}
              <View style={styles.itemsHeader}>
                <Text style={styles.sectionTitle}>
                  Your Items
                </Text>

                <Text style={styles.itemCount}>
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </Text>
              </View>

              {/* PRODUCT LIST */}
              {cartItems.map((item) => {
                const productImage = getProductImage(item);
                const productName = getProductName(item);
                const quantity = Number(item.quantity) || 0;
                const price = Number(item.price) || 0;

                return (
                  <View
                    key={String(item.id)}
                    style={[
                      styles.productCard,
                      isSmallPhone && styles.smallProductCard,
                    ]}
                  >
                    {/* PRODUCT IMAGE */}
                    <View
                      style={[
                        styles.productImage,
                        isSmallPhone && styles.smallProductImage,
                      ]}
                    >
                      {productImage ? (
                        <Image
                          source={productImage}
                          style={styles.productImageContent}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons
                          name="cube-outline"
                          size={38}
                          color={PURPLE}
                        />
                      )}
                    </View>

                    {/* PRODUCT DETAILS */}
                    <View style={styles.productInfo}>
                      <Text
                        style={styles.productName}
                        numberOfLines={2}
                      >
                        {productName}
                      </Text>

                      <Text style={styles.condition}>
                        {item.condition || "Condition not specified"}
                      </Text>

                      <Text style={styles.productPrice}>
                        {formatPrice(price)}
                      </Text>

                      <Text style={styles.itemTotal}>
                        Item total: {formatPrice(price * quantity)}
                      </Text>

                      {/* QUANTITY CONTROLS */}
                      <View style={styles.quantityRow}>
                        <View style={styles.quantityControls}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => decreaseQuantity(item)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name="remove"
                              size={18}
                              color={DARK}
                            />
                          </TouchableOpacity>

                          <Text style={styles.quantity}>
                            {quantity}
                          </Text>

                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => increaseQuantity(item)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name="add"
                              size={18}
                              color={DARK}
                            />
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemove(item)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#EF4444"
                          />

                          <Text style={styles.removeText}>
                            Remove
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* ORDER SUMMARY */}
              <View style={styles.summaryCard}>
                <Text style={styles.sectionTitle}>
                  Order Summary
                </Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Subtotal
                  </Text>

                  <Text style={styles.summaryValue}>
                    {formatPrice(subtotal)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Delivery fee
                  </Text>

                  <Text style={styles.summaryValue}>
                    {formatPrice(deliveryFee)}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>
                    Total
                  </Text>

                  <Text style={styles.totalValue}>
                    {formatPrice(total)}
                  </Text>
                </View>

                {/* CHECKOUT BUTTON */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleCheckout}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>
                    Proceed to Checkout
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={WHITE}
                  />
                </TouchableOpacity>

                <View style={styles.secureNote}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={17}
                    color={PURPLE}
                  />

                  <Text style={styles.secureText}>
                    Review your order before placing it
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* FOOTER */}
          <Text style={styles.footer}>
            CampusMart{"\n"}
            Your Campus. Your Marketplace.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  container: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
  },

  desktopContainer: {
    maxWidth: 780,
    paddingHorizontal: 35,
    paddingTop: 30,
  },

  smallPhoneContainer: {
    paddingHorizontal: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: WHITE,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: DARK,
  },

  cartIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EDE5FF",
    justifyContent: "center",
    alignItems: "center",
  },

  subtitle: {
    fontSize: 14,
    color: MUTED,
    marginBottom: 25,
  },

  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: DARK,
  },

  itemCount: {
    fontSize: 13,
    color: MUTED,
  },

  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    gap: 14,
    width: "100%",
  },

  smallProductCard: {
    padding: 11,
    gap: 10,
  },

  productImage: {
    width: 100,
    height: 115,
    borderRadius: 15,
    backgroundColor: "#F0E9FF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  smallProductImage: {
    width: 78,
    height: 95,
  },

  productImageContent: {
    width: "100%",
    height: "100%",
  },

  productInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  productName: {
    fontSize: 15,
    fontWeight: "800",
    color: DARK,
    lineHeight: 21,
  },

  condition: {
    fontSize: 12,
    color: MUTED,
    marginTop: 5,
  },

  productPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: PURPLE,
    marginTop: 8,
  },

  itemTotal: {
    fontSize: 11,
    color: MUTED,
    marginTop: 3,
  },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },

  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  quantityButton: {
    width: 31,
    height: 31,
    borderRadius: 9,
    backgroundColor: "#F0E9FF",
    alignItems: "center",
    justifyContent: "center",
  },

  quantity: {
    fontSize: 15,
    fontWeight: "800",
    color: DARK,
    minWidth: 15,
    textAlign: "center",
  },

  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
  },

  removeText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "700",
  },

  summaryCard: {
    backgroundColor: WHITE,
    padding: 22,
    borderRadius: 22,
    marginTop: 15,
    width: "100%",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    gap: 10,
  },

  summaryLabel: {
    fontSize: 14,
    color: MUTED,
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: DARK,
  },

  divider: {
    height: 1,
    backgroundColor: "#EEEAF5",
    marginTop: 20,
  },

  totalLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: DARK,
  },

  totalValue: {
    fontSize: 21,
    fontWeight: "800",
    color: PURPLE,
  },

  primaryButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: PURPLE,
    paddingVertical: 17,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginTop: 25,
    gap: 10,
    width: "100%",
  },

  primaryButtonText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    flexShrink: 1,
  },

  secureNote: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 17,
  },

  secureText: {
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
  },

  emptyContainer: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 25,
    alignItems: "center",
    marginTop: 15,
  },

  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#EDE5FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: DARK,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    color: MUTED,
    marginTop: 10,
    maxWidth: 300,
  },

  footer: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 20,
    color: "#9994A8",
    marginTop: 30,
  },
});
