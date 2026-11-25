
import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useCart } from "../context/CartContext";
import { useUsers } from "../context/UsersContext";

const ORDERS_STORAGE_KEY = "campusmart_orders";
const NOTIFICATIONS_STORAGE_KEY = "campusmart_notifications";
const DELIVERY_FEE = 500;

const PURPLE = "#8B5CF6";
const DARK = "#1B153B";
const MUTED = "#817991";
const WHITE = "#FFFFFF";

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

export default function CheckoutScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isSmallPhone = width < 380;
  const isDesktop = width >= 768;

  const { cartItems, clearCart } = useCart();
  const { currentUser } = useUsers();

  const [fullName, setFullName] = useState(
    currentUser?.fullName || ""
  );

  const [phone, setPhone] = useState(
    currentUser?.phone || ""
  );

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  // Get product name.
  const getProductName = (item) => {
    return item.name || item.productName || "CampusMart item";
  };

  // Get product image.
  const getProductImage = (item) => {
    const images =
      Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : Array.isArray(item.photos) && item.photos.length > 0
        ? item.photos
        : [];

    const firstImage = images[0] || item.image || null;

    if (typeof firstImage === "string") {
      return firstImage;
    }

    if (firstImage?.uri) {
      return firstImage.uri;
    }

    return null;
  };

  // Calculate subtotal.
  const subtotal = cartItems.reduce((total, item) => {
    const price = Math.max(0, Number(item.price) || 0);
    const quantity = Math.max(0, Number(item.quantity) || 0);

    return total + price * quantity;
  }, 0);

  // Charge delivery only when there are products.
  const deliveryFee =
    cartItems.length > 0 ? DELIVERY_FEE : 0;

  const total = subtotal + deliveryFee;

  // Format Naira.
  const formatMoney = (amount) => {
    return `₦${Number(amount || 0).toLocaleString("en-NG")}`;
  };

  // Generate order number.
  const generateOrderNumber = () => {
    const date = new Date();

    const datePart =
      `${date.getFullYear()}` +
      `${String(date.getMonth() + 1).padStart(2, "0")}` +
      `${String(date.getDate()).padStart(2, "0")}`;

    const randomPart = Math.floor(
      10000 + Math.random() * 90000
    );

    return `CM-${datePart}-${randomPart}`;
  };

  // Save notifications without interrupting order placement.
  const saveOrderNotifications = async (order) => {
    try {
      const savedNotifications = await AsyncStorage.getItem(
        NOTIFICATIONS_STORAGE_KEY
      );

      const parsedNotifications = savedNotifications
        ? JSON.parse(savedNotifications)
        : [];

      const existingNotifications = Array.isArray(parsedNotifications)
        ? parsedNotifications
        : [];

      const now = new Date().toISOString();
      const newNotifications = [];

      // BUYER NOTIFICATION
      const buyerEmail = normalizeEmail(order.buyerEmail);

      if (buyerEmail || order.buyerAccountId) {
        newNotifications.push({
          id: `order-buyer-${order.id}-${Date.now()}`,
          userEmail: buyerEmail,
          ...(order.buyerAccountId
            ? { userAccountId: order.buyerAccountId }
            : {}),
          title: "Order placed successfully",
          message: `Your order ${order.id} has been received. Your order is currently awaiting payment confirmation.`,
          type: "order",
          isRead: false,
          createdAt: now,
          orderId: order.id,
        });
      }

      // SELLER NOTIFICATIONS
      // One notification per unique seller account/email.
      const notifiedSellers = new Set();

      order.items.forEach((item, index) => {
        const sellerEmail = normalizeEmail(item.sellerEmail);
        const sellerAccountId = item.sellerAccountId || "";

        if (!sellerEmail && !sellerAccountId) {
          return;
        }

        const sellerKey = sellerAccountId
          ? `account:${sellerAccountId}`
          : `email:${sellerEmail}`;

        if (notifiedSellers.has(sellerKey)) {
          return;
        }

        notifiedSellers.add(sellerKey);

        const sellerItems = order.items.filter((orderItem) => {
          const itemEmail = normalizeEmail(orderItem.sellerEmail);
          const itemAccountId = orderItem.sellerAccountId || "";

          if (sellerAccountId && itemAccountId) {
            return sellerAccountId === itemAccountId;
          }

          return sellerEmail && itemEmail === sellerEmail;
        });

        const itemNames = sellerItems
          .map((sellerItem) => sellerItem.name)
          .filter(Boolean);

        const itemDescription =
          itemNames.length > 0
            ? itemNames.join(", ")
            : "your listed product";

        newNotifications.push({
          id: `order-seller-${order.id}-${index}-${Date.now()}`,
          userEmail: sellerEmail,
          ...(sellerAccountId
            ? { userAccountId: sellerAccountId }
            : {}),
          title: "You have a new order",
          message: `A buyer has ordered ${itemDescription}. Order number: ${order.id}. Please check your orders.`,
          type: "order",
          isRead: false,
          createdAt: now,
          orderId: order.id,
        });
      });

      if (newNotifications.length > 0) {
        await AsyncStorage.setItem(
          NOTIFICATIONS_STORAGE_KEY,
          JSON.stringify([
            ...newNotifications,
            ...existingNotifications,
          ])
        );
      }
    } catch (error) {
      console.log("Order notification error:", error);
    }
  };

  // Validate and confirm order.
  const handlePlaceOrder = () => {
    if (placingOrder) return;

    if (cartItems.length === 0) {
      Alert.alert(
        "Your cart is empty",
        "Add a product before checking out."
      );
      return;
    }

    if (
      !fullName.trim() ||
      !phone.trim() ||
      !deliveryAddress.trim()
    ) {
      Alert.alert(
        "Missing information",
        "Please enter your full name, phone number and delivery address."
      );
      return;
    }

    const phoneDigits = phone.trim().replace(/\D/g, "");

    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      Alert.alert(
        "Invalid phone number",
        "Please enter a valid phone number."
      );
      return;
    }

    Alert.alert(
      "Confirm your order",
      `Your total is ${formatMoney(total)}.\n\nDo you want to place this order?`,
      [
        {
          text: "Review",
          style: "cancel",
        },
        {
          text: "Place Order",
          onPress: saveOrder,
        },
      ]
    );
  };

  // Save order to local storage.
  const saveOrder = async () => {
    if (placingOrder) return;

    setPlacingOrder(true);

    try {
      const savedOrders = await AsyncStorage.getItem(
        ORDERS_STORAGE_KEY
      );

      const parsedOrders = savedOrders
        ? JSON.parse(savedOrders)
        : [];

      const existingOrders = Array.isArray(parsedOrders)
        ? parsedOrders
        : [];

      const orderDate = new Date().toISOString();

      const newOrder = {
        id: generateOrderNumber(),

        // Buyer information.
        buyerName: fullName.trim(),

        buyerEmail: normalizeEmail(currentUser?.email),

        // NEW: Save the buyer's unique CampusMart account ID.
        buyerAccountId: currentUser?.accountId || "",

        buyerPhone: phone.trim(),

        // Keep these fields for compatibility
        // with existing order screens.
        customerName: fullName.trim(),
        phone: phone.trim(),

        // Delivery information.
        deliveryAddress: deliveryAddress.trim(),
        deliveryNote: deliveryNote.trim(),

        // Product information.
        items: cartItems.map((item) => ({
          id:
            item.id ||
            `${getProductName(item)}-${item.price}`,

          name: getProductName(item),
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          image: getProductImage(item),

          sellerAccountId: item.sellerAccountId || "",
          sellerName: item.sellerName || "",
          sellerEmail: normalizeEmail(item.sellerEmail),
        })),

        // Price information.
        subtotal,
        deliveryFee,
        total,

        // Order status.
        status: "Payment Pending",
        paymentStatus: "Not Paid",

        // Dates.
        date: orderDate,
        createdAt: orderDate,
      };

      const updatedOrders = [
        newOrder,
        ...existingOrders,
      ];

      // First save the order.
      await AsyncStorage.setItem(
        ORDERS_STORAGE_KEY,
        JSON.stringify(updatedOrders)
      );

      // Then notify the buyer and sellers.
      await saveOrderNotifications(newOrder);

      // Clear the cart after saving the order.
      clearCart();

      Alert.alert(
        "Order placed successfully",
        `Your order number is ${newOrder.id}.\n\nPayment has not been collected yet. Our team will follow up with you.`,
        [
          {
            text: "View My Orders",
            onPress: () => navigation.navigate("Orders"),
          },
        ]
      );
    } catch (error) {
      console.log("Order saving error:", error);

      Alert.alert(
        "Unable to place order",
        "Something went wrong while saving your order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
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

        <Text style={styles.headerTitle}>
          Checkout
        </Text>

        <View style={styles.headerPlaceholder} />
      </View>

      {/* EMPTY CART */}
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="bag-outline"
              size={48}
              color={PURPLE}
            />
          </View>

          <Text style={styles.emptyTitle}>
            Nothing to checkout
          </Text>

          <Text style={styles.emptyText}>
            Your cart is empty. Add some products before
            continuing to checkout.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.primaryButtonText}>
              Explore Marketplace
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={
            Platform.OS === "ios" ? "padding" : undefined
          }
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollContent,
              isDesktop && styles.desktopScrollContent,
              isSmallPhone && styles.smallScrollContent,
              { paddingBottom: 35 + insets.bottom },
            ]}
          >
            <View
              style={[
                styles.content,
                isDesktop && styles.desktopContent,
              ]}
            >
              <Text style={styles.pageTitle}>
                Complete your order
              </Text>

              <Text style={styles.pageSubtitle}>
                Enter your details so we can arrange your delivery.
              </Text>

              {/* DELIVERY INFORMATION */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeading}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={PURPLE}
                  />

                  <Text style={styles.sectionTitle}>
                    Delivery information
                  </Text>
                </View>

                <Text style={styles.inputLabel}>
                  Full name *
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#A49BB5"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />

                <Text style={styles.inputLabel}>
                  Phone number *
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#A49BB5"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />

                <Text style={styles.inputLabel}>
                  Delivery address *
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    styles.addressInput,
                  ]}
                  placeholder="e.g. OOU Main Campus, Hostel name, Room number"
                  placeholderTextColor="#A49BB5"
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  multiline
                  textAlignVertical="top"
                />

                <Text style={styles.inputLabel}>
                  Additional delivery note (optional)
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    styles.addressInput,
                  ]}
                  placeholder="Any directions that will help us find you"
                  placeholderTextColor="#A49BB5"
                  value={deliveryNote}
                  onChangeText={setDeliveryNote}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* ORDER ITEMS */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeading}>
                  <Ionicons
                    name="bag-outline"
                    size={20}
                    color={PURPLE}
                  />

                  <Text style={styles.sectionTitle}>
                    Your items
                  </Text>

                  <View style={styles.itemCountBadge}>
                    <Text style={styles.itemCountText}>
                      {cartItems.length}
                    </Text>
                  </View>
                </View>

                {cartItems.map((item, index) => {
                  const image = getProductImage(item);
                  const quantity =
                    Number(item.quantity) || 1;
                  const price =
                    Number(item.price) || 0;

                  return (
                    <View
                      key={
                        item.id ||
                        `${getProductName(item)}-${index}`
                      }
                      style={styles.itemRow}
                    >
                      <View
                        style={[
                          styles.itemImage,
                          isSmallPhone && styles.smallItemImage,
                        ]}
                      >
                        {image ? (
                          <Image
                            source={{ uri: image }}
                            style={styles.itemImageContent}
                            resizeMode="cover"
                          />
                        ) : (
                          <Ionicons
                            name="image-outline"
                            size={26}
                            color={PURPLE}
                          />
                        )}
                      </View>

                      <View style={styles.itemInfo}>
                        <Text
                          style={styles.itemName}
                          numberOfLines={2}
                        >
                          {getProductName(item)}
                        </Text>

                        <Text style={styles.itemQuantity}>
                          Quantity: {quantity}
                        </Text>

                        <Text style={styles.itemPrice}>
                          {formatMoney(price * quantity)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* ORDER SUMMARY */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                  Order summary
                </Text>

                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    Subtotal
                  </Text>

                  <Text style={styles.priceValue}>
                    {formatMoney(subtotal)}
                  </Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    Delivery fee
                  </Text>

                  <Text style={styles.priceValue}>
                    {formatMoney(deliveryFee)}
                  </Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.priceRow}>
                  <Text style={styles.totalLabel}>
                    Total
                  </Text>

                  <Text style={styles.totalValue}>
                    {formatMoney(total)}
                  </Text>
                </View>
              </View>

              {/* PAYMENT NOTICE */}
              <View style={styles.notice}>
                <Ionicons
                  name="information-circle-outline"
                  size={21}
                  color={PURPLE}
                />

                <Text style={styles.noticeText}>
                  Payment integration is not active yet.
                  Placing this order records your request
                  but does not charge you.
                </Text>
              </View>

              {/* PLACE ORDER */}
              <TouchableOpacity
                style={[
                  styles.placeOrderButton,
                  placingOrder && styles.disabledButton,
                ]}
                onPress={handlePlaceOrder}
                disabled={placingOrder}
                activeOpacity={0.85}
              >
                <Text style={styles.placeOrderText}>
                  {placingOrder
                    ? "Placing order..."
                    : "Confirm and Place Order"}
                </Text>

                {!placingOrder && (
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={WHITE}
                  />
                )}
              </TouchableOpacity>

              <Text style={styles.footerNote}>
                Please check your delivery information before
                confirming your order.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3FF",
  },

  keyboardContainer: {
    flex: 1,
  },

  header: {
    minHeight: 65,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: DARK,
  },

  headerPlaceholder: {
    width: 42,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: "center",
  },

  desktopScrollContent: {
    paddingTop: 25,
  },

  smallScrollContent: {
    paddingHorizontal: 13,
  },

  content: {
    width: "100%",
    maxWidth: 620,
  },

  desktopContent: {
    maxWidth: 680,
  },

  pageTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: DARK,
  },

  pageSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: MUTED,
    marginTop: 7,
    marginBottom: 20,
  },

  sectionCard: {
    backgroundColor: WHITE,
    borderRadius: 19,
    padding: 17,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EEE8F6",
    width: "100%",
  },

  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: DARK,
  },

  itemCountBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: "#EEE7FF",
    alignItems: "center",
    justifyContent: "center",
  },

  itemCountText: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: "800",
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#514967",
    marginBottom: 8,
    marginTop: 12,
  },

  input: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: "#E8E1F1",
    borderRadius: 12,
    paddingHorizontal: 13,
    fontSize: 13,
    color: DARK,
    backgroundColor: "#FCFAFF",
    width: "100%",
  },

  addressInput: {
    minHeight: 75,
    paddingTop: 13,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0ECF7",
  },

  itemImage: {
    width: 66,
    height: 66,
    borderRadius: 13,
    backgroundColor: "#EEE7FF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  smallItemImage: {
    width: 56,
    height: 56,
  },

  itemImageContent: {
    width: "100%",
    height: "100%",
  },

  itemInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 13,
  },

  itemName: {
    fontSize: 13,
    fontWeight: "800",
    color: DARK,
  },

  itemQuantity: {
    fontSize: 11,
    color: MUTED,
    marginTop: 5,
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: PURPLE,
    marginTop: 5,
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    gap: 10,
  },

  priceLabel: {
    fontSize: 13,
    color: MUTED,
  },

  priceValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#514967",
  },

  summaryDivider: {
    height: 1,
    backgroundColor: "#EEE8F6",
    marginTop: 18,
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: "900",
    color: DARK,
  },

  totalValue: {
    fontSize: 19,
    fontWeight: "900",
    color: PURPLE,
  },

  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    backgroundColor: "#EEE7FF",
    borderRadius: 13,
    marginBottom: 18,
  },

  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    color: "#514967",
  },

  placeOrderButton: {
    minHeight: 55,
    backgroundColor: PURPLE,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    width: "100%",
  },

  placeOrderText: {
    fontSize: 14,
    fontWeight: "900",
    color: WHITE,
    textAlign: "center",
    flexShrink: 1,
  },

  disabledButton: {
    opacity: 0.5,
  },

  footerNote: {
    fontSize: 11,
    lineHeight: 18,
    color: MUTED,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 10,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: "#EEE7FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: DARK,
    textAlign: "center",
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 21,
    color: MUTED,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 300,
  },

  primaryButton: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 25,
    marginTop: 22,
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: WHITE,
  },
});
