
import React, { useCallback, useState } from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { useUsers } from "../context/UsersContext";

const ORDERS_STORAGE_KEY = "campusmart_orders";

const COLORS = {
  purple: "#8B5CF6",
  dark: "#1B153B",
  background: "#F7F3FF",
  white: "#FFFFFF",
  text: "#514968",
  muted: "#9189A3",
  border: "#EEE9F7",
  green: "#168653",
  orange: "#C77B16",
  red: "#D94A4A",
};

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

const formatMoney = (amount) =>
  `₦${Number(amount || 0).toLocaleString("en-NG")}`;

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

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
  if (Array.isArray(order?.items)) {
    return order.items;
  }

  // Support older orders that stored one product directly.
  if (order?.productName || order?.productTitle) {
    return [
      {
        productName: order.productName || order.productTitle,
        quantity: order.quantity || 1,
        price: order.price || order.total || 0,
        sellerAccountId: order.sellerAccountId || "",
        sellerEmail: order.sellerEmail || "",
      },
    ];
  }

  return [];
};

const belongsToSeller = (item, order, currentUser) => {
  const sellerAccountId = String(
    item?.sellerAccountId || ""
  ).trim();

  const currentAccountId = String(
    currentUser?.accountId || ""
  ).trim();

  // Account ID is the preferred and stricter ownership check.
  if (sellerAccountId) {
    return (
      currentAccountId &&
      sellerAccountId === currentAccountId
    );
  }

  // Email fallback is only for older records without an account ID.
  const sellerEmail = normalizeEmail(
    item?.sellerEmail || order?.sellerEmail
  );

  return (
    sellerEmail &&
    sellerEmail === normalizeEmail(currentUser?.email)
  );
};

export default function SellerOrdersScreen({ navigation }) {
  const { currentUser } = useUsers();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");

  const loadSellerOrders = useCallback(async () => {
    try {
      const storedOrders = await AsyncStorage.getItem(
        ORDERS_STORAGE_KEY
      );

      const parsedOrders = storedOrders
        ? JSON.parse(storedOrders)
        : [];

      const safeOrders = Array.isArray(parsedOrders)
        ? parsedOrders
        : [];

      const sellerOrders = safeOrders
        .map((order) => {
          const allItems = getOrderItems(order);

          const myItems = allItems.filter((item) =>
            belongsToSeller(item, order, currentUser)
          );

          if (myItems.length === 0) {
            return null;
          }

          return {
            ...order,
            sellerItems: myItems,
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          const dateA = new Date(
            a.createdAt || a.date || 0
          ).getTime();

          const dateB = new Date(
            b.createdAt || b.date || 0
          ).getTime();

          return dateB - dateA;
        });

      setOrders(sellerOrders);
    } catch (error) {
      console.log("Could not load seller orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadSellerOrders();
    }, [loadSellerOrders])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadSellerOrders();
  };

  const filteredOrders = orders.filter((order) => {
    if (selectedFilter === "All") return true;

    return String(order.status || "")
      .toLowerCase()
      .includes(selectedFilter.toLowerCase());
  });

  const getSellerSubtotal = (order) => {
    return order.sellerItems.reduce((total, item) => {
      const price = Number(item.price || item.unitPrice || 0);
      const quantity = Number(item.quantity || 1);

      return total + price * quantity;
    }, 0);
  };

  const getStatusColor = (status) => {
    const value = String(status || "").toLowerCase();

    if (value === "delivered") return COLORS.green;
    if (value.includes("delivery")) return COLORS.orange;
    if (value.includes("collected")) return COLORS.orange;
    if (value.includes("confirmed")) return COLORS.green;
    if (value.includes("pending")) return COLORS.red;

    return COLORS.purple;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.purple}
        />

        <Text style={styles.loadingText}>
          Loading your orders...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={COLORS.dark}
          />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Seller Orders
          </Text>

          <Text style={styles.headerSubtitle}>
            Orders containing your products
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={COLORS.purple}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons
            name="receipt-outline"
            size={23}
            color={COLORS.purple}
          />
        </View>

        <View>
          <Text style={styles.summaryLabel}>
            Your orders
          </Text>

          <Text style={styles.summaryNumber}>
            {orders.length}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {["All", "Payment Pending", "Payment Confirmed", "Item Collected", "Out for Delivery", "Delivered"].map(
          (filter) => {
            const active = selectedFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  active && styles.activeFilterButton,
                ]}
                onPress={() => setSelectedFilter(filter)}
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
          }
        )}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ordersContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.purple}
          />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="receipt-outline"
                size={34}
                color={COLORS.purple}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No orders found
            </Text>

            <Text style={styles.emptyText}>
              Orders containing your products will appear here.
            </Text>
          </View>
        ) : (
          filteredOrders.map((order, index) => (
            <View
              key={String(order.id || order.orderId || index)}
              style={styles.orderCard}
            >
              <View style={styles.orderTop}>
                <View style={styles.orderIdContainer}>
                  <Text style={styles.orderLabel}>
                    ORDER ID
                  </Text>

                  <Text style={styles.orderId}>
                    {order.orderId || order.id || "Unavailable"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: `${getStatusColor(
                        order.status
                      )}15`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: getStatusColor(order.status),
                      },
                    ]}
                  >
                    {order.status || "Pending"}
                  </Text>
                </View>
              </View>

              <View style={styles.dateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color={COLORS.muted}
                />

                <Text style={styles.dateText}>
                  {formatDate(order.createdAt || order.date)}
                </Text>
              </View>

              <View style={styles.sectionDivider} />

              <Text style={styles.sectionTitle}>
                Your products in this order
              </Text>

              {order.sellerItems.map((item, itemIndex) => {
                const productName =
                  item.productName ||
                  item.title ||
                  item.name ||
                  "Product";

                const quantity = Number(item.quantity || 1);
                const price = Number(
                  item.price || item.unitPrice || 0
                );

                return (
                  <View
                    key={`${productName}-${itemIndex}`}
                    style={styles.productRow}
                  >
                    <View style={styles.productIcon}>
                      <Ionicons
                        name="cube-outline"
                        size={20}
                        color={COLORS.purple}
                      />
                    </View>

                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>
                        {productName}
                      </Text>

                      <Text style={styles.productQuantity}>
                        Quantity: {quantity}
                      </Text>
                    </View>

                    <Text style={styles.productPrice}>
                      {formatMoney(price * quantity)}
                    </Text>
                  </View>
                );
              })}

              <View style={styles.sectionDivider} />

              <Text style={styles.sectionTitle}>
                Buyer information
              </Text>

              <View style={styles.infoRow}>
                <Ionicons
                  name="person-outline"
                  size={17}
                  color={COLORS.muted}
                />

                <Text style={styles.infoText}>
                  {order.buyerName ||
                    order.customerName ||
                    "Name unavailable"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons
                  name="call-outline"
                  size={17}
                  color={COLORS.muted}
                />

                <Text style={styles.infoText}>
                  {order.buyerPhone ||
                    order.phone ||
                    "Phone unavailable"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons
                  name="location-outline"
                  size={17}
                  color={COLORS.muted}
                />

                <Text style={styles.infoText}>
                  {order.deliveryAddress ||
                    order.address ||
                    "Delivery address unavailable"}
                </Text>
              </View>

              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>
                  Your product subtotal
                </Text>

                <Text style={styles.totalAmount}>
                  {formatMoney(getSellerSubtotal(order))}
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 55,
    paddingBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.dark,
  },

  headerSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 3,
  },

  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryCard: {
    marginHorizontal: 18,
    padding: 17,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#F0EAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },

  summaryNumber: {
    color: COLORS.dark,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },

  filterScroll: {
    maxHeight: 55,
    marginTop: 17,
  },

  filterContainer: {
    paddingHorizontal: 18,
    gap: 8,
    alignItems: "center",
  },

  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  activeFilterButton: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },

  filterText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
  },

  activeFilterText: {
    color: COLORS.white,
  },

  ordersContainer: {
    paddingHorizontal: 18,
    paddingTop: 15,
  },

  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 19,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  orderLabel: {
    fontSize: 9,
    color: COLORS.muted,
    fontWeight: "800",
    letterSpacing: 1,
  },

  orderId: {
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: "900",
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    maxWidth: "48%",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },

  dateText: {
    fontSize: 11,
    color: COLORS.muted,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 12,
  },

  productRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  productIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#F0EAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.dark,
  },

  productQuantity: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 4,
  },

  productPrice: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.dark,
    marginLeft: 8,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginBottom: 11,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 18,
  },

  totalContainer: {
    backgroundColor: "#F7F3FF",
    borderRadius: 12,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },

  totalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
  },

  totalAmount: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.purple,
  },

  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 65,
  },

  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 24,
    backgroundColor: "#EEE7FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.dark,
  },

  emptyText: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 7,
  },
});
