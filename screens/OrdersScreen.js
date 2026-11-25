
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { useUsers } from "../context/UsersContext";

const ORDERS_STORAGE_KEY = "campusmart_orders";
const NOTIFICATIONS_STORAGE_KEY = "campusmart_notifications";
const USERS_STORAGE_KEY = "campusmart_users";

const PURPLE = "#8B5CF6";
const DARK = "#1B153B";
const BACKGROUND = "#F7F3FF";
const WHITE = "#FFFFFF";
const GREY = "#77738A";
const BORDER = "#ECE8F5";
const GREEN = "#159B68";
const ORANGE = "#E69A27";

const FILTERS = ["All", "Processing", "On the way", "Delivered"];

const ORDER_STATUSES = [
  "Payment Pending",
  "Payment Confirmed",
  "Seller Notified",
  "Item Collected",
  "Out for Delivery",
  "Delivered",
];

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const parseStoredArray = (value) => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function OrdersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { currentUser } = useUsers();

  const [orders, setOrders] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);

  const isSmallPhone = width < 380;
  const isDesktop = width >= 768;

  const currentEmail = normalizeEmail(currentUser?.email);
  const currentAccountId = currentUser?.accountId || "";

  // Format Nigerian currency.
  const formatMoney = (amount) => {
    return (
      "\u20A6" +
      Number(amount || 0).toLocaleString("en-NG")
    );
  };

  // Format order date.
  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Get order ID.
  const getOrderId = (order) => {
    return order.orderId || order.id || "Order";
  };

  // Load orders from local storage.
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);

      const savedOrders = await AsyncStorage.getItem(
        ORDERS_STORAGE_KEY
      );

      setOrders(parseStoredArray(savedOrders));
    } catch (error) {
      console.log("Error loading orders:", error);

      Alert.alert(
        "Error",
        "Unable to load your orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload orders whenever this screen becomes active.
  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  // Check whether an order belongs to the logged-in student.
  // Account ID takes priority over email.
  const belongsToCurrentStudent = (order) => {
    if (!currentAccountId && !currentEmail) {
      return false;
    }

    // New orders must match the exact account ID.
    // Do not use email if an account ID exists but does not match.
    if (order.buyerAccountId) {
      return Boolean(
        currentAccountId &&
        order.buyerAccountId === currentAccountId
      );
    }

    // Older orders without account IDs use email.
    const orderEmail = normalizeEmail(order.buyerEmail);

    return Boolean(
      currentEmail && orderEmail === currentEmail
    );
  };

  // Only show orders belonging to the logged-in student.
  const myOrders = orders.filter(belongsToCurrentStudent);

  // Check whether an order is delivered.
  const isDelivered = (order) => {
    return String(order.status || "")
      .toLowerCase()
      .includes("delivered");
  };

  // Check whether an order is on the way.
  // Item Collected is included because the item has left the seller.
  const isOnTheWay = (order) => {
    const status = String(order.status || "").toLowerCase();

    return (
      status.includes("item collected") ||
      status.includes("out for delivery") ||
      status.includes("on the way")
    );
  };

  // Only allow confirmation at the delivery stage.
  const canConfirmReceived = (order) => {
    const status = String(order.status || "").toLowerCase();

    return (
      status === "out for delivery" ||
      status === "on the way"
    );
  };

  // Filter the student's orders.
  const filteredOrders = myOrders.filter((order) => {
    if (selectedFilter === "All") {
      return true;
    }

    if (selectedFilter === "Delivered") {
      return isDelivered(order);
    }

    if (selectedFilter === "On the way") {
      return isOnTheWay(order);
    }

    if (selectedFilter === "Processing") {
      return !isDelivered(order) && !isOnTheWay(order);
    }

    return true;
  });

  // Calculate order statistics.
  const totalOrders = myOrders.length;

  const processingCount = myOrders.filter(
    (order) =>
      !isDelivered(order) && !isOnTheWay(order)
  ).length;

  const onTheWayCount = myOrders.filter(
    (order) => isOnTheWay(order)
  ).length;

  const deliveredCount = myOrders.filter(
    (order) => isDelivered(order)
  ).length;

  // Get products from an order.
  const getOrderItems = (order) => {
    if (Array.isArray(order.items) && order.items.length > 0) {
      return order.items;
    }

    if (order.productName || order.name) {
      return [
        {
          id: order.id,
          name: order.productName || order.name,
          price: order.price,
          quantity: order.quantity || 1,
          image:
            order.image ||
            order.images?.[0] ||
            null,
          sellerName: order.sellerName || "",
          sellerEmail: order.sellerEmail || "",
          sellerAccountId: order.sellerAccountId || "",
        },
      ];
    }

    return [];
  };

  // Get product image.
  const getProductImage = (item) => {
    const image =
      item?.image ||
      item?.images?.[0] ||
      item?.photos?.[0];

    if (!image) return null;

    if (typeof image === "string") {
      return { uri: image };
    }

    if (image.uri) {
      return { uri: image.uri };
    }

    return null;
  };

  // Find the current position in the six delivery stages.
  const getStatusIndex = (status) => {
    return ORDER_STATUSES.indexOf(status);
  };

  // Find a seller's account ID using their email.
  const findAccountIdByEmail = (users, email) => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) return "";

    const matchingUser = users.find(
      (user) =>
        normalizeEmail(user.email) === normalizedEmail
    );

    return matchingUser?.accountId || "";
  };

  // Notify all sellers when the buyer confirms receipt.
  const notifySellersDeliveryConfirmed = async (order) => {
    try {
      const [savedNotifications, savedUsers] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY),
        AsyncStorage.getItem(USERS_STORAGE_KEY),
      ]);

      const existingNotifications = parseStoredArray(
        savedNotifications
      );

      const safeUsers = parseStoredArray(savedUsers);
      const items = getOrderItems(order);

      const sellers = new Map();

      // Collect sellers from every product in the order.
      items.forEach((item) => {
        const email = normalizeEmail(
          item.sellerEmail || order.sellerEmail
        );

        const accountId =
          item.sellerAccountId ||
          order.sellerAccountId ||
          findAccountIdByEmail(safeUsers, email);

        if (!email && !accountId) return;

        // Use account ID first to avoid duplicate notifications.
        const key = accountId
          ? `account:${accountId}`
          : `email:${email}`;

        if (!sellers.has(key)) {
          sellers.set(key, {
            userEmail: email,
            userAccountId: accountId,
            sellerName:
              item.sellerName || order.sellerName || "",
          });
        }
      });

      const orderId = getOrderId(order);
      const createdAt = new Date().toISOString();

      const newNotifications = Array.from(
        sellers.values()
      ).map((seller, index) => ({
        id: `delivery-confirmed-${orderId}-${Date.now()}-${index}`,
        userEmail: seller.userEmail || "",
        ...(seller.userAccountId
          ? { userAccountId: seller.userAccountId }
          : {}),
        title: "Buyer confirmed delivery",
        message:
          `The buyer has confirmed receiving the order ` +
          `${orderId}. The order is now marked as Delivered.`,
        type: "order",
        isRead: false,
        createdAt,
        orderId,
      }));

      if (newNotifications.length > 0) {
        await AsyncStorage.setItem(
          NOTIFICATIONS_STORAGE_KEY,
          JSON.stringify([
            ...newNotifications,
            ...existingNotifications,
          ])
        );
      }

      console.log(
        `Delivery confirmation notifications created: ${newNotifications.length}`
      );
    } catch (error) {
      // A notification problem must not undo a successful delivery update.
      console.log(
        "Could not notify sellers about delivery confirmation:",
        error
      );
    }
  };

  // Show order tracking information.
  const handleTrackOrder = (order) => {
    const currentIndex = getStatusIndex(order.status);

    const trackingDetails = ORDER_STATUSES.map(
      (status, index) => {
        const completed =
          currentIndex !== -1 && index <= currentIndex;

        const marker = completed ? "[Completed]" : "[Pending]";

        return `${marker} ${status}`;
      }
    ).join("\n");

    Alert.alert(
      "Track Your Order",
      `Order ID: ${getOrderId(order)}\n\n` +
        `Current status: ${order.status || "Processing"}\n\n` +
        `${trackingDetails}\n\n` +
        "Live location tracking will be available when the delivery system is connected.",
      [{ text: "Close" }]
    );
  };

  // Confirm that the student has received the order.
  const handleConfirmReceived = (order) => {
    if (!canConfirmReceived(order)) {
      Alert.alert(
        "Not ready for confirmation",
        "You can confirm receipt when your order is out for delivery."
      );
      return;
    }

    Alert.alert(
      "Confirm Delivery",
      "Have you received this order successfully?",
      [
        {
          text: "Not Yet",
          style: "cancel",
        },
        {
          text: "Yes, I Received It",
          onPress: async () => {
            try {
              setConfirmingId(getOrderId(order));

              const savedOrders =
                await AsyncStorage.getItem(
                  ORDERS_STORAGE_KEY
                );

              const allOrders = parseStoredArray(savedOrders);

              if (!allOrders.length) {
                throw new Error(
                  "No saved orders were found."
                );
              }

              const orderExists = allOrders.some(
                (item) =>
                  String(getOrderId(item)) ===
                    String(getOrderId(order)) &&
                  belongsToCurrentStudent(item)
              );

              if (!orderExists) {
                throw new Error(
                  "This order could not be found in your account."
                );
              }

              const deliveredAt = new Date().toISOString();

              const updatedOrders = allOrders.map((item) => {
                const sameOrder =
                  String(getOrderId(item)) ===
                  String(getOrderId(order));

                const sameBuyer =
                  belongsToCurrentStudent(item);

                if (sameOrder && sameBuyer) {
                  return {
                    ...item,
                    status: "Delivered",
                    deliveredAt,
                    updatedAt: deliveredAt,
                  };
                }

                return item;
              });

              // Save the updated order first.
              await AsyncStorage.setItem(
                ORDERS_STORAGE_KEY,
                JSON.stringify(updatedOrders)
              );

              setOrders(updatedOrders);

              // Notify the seller or sellers.
              await notifySellersDeliveryConfirmed(order);

              Alert.alert(
                "Delivery Confirmed",
                "Thank you for confirming that you received your order. The seller has been notified."
              );
            } catch (error) {
              console.log(
                "Error confirming delivery:",
                error
              );

              Alert.alert(
                "Error",
                "Unable to confirm delivery. Please try again."
              );
            } finally {
              setConfirmingId(null);
            }
          },
        },
      ]
    );
  };

  // Status colour.
  const getStatusColor = (status) => {
    const value = String(status || "").toLowerCase();

    if (value.includes("delivered")) {
      return GREEN;
    }

    if (
      value.includes("item collected") ||
      value.includes("out for delivery") ||
      value.includes("on the way")
    ) {
      return ORANGE;
    }

    return PURPLE;
  };

  // Status icon.
  const getStatusIcon = (status) => {
    const value = String(status || "").toLowerCase();

    if (value.includes("delivered")) {
      return "checkmark-circle";
    }

    if (
      value.includes("item collected") ||
      value.includes("out for delivery") ||
      value.includes("on the way")
    ) {
      return "bicycle";
    }

    return "time";
  };

  // Render the six-stage order progress tracker.
  const renderTrackingProgress = (order) => {
    const currentIndex = getStatusIndex(order.status);

    return (
      <View style={styles.trackingContainer}>
        <Text style={styles.trackingTitle}>
          DELIVERY PROGRESS
        </Text>

        {ORDER_STATUSES.map((status, index) => {
          const completed =
            currentIndex !== -1 && index <= currentIndex;

          const current = index === currentIndex;

          return (
            <View
              key={status}
              style={styles.trackingStep}
            >
              <View style={styles.trackingLineColumn}>
                <View
                  style={[
                    styles.trackingDot,
                    completed && styles.trackingDotCompleted,
                    current && styles.trackingDotCurrent,
                  ]}
                >
                  {completed && (
                    <Ionicons
                      name="checkmark"
                      size={11}
                      color={WHITE}
                    />
                  )}
                </View>

                {index !== ORDER_STATUSES.length - 1 && (
                  <View
                    style={[
                      styles.trackingLine,
                      completed && styles.trackingLineCompleted,
                    ]}
                  />
                )}
              </View>

              <View style={styles.trackingTextContainer}>
                <Text
                  style={[
                    styles.trackingStepText,
                    completed && styles.trackingStepCompleted,
                    current && styles.trackingStepCurrent,
                  ]}
                >
                  {status}
                </Text>

                {current && (
                  <Text style={styles.currentStageLabel}>
                    CURRENT STAGE
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // Render one product inside an order.
  const renderOrderItem = (item, index) => {
    const image = getProductImage(item);

    return (
      <View
        key={String(item.id || index)}
        style={styles.productRow}
      >
        {image ? (
          <Image
            source={image}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons
              name="image-outline"
              size={25}
              color={GREY}
            />
          </View>
        )}

        <View style={styles.productInfo}>
          <Text
            style={styles.productName}
            numberOfLines={2}
          >
            {item.name || item.productName || "Product"}
          </Text>

          <Text style={styles.productQuantity}>
            Quantity: {item.quantity || 1}
          </Text>
        </View>

        <Text style={styles.productPrice}>
          {formatMoney(
            Number(item.price || 0) *
              Number(item.quantity || 1)
          )}
        </Text>
      </View>
    );
  };

  // Render one complete order.
  const renderOrderCard = (order) => {
    const orderItems = getOrderItems(order);

    const status = order.status || "Payment Pending";
    const statusColor = getStatusColor(status);

    const delivered = isDelivered(order);
    const onTheWay = isOnTheWay(order);
    const canConfirm = canConfirmReceived(order);

    const isConfirming =
      confirmingId === getOrderId(order);

    return (
      <View
        key={String(getOrderId(order))}
        style={styles.orderCard}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderLabel}>
              ORDER ID
            </Text>

            <Text style={styles.orderId}>
              {getOrderId(order)}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "15" },
            ]}
          >
            <Ionicons
              name={getStatusIcon(status)}
              size={14}
              color={statusColor}
            />

            <Text
              style={[
                styles.statusText,
                { color: statusColor },
              ]}
            >
              {status}
            </Text>
          </View>
        </View>

        <View style={styles.orderDivider} />

        {orderItems.map((item, index) =>
          renderOrderItem(item, index)
        )}

        {orderItems.length === 0 && (
          <Text style={styles.missingProduct}>
            Product details unavailable.
          </Text>
        )}

        <View style={styles.orderDivider} />

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Ionicons
              name="calendar-outline"
              size={17}
              color={GREY}
            />

            <Text style={styles.detailLabel}>
              Order date
            </Text>
          </View>

          <Text style={styles.detailValue}>
            {formatDate(order.date || order.createdAt)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <Ionicons
              name="location-outline"
              size={17}
              color={GREY}
            />

            <Text style={styles.detailLabel}>
              Delivery address
            </Text>
          </View>
        </View>

        <Text style={styles.addressText}>
          {order.deliveryAddress || "Address not recorded"}
        </Text>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            Total amount
          </Text>

          <Text style={styles.totalAmount}>
            {formatMoney(
              order.total ??
                order.totalAmount ??
                order.subtotal ??
                0
            )}
          </Text>
        </View>

        {/* Six-stage delivery progress */}
        {renderTrackingProgress(order)}

        {delivered ? (
          <View style={styles.deliveredMessage}>
            <Ionicons
              name="checkmark-circle"
              size={19}
              color={GREEN}
            />

            <Text style={styles.deliveredMessageText}>
              Order successfully delivered
            </Text>
          </View>
        ) : (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.trackButton}
              onPress={() => handleTrackOrder(order)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="navigate-outline"
                size={17}
                color={PURPLE}
              />

              <Text style={styles.trackButtonText}>
                Track Order
              </Text>
            </TouchableOpacity>

            {canConfirm && (
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  isConfirming && styles.disabledButton,
                ]}
                disabled={isConfirming}
                onPress={() => handleConfirmReceived(order)}
                activeOpacity={0.8}
              >
                {isConfirming ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark"
                      size={17}
                      color={WHITE}
                    />

                    <Text style={styles.confirmButtonText}>
                      Confirm Received
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {onTheWay && !canConfirm && (
              <View style={styles.waitingMessage}>
                <Text style={styles.waitingMessageText}>
                  You can confirm receipt when the order is out for delivery.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color={DARK}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          My Orders
        </Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: 35,
            maxWidth: isDesktop ? 1000 : "100%",
            alignSelf: "center",
            width: "100%",
          },
        ]}
      >
        <View style={styles.intro}>
          <Text style={styles.pageTitle}>
            Your Orders
          </Text>

          <Text style={styles.pageSubtitle}>
            View and manage your purchases on CampusMart.
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {totalOrders}
            </Text>

            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statCard}>
            <Text
              style={[
                styles.statNumber,
                { color: PURPLE },
              ]}
            >
              {processingCount}
            </Text>

            <Text style={styles.statLabel}>Processing</Text>
          </View>

          <View style={styles.statCard}>
            <Text
              style={[
                styles.statNumber,
                { color: ORANGE },
              ]}
            >
              {onTheWayCount}
            </Text>

            <Text style={styles.statLabel}>On the way</Text>
          </View>

          <View style={styles.statCard}>
            <Text
              style={[
                styles.statNumber,
                { color: GREEN },
              ]}
            >
              {deliveredCount}
            </Text>

            <Text style={styles.statLabel}>Delivered</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTERS.map((filter) => {
            const active = selectedFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  active && styles.activeFilterButton,
                  isSmallPhone && styles.smallFilterButton,
                ]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.activeFilterText,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.ordersSection}>
          <Text style={styles.sectionTitle}>
            {selectedFilter === "All"
              ? "Recent Orders"
              : selectedFilter + " Orders"}
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={PURPLE}
              />

              <Text style={styles.loadingText}>
                Loading your orders...
              </Text>
            </View>
          ) : !currentEmail && !currentAccountId ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="person-outline"
                  size={36}
                  color={PURPLE}
                />
              </View>

              <Text style={styles.emptyTitle}>
                Login Required
              </Text>

              <Text style={styles.emptyText}>
                Please log in to view your orders.
              </Text>

              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.shopButtonText}>
                  Go to Login
                </Text>
              </TouchableOpacity>
            </View>
          ) : filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="receipt-outline"
                  size={36}
                  color={PURPLE}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No Orders Found
              </Text>

              <Text style={styles.emptyText}>
                {selectedFilter === "All"
                  ? "You have not placed any orders yet. Your purchases will appear here."
                  : "You do not have any orders in this category."}
              </Text>

              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => navigation.navigate("Home")}
              >
                <Text style={styles.shopButtonText}>
                  Start Shopping
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredOrders.map(renderOrderCard)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  header: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: DARK,
  },

  headerRight: {
    width: 40,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  intro: {
    marginBottom: 18,
  },

  pageTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: DARK,
  },

  pageSubtitle: {
    fontSize: 13,
    color: GREY,
    marginTop: 6,
    lineHeight: 20,
  },

  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 22,
  },

  statCard: {
    flex: 1,
    minWidth: 70,
    backgroundColor: WHITE,
    paddingVertical: 15,
    paddingHorizontal: 7,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: DARK,
  },

  statLabel: {
    fontSize: 10,
    color: GREY,
    marginTop: 5,
    fontWeight: "600",
    textAlign: "center",
  },

  filterContainer: {
    gap: 9,
    paddingBottom: 19,
  },

  filterButton: {
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderRadius: 25,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  smallFilterButton: {
    paddingHorizontal: 14,
  },

  activeFilterButton: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },

  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: GREY,
  },

  activeFilterText: {
    color: WHITE,
  },

  ordersSection: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: DARK,
    marginBottom: 14,
  },

  orderCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: BORDER,
  },

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },

  orderHeaderLeft: {
    flex: 1,
  },

  orderLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: GREY,
    letterSpacing: 1,
  },

  orderId: {
    fontSize: 13,
    fontWeight: "800",
    color: DARK,
    marginTop: 4,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 20,
    maxWidth: "55%",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
    flexShrink: 1,
  },

  orderDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 14,
  },

  productRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 11,
  },

  productImage: {
    width: 65,
    height: 65,
    borderRadius: 11,
    backgroundColor: BACKGROUND,
  },

  productImagePlaceholder: {
    width: 65,
    height: 65,
    borderRadius: 11,
    backgroundColor: BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    fontSize: 13,
    fontWeight: "800",
    color: DARK,
    lineHeight: 19,
  },

  productQuantity: {
    fontSize: 11,
    color: GREY,
    marginTop: 5,
  },

  productPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: DARK,
  },

  missingProduct: {
    fontSize: 12,
    color: GREY,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
  },

  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  detailLabel: {
    fontSize: 11,
    color: GREY,
    fontWeight: "600",
  },

  detailValue: {
    fontSize: 11,
    color: DARK,
    fontWeight: "700",
  },

  addressText: {
    fontSize: 12,
    color: DARK,
    lineHeight: 19,
    marginTop: -4,
    marginBottom: 13,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },

  totalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: DARK,
  },

  totalAmount: {
    fontSize: 17,
    fontWeight: "900",
    color: PURPLE,
  },

  trackingContainer: {
    backgroundColor: "#FAF8FF",
    borderRadius: 13,
    padding: 13,
    marginTop: 17,
    borderWidth: 1,
    borderColor: BORDER,
  },

  trackingTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: GREY,
    letterSpacing: 0.8,
    marginBottom: 13,
  },

  trackingStep: {
    flexDirection: "row",
    minHeight: 34,
  },

  trackingLineColumn: {
    width: 20,
    alignItems: "center",
  },

  trackingDot: {
    width: 17,
    height: 17,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D8D2E5",
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },

  trackingDotCompleted: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },

  trackingDotCurrent: {
    borderColor: PURPLE,
    backgroundColor: PURPLE,
  },

  trackingLine: {
    width: 2,
    flex: 1,
    minHeight: 15,
    backgroundColor: "#DDD7E9",
  },

  trackingLineCompleted: {
    backgroundColor: GREEN,
  },

  trackingTextContainer: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 12,
  },

  trackingStepText: {
    fontSize: 11,
    color: GREY,
    fontWeight: "600",
  },

  trackingStepCompleted: {
    color: GREEN,
  },

  trackingStepCurrent: {
    color: PURPLE,
    fontWeight: "900",
  },

  currentStageLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: PURPLE,
    marginTop: 3,
    letterSpacing: 0.5,
  },

  actionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 16,
  },

  trackButton: {
    flex: 1,
    minWidth: 110,
    minHeight: 44,
    borderWidth: 1,
    borderColor: PURPLE,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 8,
  },

  trackButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: PURPLE,
  },

  confirmButton: {
    flex: 1,
    minWidth: 130,
    minHeight: 44,
    backgroundColor: GREEN,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },

  confirmButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: WHITE,
  },

  disabledButton: {
    opacity: 0.6,
  },

  waitingMessage: {
    flex: 1,
    minWidth: 130,
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  waitingMessageText: {
    fontSize: 10,
    color: GREY,
    lineHeight: 15,
    textAlign: "center",
  },

  deliveredMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "#EAF8F1",
    borderRadius: 11,
  },

  deliveredMessageText: {
    color: GREEN,
    fontSize: 12,
    fontWeight: "800",
  },

  loadingContainer: {
    paddingVertical: 55,
    alignItems: "center",
  },

  loadingText: {
    fontSize: 13,
    color: GREY,
    marginTop: 12,
  },

  emptyContainer: {
    backgroundColor: WHITE,
    paddingHorizontal: 22,
    paddingVertical: 35,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },

  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: "#F0E9FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: DARK,
  },

  emptyText: {
    fontSize: 12,
    color: GREY,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 18,
  },

  shopButton: {
    backgroundColor: PURPLE,
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 11,
  },

  shopButtonText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "800",
  },
});
