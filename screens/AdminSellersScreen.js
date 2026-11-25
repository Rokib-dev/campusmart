
import React, { useMemo, useState } from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useUsers } from "../context/UsersContext";
import { useListings } from "../context/ListingsContext";

const PURPLE = "#8B5CF6";
const DARK = "#1B153B";
const BACKGROUND = "#F5F0FF";

// Safely display text values.
const safeText = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (typeof value === "object") {
    return value.uri || value.name || "Not provided";
  }

  return String(value);
};

// Supports image URLs stored as strings or { uri } objects.
const getImageUri = (image) => {
  if (!image) return null;

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object" && typeof image.uri === "string") {
    return image.uri;
  }

  return null;
};

// Safely format dates.
const formatDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString();
};

export default function AdminSellersScreen({ navigation, route }) {
  const {
    users = [],
    usersLoading,
    setUserStatus,
  } = useUsers();

  const { listings = [] } = useListings();

  const adminEmail = route?.params?.adminEmail || "Administrator";

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  // Prepare seller information and match their products.
  const sellers = useMemo(() => {
    return users.map((user) => {
      const sellerProducts = listings.filter(
        (item) =>
          item.sellerAccountId &&
          user.accountId &&
          String(item.sellerAccountId) === String(user.accountId)
      );

      return {
        ...user,
        productCount: sellerProducts.length,
        products: sellerProducts,
      };
    });
  }, [users, listings]);

  // Search and filter sellers.
  const filteredSellers = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return sellers.filter((seller) => {
      const fullName = String(seller.fullName || "").toLowerCase();
      const email = String(seller.email || "").toLowerCase();
      const phone = String(seller.phone || "").toLowerCase();
      const accountId = String(seller.accountId || "").toLowerCase();
      const department = String(seller.department || "").toLowerCase();

      const matchesSearch =
        !searchText ||
        fullName.includes(searchText) ||
        email.includes(searchText) ||
        phone.includes(searchText) ||
        accountId.includes(searchText) ||
        department.includes(searchText);

      const status = String(seller.status || "Unknown");

      const matchesFilter =
        filter === "All" ||
        (filter === "Active" && status === "Active") ||
        (filter === "Suspended" && status === "Suspended");

      return matchesSearch && matchesFilter;
    });
  }, [sellers, search, filter]);

  const totalSellers = sellers.length;

  const activeSellers = sellers.filter(
    (seller) => seller.status === "Active"
  ).length;

  const suspendedSellers = sellers.filter(
    (seller) => seller.status === "Suspended"
  ).length;

  const sellersWithProducts = sellers.filter(
    (seller) => seller.productCount > 0
  ).length;

  // Open seller details.
  const openSellerDetails = (seller) => {
    if (!seller) {
      Alert.alert("Error", "Seller information could not be loaded.");
      return;
    }

    setSelectedSeller(seller);
    setDetailsVisible(true);
  };

  // Close seller details.
  const closeSellerDetails = () => {
    setDetailsVisible(false);
    setSelectedSeller(null);
  };

  // Suspend or activate a seller.
  const handleStatusChange = (seller) => {
    if (!seller?.accountId) {
      Alert.alert("Error", "This seller has no valid account ID.");
      return;
    }

    const isSuspended = seller.status === "Suspended";

    const newStatus = isSuspended ? "Active" : "Suspended";

    Alert.alert(
      isSuspended ? "Activate Seller" : "Suspend Seller",
      isSuspended
        ? `Are you sure you want to activate ${seller.fullName}'s account?`
        : `Are you sure you want to suspend ${seller.fullName}'s account?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: isSuspended ? "Activate" : "Suspend",
          style: isSuspended ? "default" : "destructive",

          onPress: async () => {
            try {
              await setUserStatus(seller.accountId, newStatus);

              setSelectedSeller((previous) => {
                if (
                  !previous ||
                  previous.accountId !== seller.accountId
                ) {
                  return previous;
                }

                return {
                  ...previous,
                  status: newStatus,
                };
              });

              Alert.alert(
                "Successful",
                `${seller.fullName}'s account is now ${newStatus.toLowerCase()}.`
              );
            } catch (error) {
              Alert.alert(
                "Update Failed",
                error?.message || "Could not update this seller."
              );
            }
          },
        },
      ]
    );
  };

  // Seller card.
  const renderSellerCard = (seller) => {
    const isActive = seller.status === "Active";
    const profileImage = getImageUri(seller.profilePhoto);

    return (
      <TouchableOpacity
        key={seller.accountId || seller.email}
        style={styles.sellerCard}
        activeOpacity={0.85}
        onPress={() => openSellerDetails(seller)}
      >
        <View style={styles.sellerTop}>
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={25} color={PURPLE} />
            </View>
          )}

          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>
              {seller.fullName || "Unnamed Student"}
            </Text>

            <Text style={styles.sellerEmail}>
              {seller.email || "No email"}
            </Text>

            <Text style={styles.accountId}>
              {seller.accountId || "No Account ID"}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isActive ? "#E5F8ED" : "#FDE8E8",
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: isActive ? "#16834A" : "#C0392B",
                },
              ]}
            >
              {seller.status || "Unknown"}
            </Text>
          </View>
        </View>

        <View style={styles.sellerDivider} />

        <View style={styles.sellerBottom}>
          <View style={styles.productCount}>
            <Ionicons name="cube-outline" size={17} color={PURPLE} />

            <Text style={styles.productCountText}>
              {seller.productCount} product
              {seller.productCount === 1 ? "" : "s"}
            </Text>
          </View>

          <View style={styles.viewDetails}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={17} color={PURPLE} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={DARK} />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Seller Management</Text>

            <Text style={styles.headerSubtitle}>
              Manage CampusMart sellers
            </Text>
          </View>
        </View>

        <View style={styles.adminInfo}>
          <Ionicons name="shield-checkmark" size={17} color={PURPLE} />

          <Text style={styles.adminEmail} numberOfLines={1}>
            {adminEmail}
          </Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalSellers}</Text>
            <Text style={styles.statLabel}>Total Sellers</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#16834A" }]}>
              {activeSellers}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#C0392B" }]}>
              {suspendedSellers}
            </Text>
            <Text style={styles.statLabel}>Suspended</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{sellersWithProducts}</Text>
            <Text style={styles.statLabel}>Selling</Text>
          </View>
        </View>

        {/* Sellers heading */}
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Registered Sellers</Text>

          <Text style={styles.sectionSubtitle}>
            {filteredSellers.length} seller
            {filteredSellers.length === 1 ? "" : "s"} found
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" />

          <TextInput
            style={styles.searchInput}
            placeholder="Search name, email or Account ID"
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />

          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={19} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          {["All", "Active", "Suspended"].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterButton,
                filter === item && styles.activeFilter,
              ]}
              onPress={() => setFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.activeFilterText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Seller list */}
        {usersLoading ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={35} color={PURPLE} />
            <Text style={styles.emptyTitle}>Loading sellers...</Text>
          </View>
        ) : filteredSellers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={42} color="#B7A8D9" />

            <Text style={styles.emptyTitle}>No sellers found</Text>

            <Text style={styles.emptyText}>
              Registered student accounts will appear here.
            </Text>
          </View>
        ) : (
          filteredSellers.map(renderSellerCard)
        )}

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={PURPLE}
          />

          <Text style={styles.noticeText}>
            Seller records and account status currently come from local
            device storage. A backend is required for central management
            across different student devices.
          </Text>
        </View>
      </ScrollView>

      {/* Seller Details Modal */}
      <Modal
        visible={detailsVisible}
        animationType="slide"
        transparent
        onRequestClose={closeSellerDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seller Details</Text>

              <TouchableOpacity onPress={closeSellerDetails}>
                <Ionicons name="close" size={25} color={DARK} />
              </TouchableOpacity>
            </View>

            {selectedSeller && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Seller profile */}
                <View style={styles.modalProfile}>
                  {getImageUri(selectedSeller.profilePhoto) ? (
                    <Image
                      source={{
                        uri: getImageUri(selectedSeller.profilePhoto),
                      }}
                      style={styles.modalAvatar}
                    />
                  ) : (
                    <View style={styles.modalAvatarPlaceholder}>
                      <Ionicons name="person" size={35} color={PURPLE} />
                    </View>
                  )}

                  <Text style={styles.modalSellerName}>
                    {selectedSeller.fullName || "Unnamed Student"}
                  </Text>

                  <Text style={styles.modalAccountId}>
                    {selectedSeller.accountId || "No Account ID"}
                  </Text>
                </View>

                {/* Seller information */}
                <View style={styles.detailsBox}>
                  <DetailRow
                    label="Email"
                    value={selectedSeller.email}
                  />

                  <DetailRow
                    label="Phone"
                    value={selectedSeller.phone}
                  />

                  <DetailRow
                    label="Department"
                    value={selectedSeller.department}
                  />

                  <DetailRow
                    label="Level"
                    value={selectedSeller.level}
                  />

                  <DetailRow
                    label="Registration Date"
                    value={formatDate(selectedSeller.registrationDate)}
                  />

                  <DetailRow
                    label="Account Status"
                    value={selectedSeller.status}
                  />

                  <DetailRow
                    label="Total Products"
                    value={selectedSeller.productCount}
                  />
                </View>

                {/* Seller products */}
                <Text style={styles.productsHeading}>
                  Seller Products
                </Text>

                {Array.isArray(selectedSeller.products) &&
                selectedSeller.products.length > 0 ? (
                  selectedSeller.products.map((product, index) => {
                    const productImage = getImageUri(
                      product.images?.[0] || product.photos?.[0]
                    );

                    return (
                      <View
                        key={product.id || product._id || `product-${index}`}
                        style={styles.productRow}
                      >
                        {productImage ? (
                          <Image
                            source={{ uri: productImage }}
                            style={styles.productImage}
                          />
                        ) : (
                          <View style={styles.productImagePlaceholder}>
                            <Ionicons
                              name="cube-outline"
                              size={22}
                              color={PURPLE}
                            />
                          </View>
                        )}

                        <View style={styles.productInfo}>
                          <Text style={styles.productName}>
                            {product.name ||
                              product.productName ||
                              "Unnamed Product"}
                          </Text>

                          <Text style={styles.productPrice}>
                            {"₦" +
                              Number(product.price || 0).toLocaleString(
                                "en-NG"
                              )}
                          </Text>

                          <Text style={styles.productStatus}>
                            Status: {product.status || "Pending"}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.noProducts}>
                    This seller has not submitted any products yet.
                  </Text>
                )}

                {/* Suspend / Activate */}
                <TouchableOpacity
                  style={[
                    styles.statusAction,
                    {
                      backgroundColor:
                        selectedSeller.status === "Suspended"
                          ? "#16834A"
                          : "#D64545",
                    },
                  ]}
                  onPress={() => handleStatusChange(selectedSeller)}
                >
                  <Ionicons
                    name={
                      selectedSeller.status === "Suspended"
                        ? "checkmark-circle-outline"
                        : "ban-outline"
                    }
                    size={19}
                    color="#FFFFFF"
                  />

                  <Text style={styles.statusActionText}>
                    {selectedSeller.status === "Suspended"
                      ? "Activate Seller Account"
                      : "Suspend Seller Account"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Seller information row.
function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={styles.detailValue}>
        {safeText(value)}
      </Text>
    </View>
  );
}

// Screen styles.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: DARK,
  },

  headerSubtitle: {
    color: "#777",
    fontSize: 12,
    marginTop: 3,
  },

  adminInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 18,
    gap: 8,
  },

  adminEmail: {
    color: DARK,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 25,
  },

  statCard: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    padding: 17,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EEE7FA",
  },

  statNumber: {
    color: PURPLE,
    fontSize: 25,
    fontWeight: "800",
  },

  statLabel: {
    color: "#777",
    fontSize: 12,
    marginTop: 5,
  },

  sectionHeading: {
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: DARK,
  },

  sectionSubtitle: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },

  searchBox: {
    height: 49,
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
    gap: 9,
  },

  searchInput: {
    flex: 1,
    color: DARK,
    fontSize: 13,
  },

  filters: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 16,
  },

  filterButton: {
    paddingVertical: 9,
    paddingHorizontal: 17,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },

  activeFilter: {
    backgroundColor: PURPLE,
  },

  filterText: {
    color: "#777",
    fontSize: 12,
    fontWeight: "600",
  },

  activeFilterText: {
    color: "#FFFFFF",
  },

  sellerCard: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE7FA",
  },

  sellerTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 53,
    height: 53,
    borderRadius: 27,
    marginRight: 11,
  },

  avatarPlaceholder: {
    width: 53,
    height: 53,
    borderRadius: 27,
    backgroundColor: "#F0E9FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  sellerInfo: {
    flex: 1,
  },

  sellerName: {
    color: DARK,
    fontSize: 14,
    fontWeight: "800",
  },

  sellerEmail: {
    color: "#777",
    fontSize: 11,
    marginTop: 4,
  },

  accountId: {
    color: PURPLE,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  sellerDivider: {
    height: 1,
    backgroundColor: "#F0EDF5",
    marginVertical: 13,
  },

  sellerBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  productCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  productCountText: {
    color: "#777",
    fontSize: 11,
  },

  viewDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  viewDetailsText: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: "700",
  },

  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 35,
    alignItems: "center",
    marginTop: 5,
  },

  emptyTitle: {
    color: DARK,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 12,
  },

  emptyText: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },

  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EEE8FF",
    padding: 13,
    borderRadius: 12,
    marginTop: 18,
    gap: 9,
  },

  noticeText: {
    flex: 1,
    color: "#62547F",
    fontSize: 11,
    lineHeight: 17,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.48)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: BACKGROUND,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 19,
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 17,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: DARK,
  },

  modalProfile: {
    alignItems: "center",
    marginBottom: 18,
  },

  modalAvatar: {
    width: 85,
    height: 85,
    borderRadius: 43,
    marginBottom: 10,
  },

  modalAvatarPlaceholder: {
    width: 85,
    height: 85,
    borderRadius: 43,
    backgroundColor: "#EDE5FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  modalSellerName: {
    fontSize: 17,
    fontWeight: "800",
    color: DARK,
  },

  modalAccountId: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },

  detailsBox: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 14,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1EDF7",
    gap: 12,
  },

  detailLabel: {
    color: "#888",
    fontSize: 11,
    flex: 1,
  },

  detailValue: {
    color: DARK,
    fontSize: 11,
    fontWeight: "700",
    flex: 1.3,
    textAlign: "right",
  },

  productsHeading: {
    color: DARK,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 11,
  },

  productRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 12,
    marginBottom: 9,
    gap: 11,
  },

  productImage: {
    width: 57,
    height: 57,
    borderRadius: 9,
  },

  productImagePlaceholder: {
    width: 57,
    height: 57,
    borderRadius: 9,
    backgroundColor: "#F0E9FF",
    justifyContent: "center",
    alignItems: "center",
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    color: DARK,
    fontSize: 12,
    fontWeight: "700",
  },

  productPrice: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },

  productStatus: {
    color: "#888",
    fontSize: 10,
    marginTop: 3,
  },

  noProducts: {
    color: "#888",
    fontSize: 12,
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 10,
  },

  statusAction: {
    minHeight: 49,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 20,
    marginBottom: 15,
  },

  statusActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
