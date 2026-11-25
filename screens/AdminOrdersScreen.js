
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const ORDERS_STORAGE_KEY = "campusmart_orders";
const NOTIFICATIONS_STORAGE_KEY = "campusmart_notifications";
const USERS_STORAGE_KEY = "campusmart_users";

const filters = ["All", "Processing", "On the way", "Delivered"];

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

const safeArray = (value) => (Array.isArray(value) ? value : []);

export default function AdminOrdersScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = async () => {
    try {
      const savedOrders = await AsyncStorage.getItem(
        ORDERS_STORAGE_KEY
      );

      const parsedOrders = savedOrders
        ? JSON.parse(savedOrders)
        : [];

      setOrders(Array.isArray(parsedOrders) ? parsedOrders : []);
    } catch (error) {
      console.log("Could not load admin orders:", error);
      setOrders([]);

      Alert.alert(
        "Unable to load orders",
        "Please try opening the order management screen again."
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  const formatMoney = (amount) =>
    `₦${Number(amount || 0).toLocaleString("en-NG")}`;

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

  const getOrderItems = (order) => {
    if (Array.isArray(order.items) && order.items.length > 0) {
      return order.items;
    }

    return [
      {
        name: order.name || "CampusMart item",
        price: order.price || 0,
        quantity: 1,
        image: order.image || null,
        sellerName: order.sellerName || "",
        sellerEmail: order.sellerEmail || "",
        sellerAccountId: order.sellerAccountId || "",
      },
    ];
  };

  const getFilterStatus = (status) => {
    if (
      [
        "Payment Pending",
        "Payment Confirmed",
        "Seller Notified",
      ].includes(status)
    ) {
      return "Processing";
    }

    if (
      ["Item Collected", "Out for Delivery"].includes(status)
    ) {
      return "On the way";
    }

    if (status === "Delivered") {
      return "Delivered";
    }

    return "Processing";
  };

  const filteredOrders = orders.filter((order) => {
    const matchesFilter =
      selectedFilter === "All" ||
      getFilterStatus(order.status) === selectedFilter;

    const search = searchText.trim().toLowerCase();

    const matchesSearch =
      !search ||
      String(order.id || "").toLowerCase().includes(search) ||
      String(order.name || "").toLowerCase().includes(search) ||
      String(order.buyerName || "").toLowerCase().includes(search) ||
      String(order.buyerEmail || "").toLowerCase().includes(search) ||
      getOrderItems(order).some((item) =>
        String(item.name || "").toLowerCase().includes(search)
      );

    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "#16803D";
      case "Out for Delivery":
      case "Item Collected":
        return "#8B5CF6";
      case "Payment Confirmed":
      case "Seller Notified":
        return "#B86B00";
      case "Payment Pending":
      default:
        return "#B86B00";
    }
  };

  const getNextStatus = (currentStatus) => {
    const currentIndex = ORDER_STATUSES.indexOf(currentStatus);

    if (
      currentIndex === -1 ||
      currentIndex === ORDER_STATUSES.length - 1
    ) {
      return null;
    }

    return ORDER_STATUSES[currentIndex + 1];
  };

  // Find an account ID using an email address.
  // This supports older orders that do not contain account IDs.
  const findAccountIdByEmail = (users, email) => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) return "";

    const matchingUser = users.find(
      (user) =>
        normalizeEmail(user.email) === normalizedEmail
    );

    return matchingUser?.accountId || "";
  };

  // Prepare the buyer and seller notification recipients.
  const getNotificationRecipients = (order, users) => {
    const recipients = new Map();

    const addRecipient = (email, accountId, name, role) => {
      const normalizedEmail = normalizeEmail(email);
      const resolvedAccountId =
        accountId ||
        findAccountIdByEmail(users, normalizedEmail);

      if (!normalizedEmail && !resolvedAccountId) {
        return;
      }

      const key = resolvedAccountId
        ? `account:${resolvedAccountId}`
        : `email:${normalizedEmail}`;

      const existing = recipients.get(key);

      if (existing) {
        if (!existing.name && name) {
          existing.name = name;
        }
        return;
      }

      recipients.set(key, {
        userEmail: normalizedEmail,
        userAccountId: resolvedAccountId,
        name: name || "",
        role,
      });
    };

    // Buyer
    addRecipient(
      order.buyerEmail,
      order.buyerAccountId,
      order.buyerName,
      "buyer"
    );

    // Sellers: support orders containing multiple sellers.
    const items = getOrderItems(order);

    items.forEach((item) => {
      addRecipient(
        item.sellerEmail || order.sellerEmail,
        item.sellerAccountId || order.sellerAccountId,
        item.sellerName || order.sellerName,
        "seller"
      );
    });

    return Array.from(recipients.values());
  };

  // Send a notification to the buyer and every seller.
  const sendOrderStatusNotifications = async (order, nextStatus) => {
    try {
      const [savedNotifications, savedUsers] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY),
        AsyncStorage.getItem(USERS_STORAGE_KEY),
      ]);

      const existingNotifications = savedNotifications
        ? JSON.parse(savedNotifications)
        : [];

      const users = savedUsers ? JSON.parse(savedUsers) : [];

      if (!Array.isArray(existingNotifications)) {
        throw new Error("Notifications data is not valid.");
      }

      const safeUsers = safeArray(users);

      const recipients = getNotificationRecipients(
        order,
        safeUsers
      );

      if (recipients.length === 0) {
        console.log(
          "No buyer or seller email/account ID was available for this order."
        );
        return;
      }

      const createdAt = new Date().toISOString();

      const newNotifications = recipients.map((recipient) => {
        const recipientName = recipient.name
          ? `Hello ${recipient.name},`
          : "Hello,";

        let title = "Order status updated";

        if (recipient.role === "buyer") {
          title = "Your order has been updated";
        } else {
          title = "A product order has been updated";
        }

        const message =
          `${recipientName} the status of order ${order.id || ""} ` +
          `has changed to "${nextStatus}".`;

        return {
          id:
            `${order.id || "order"}-${nextStatus}-` +
            `${recipient.userAccountId || recipient.userEmail}-${Date.now()}`,
          userEmail: recipient.userEmail || "",
          ...(recipient.userAccountId
            ? { userAccountId: recipient.userAccountId }
            : {}),
          title,
          message,
          type: "order",
          isRead: false,
          createdAt,
          orderId: order.id || "",
        };
      });

      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify([
          ...newNotifications,
          ...existingNotifications,
        ])
      );
    } catch (error) {
      // A notification problem should not undo a successfully
      // saved order-status update.
      console.log(
        "Order was updated, but notifications could not be saved:",
        error
      );
    }
  };

  const updateOrderStatus = async (order) => {
    const nextStatus = getNextStatus(order.status);

    if (!nextStatus) {
      Alert.alert(
        "No further update",
        "This order has already reached its final status."
      );
      return;
    }

    Alert.alert(
      "Update order status",
      `Change order ${order.id} from "${order.status}" to "${nextStatus}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Update",
          onPress: async () => {
            try {
              setUpdatingId(order.id);

              const savedOrders = await AsyncStorage.getItem(
                ORDERS_STORAGE_KEY
              );

              const currentOrders = savedOrders
                ? JSON.parse(savedOrders)
                : [];

              if (!Array.isArray(currentOrders)) {
                throw new Error(
                  "Saved orders are not in the expected format."
                );
              }

              const orderExists = currentOrders.some(
                (item) => item.id === order.id
              );

              if (!orderExists) {
                throw new Error(
                  "This order could not be found in storage."
                );
              }

              const updatedOrders = currentOrders.map((item) =>
                item.id === order.id
                  ? {
                      ...item,
                      status: nextStatus,
                      updatedAt: new Date().toISOString(),
                    }
                  : item
              );

              // Save the order first.
              await AsyncStorage.setItem(
                ORDERS_STORAGE_KEY,
                JSON.stringify(updatedOrders)
              );

              setOrders(updatedOrders);

              // Then notify the buyer and sellers.
              await sendOrderStatusNotifications(
                order,
                nextStatus
              );

              Alert.alert(
                "Order updated",
                `Order ${order.id} is now "${nextStatus}". The buyer and available seller accounts have been notified.`
              );
            } catch (error) {
              console.log("Could not update order:", error);

              Alert.alert(
                "Update failed",
                "The order status could not be saved. Please try again."
              );
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const showOrderDetails = (order) => {
    const items = getOrderItems(order);

    const itemSummary = items
      .map(
        (item) =>
          `${item.name || "CampusMart item"} x${item.quantity || 1}`
      )
      .join("\n");

    Alert.alert(
      "Order details",
      `Order number: ${order.id || "Unavailable"}\n\n` +
        `Items:\n${itemSummary}\n\n` +
        `Buyer: ${order.buyerName || "Not recorded"}\n` +
        `Buyer email: ${order.buyerEmail || "Not recorded"}\n` +
        `Seller: ${order.sellerName || "Not recorded"}\n` +
        `Order date: ${formatDate(order.date)}\n` +
        `Delivery address: ${order.deliveryAddress || "Not provided"}\n` +
        `Total: ${formatMoney(order.total)}\n` +
        `Status: ${order.status || "Unknown"}`
    );
  };

  const totalOrders = orders.length;

  const processingCount = orders.filter(
    (order) => getFilterStatus(order.status) === "Processing"
  ).length;

  const deliveryCount = orders.filter(
    (order) => getFilterStatus(order.status) === "On the way"
  ).length;

  const deliveredCount = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10 },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#24194A" />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Order Management</Text>
          <Text style={styles.headerSubtitle}>CampusMart Admin</Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadOrders}
        >
          <Ionicons name="refresh-outline" size={22} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 35 + insets.bottom },
        ]}
      >
        <Text style={styles.pageTitle}>Manage orders</Text>

        <Text style={styles.pageSubtitle}>
          Review student orders and update their delivery progress.
        </Text>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Ionicons name="receipt-outline" size={22} color="#8B5CF6" />
            <Text style={styles.summaryNumber}>{totalOrders}</Text>
            <Text style={styles.summaryLabel}>Total orders</Text>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons name="time-outline" size={22} color="#B86B00" />
            <Text style={styles.summaryNumber}>{processingCount}</Text>
            <Text style={styles.summaryLabel}>Processing</Text>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons name="bicycle-outline" size={22} color="#8B5CF6" />
            <Text style={styles.summaryNumber}>{deliveryCount}</Text>
            <Text style={styles.summaryLabel}>On the way</Text>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color="#16803D"
            />
            <Text style={styles.summaryNumber}>{deliveredCount}</Text>
            <Text style={styles.summaryLabel}>Delivered</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#948BA6" />

          <TextInput
            style={styles.searchInput}
            placeholder="Search order, product or buyer..."
            placeholderTextColor="#A69EB4"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
          />

          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={19} color="#948BA6" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((filter) => {
            const active = selectedFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  active && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>All student orders</Text>
          <Text style={styles.orderCount}>
            {filteredOrders.length} found
          </Text>
        </View>

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.emptyText}>Loading orders...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="file-tray-outline"
              size={45}
              color="#8B5CF6"
            />

            <Text style={styles.emptyTitle}>
              {orders.length === 0
                ? "No orders available"
                : "No matching orders"}
            </Text>

            <Text style={styles.emptyText}>
              {orders.length === 0
                ? "Orders saved on this device will appear here."
                : "Try another filter or search term."}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const items = getOrderItems(order);
            const statusColor = getStatusColor(order.status);
            const nextStatus = getNextStatus(order.status);
            const isUpdating = updatingId === order.id;

            return (
              <View key={String(order.id)} style={styles.orderCard}>
                <View style={styles.orderTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderLabel}>ORDER NUMBER</Text>
                    <Text style={styles.orderId}>
                      {order.id || "No order ID"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${statusColor}18` },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: statusColor },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: statusColor },
                      ]}
                    >
                      {order.status || "Unknown"}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {items.map((item, index) => (
                  <View
                    key={`${order.id}-${index}`}
                    style={styles.productRow}
                  >
                    <View style={styles.productImage}>
                      {item.image ? (
                        <Image
                          source={{ uri: item.image }}
                          style={styles.productImageContent}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons
                          name="image-outline"
                          size={25}
                          color="#8B5CF6"
                        />
                      )}
                    </View>

                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>
                        {item.name || "CampusMart item"}
                      </Text>

                      <Text style={styles.productQuantity}>
                        Quantity: {item.quantity || 1}
                      </Text>

                      <Text style={styles.productPrice}>
                        {formatMoney(
                          (Number(item.price) || 0) *
                            (Number(item.quantity) || 1)
                        )}
                      </Text>
                    </View>
                  </View>
                ))}

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Buyer</Text>
                  <Text style={styles.infoValue}>
                    {order.buyerName || "Not recorded"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Order date</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(order.date)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Delivery address</Text>
                  <Text style={styles.infoValue}>
                    {order.deliveryAddress || "Not provided"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Order total</Text>
                  <Text style={styles.orderTotal}>
                    {formatMoney(order.total)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => showOrderDetails(order)}
                >
                  <Ionicons
                    name="eye-outline"
                    size={18}
                    color="#6D28D9"
                  />
                  <Text style={styles.detailsButtonText}>
                    View full order details
                  </Text>
                </TouchableOpacity>

                {nextStatus ? (
                  <TouchableOpacity
                    style={[
                      styles.updateButton,
                      isUpdating && styles.disabledButton,
                    ]}
                    disabled={isUpdating}
                    onPress={() => updateOrderStatus(order)}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons
                          name="arrow-forward-circle-outline"
                          size={19}
                          color="#FFFFFF"
                        />
                        <Text style={styles.updateButtonText}>
                          Move to: {nextStatus}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.completedBox}>
                    <Ionicons
                      name="checkmark-circle"
                      size={19}
                      color="#16803D"
                    />
                    <Text style={styles.completedText}>
                      Order completed
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3FF",
  },
  header: {
    minHeight: 82,
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE8F6",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F1EBFF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 13,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#24194A",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#817991",
    marginTop: 3,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F1EBFF",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 18,
  },
  pageTitle: {
    fontSize: 27,
    fontWeight: "900",
    color: "#24194A",
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#817991",
    lineHeight: 20,
    marginTop: 7,
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    width: "48%",
    flexGrow: 1,
    minHeight: 105,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#EEE8F6",
  },
  summaryNumber: {
    fontSize: 23,
    fontWeight: "900",
    color: "#24194A",
    marginTop: 7,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#817991",
    marginTop: 3,
  },
  searchBox: {
    minHeight: 51,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E9E1F5",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 17,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#24194A",
    paddingVertical: 12,
  },
  filterRow: {
    gap: 9,
    paddingBottom: 22,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7DFF4",
  },
  filterButtonActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5E576F",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#24194A",
  },
  orderCount: {
    fontSize: 11,
    color: "#817991",
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#EEE8F6",
  },
  orderTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  orderLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: "#948BA6",
  },
  orderId: {
    fontSize: 13,
    fontWeight: "900",
    color: "#24194A",
    marginTop: 5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 20,
    maxWidth: "52%",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0ECF7",
    marginVertical: 13,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  productImage: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: "#EEE7FF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  productImageContent: {
    width: "100%",
    height: "100%",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#24194A",
  },
  productQuantity: {
    fontSize: 11,
    color: "#817991",
    marginTop: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#8B5CF6",
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 11,
  },
  infoLabel: {
    flex: 1,
    fontSize: 11,
    color: "#948BA6",
  },
  infoValue: {
    flex: 1.5,
    fontSize: 11,
    fontWeight: "700",
    color: "#5E576F",
    textAlign: "right",
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: "900",
    color: "#24194A",
  },
  detailsButton: {
    minHeight: 43,
    borderRadius: 12,
    backgroundColor: "#F1EBFF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 5,
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6D28D9",
  },
  updateButton: {
    minHeight: 47,
    borderRadius: 12,
    backgroundColor: "#8B5CF6",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 8,
  },
  updateButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.6,
  },
  completedBox: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#E2F7EA",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  completedText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#16803D",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#24194A",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 12,
    color: "#817991",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
  },
});
