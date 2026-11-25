
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
import { useVideoPlayer, VideoView } from "expo-video";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useListings } from "../context/ListingsContext";
import { useUsers } from "../context/UsersContext";

const PURPLE = "#8B5CF6";
const DARK = "#24194A";
const BACKGROUND = "#F7F3FF";

const FILTERS = ["All", "Pending", "Active", "Rejected", "Sold"];

const NOTIFICATIONS_KEY = "campusmart_notifications";

// GET PRODUCT IMAGES
function getProductImages(item) {
  const savedImages = item.images || item.photos || [];

  const imageList = Array.isArray(savedImages)
    ? savedImages
    : [savedImages];

  const images = imageList
    .map((image) =>
      typeof image === "string" ? image : image?.uri
    )
    .filter(Boolean);

  if (images.length === 0 && item.image) {
    const singleImage =
      typeof item.image === "string"
        ? item.image
        : item.image?.uri;

    if (singleImage) images.push(singleImage);
  }

  return images;
}

// GET PRODUCT VIDEO
function getProductVideo(item) {
  if (!item.video) return null;

  return typeof item.video === "string"
    ? item.video
    : item.video.uri || null;
}

// GET SELLER INFORMATION
function getSellerDetails(item, users = []) {
  const sellerAccountId =
    item.sellerAccountId ||
    item.seller?.accountId ||
    item.sellerId ||
    "";

  const registeredSeller = users.find(
    (user) => user.accountId === sellerAccountId
  );

  return {
    accountId:
      sellerAccountId ||
      registeredSeller?.accountId ||
      "Not recorded",

    name:
      item.sellerName ||
      item.seller?.fullName ||
      registeredSeller?.fullName ||
      "Seller name unavailable",

    email:
      item.sellerEmail ||
      item.seller?.email ||
      registeredSeller?.email ||
      "Email unavailable",

    phone:
      item.sellerPhone ||
      item.seller?.phone ||
      registeredSeller?.phone ||
      "Phone unavailable",
  };
}

// PRODUCT VIDEO PLAYER
function ProductVideo({ uri }) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={styles.video}
      nativeControls
      contentFit="contain"
      allowsFullscreen
      allowsPictureInPicture={false}
    />
  );
}

// DETAIL ROW
function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={styles.detailValue}>
        {String(value ?? "Not provided")}
      </Text>
    </View>
  );
}

export default function AdminProductsScreen({
  navigation,
  route,
}) {
  // LISTINGS CONTEXT
  const {
    listings,
    updateListing,
    deleteListing,
  } = useListings();

  // REGISTERED STUDENTS CONTEXT
  const { users } = useUsers();

  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const adminEmail =
    route?.params?.adminEmail || "Admin account";

  // FORMAT PRICE
  const formatPrice = (price) =>
    `₦${Number(price || 0).toLocaleString("en-NG")}`;

  // FILTER PRODUCTS AND SEARCH SELLER INFORMATION
  const filteredListings = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return listings.filter((item) => {
      const status = (
        item.status || "Pending"
      ).toLowerCase();

      const matchesFilter =
        selectedFilter === "All" ||
        status === selectedFilter.toLowerCase();

      const productName = (
        item.name || item.productName || ""
      ).toLowerCase();

      const category = (
        item.category || ""
      ).toLowerCase();

      const seller = getSellerDetails(item, users);

      const matchesSearch =
        !searchText ||
        productName.includes(searchText) ||
        category.includes(searchText) ||
        String(item.id || "")
          .toLowerCase()
          .includes(searchText) ||
        seller.name.toLowerCase().includes(searchText) ||
        seller.email.toLowerCase().includes(searchText) ||
        seller.accountId.toLowerCase().includes(searchText);

      return matchesFilter && matchesSearch;
    });
  }, [listings, selectedFilter, search, users]);

  // COUNT PRODUCTS BY STATUS
  const countFor = (status) => {
    if (status === "All") return listings.length;

    return listings.filter(
      (item) =>
        (item.status || "Pending").toLowerCase() ===
        status.toLowerCase()
    ).length;
  };

  // APPROVE OR REJECT PRODUCT AND NOTIFY SELLER
  const changeStatus = (item, newStatus) => {
    const productName =
      item.name || item.productName || "your product";

    const isApproved = newStatus === "Active";

    const actionText = isApproved ? "approve" : "reject";

    Alert.alert(
      `${isApproved ? "Approve" : "Reject"} listing`,
      `Are you sure you want to ${actionText} "${productName}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          onPress: async () => {
            try {
              // UPDATE PRODUCT STATUS
              await updateListing(item.id, {
                status: newStatus,
              });

              setSelectedProduct((current) =>
                current?.id === item.id
                  ? {
                      ...current,
                      status: newStatus,
                    }
                  : current
              );

              // FIND SELLER DETAILS
              const seller = getSellerDetails(item, users);

              const sellerEmail =
                seller.email &&
                seller.email !== "Email unavailable"
                  ? seller.email.trim().toLowerCase()
                  : "";

              // IF SELLER EMAIL IS NOT AVAILABLE
              // THE PRODUCT IS STILL UPDATED
              if (!sellerEmail) {
                Alert.alert(
                  "Listing updated",
                  `The product status is now ${newStatus}, but a seller notification could not be created because the seller's email address was not found.`
                );

                return;
              }

              // READ EXISTING NOTIFICATIONS
              const savedNotifications =
                await AsyncStorage.getItem(NOTIFICATIONS_KEY);

              let notifications = [];

              if (savedNotifications) {
                try {
                  const parsed = JSON.parse(savedNotifications);

                  notifications = Array.isArray(parsed)
                    ? parsed
                    : [];
                } catch {
                  notifications = [];
                }
              }

              // CREATE SELLER NOTIFICATION
              const notification = {
                id: `product-${item.id}-${Date.now()}`,

                userEmail: sellerEmail,

                title: isApproved
                  ? "Product Approved"
                  : "Product Rejected",

                message: isApproved
                  ? `Good news! Your product "${productName}" has been approved and is now active on CampusMart.`
                  : `Your product "${productName}" was rejected by the admin. Please review the listing and make the necessary changes before submitting it again.`,

                type: isApproved
                  ? "approved"
                  : "rejected",

                isRead: false,

                createdAt: new Date().toISOString(),
              };

              // SAVE NOTIFICATION
              const updatedNotifications = [
                notification,
                ...notifications,
              ];

              await AsyncStorage.setItem(
                NOTIFICATIONS_KEY,
                JSON.stringify(updatedNotifications)
              );

              Alert.alert(
                "Listing updated",
                `The product is now ${newStatus}. A notification has been saved for the seller.`
              );
            } catch (error) {
              console.log(
                "Product status or notification error:",
                error
              );

              Alert.alert(
                "Update completed with an issue",
                "The product update or notification could not be fully completed. Please check the listing status and try again if necessary."
              );
            }
          },
        },
      ]
    );
  };

  // OPEN EDIT MODAL
  const openEdit = (item) => {
    setEditingProduct(item);

    setEditName(
      item.name || item.productName || ""
    );

    setEditPrice(String(item.price ?? ""));

    setEditVisible(true);
  };

  // SAVE PRODUCT EDIT
  const saveEdit = () => {
    if (!editingProduct) return;

    const cleanName = editName.trim();

    const numericPrice = Number(
      editPrice.replace(/,/g, "")
    );

    if (!cleanName) {
      Alert.alert(
        "Missing product name",
        "Enter a product name."
      );

      return;
    }

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      Alert.alert(
        "Invalid price",
        "Enter a valid product price."
      );

      return;
    }

    updateListing(editingProduct.id, {
      name: cleanName,
      productName: cleanName,
      price: numericPrice,
    });

    setSelectedProduct((current) =>
      current?.id === editingProduct.id
        ? {
            ...current,
            name: cleanName,
            productName: cleanName,
            price: numericPrice,
          }
        : current
    );

    setEditVisible(false);
    setEditingProduct(null);

    Alert.alert(
      "Changes saved",
      "The product details have been updated."
    );
  };

  // DELETE PRODUCT
  const confirmDelete = (item) => {
    const productName =
      item.name || item.productName || "this product";

    Alert.alert(
      "Delete product",
      `Are you sure you want to permanently remove "${productName}" from the current listings?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteListing(item.id);

            if (selectedProduct?.id === item.id) {
              setSelectedProduct(null);
            }

            Alert.alert(
              "Product deleted",
              "The listing has been removed."
            );
          },
        },
      ]
    );
  };

  // STATUS BADGE STYLE
  const getStatusStyle = (status) => {
    switch ((status || "Pending").toLowerCase()) {
      case "active":
        return styles.activeBadge;

      case "rejected":
        return styles.rejectedBadge;

      case "sold":
        return styles.soldBadge;

      default:
        return styles.pendingBadge;
    }
  };

  // STATUS TEXT STYLE
  const getStatusTextStyle = (status) => {
    switch ((status || "Pending").toLowerCase()) {
      case "active":
        return styles.activeText;

      case "rejected":
        return styles.rejectedText;

      case "sold":
        return styles.soldText;

      default:
        return styles.pendingText;
    }
  };

  // BACK NAVIGATION
  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("AdminDashboard", {
        adminEmail,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={goBack}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={DARK}
              />
            </TouchableOpacity>

            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>
                Manage Products
              </Text>

              <Text style={styles.headerSubtitle}>
                Review and manage marketplace listings
              </Text>
            </View>
          </View>

          {/* SUMMARY */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              Total Listings
            </Text>

            <Text style={styles.summaryNumber}>
              {listings.length}
            </Text>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryItem}>
                Pending: {countFor("Pending")}
              </Text>

              <Text style={styles.summaryItem}>
                Active: {countFor("Active")}
              </Text>

              <Text style={styles.summaryItem}>
                Rejected: {countFor("Rejected")}
              </Text>
            </View>
          </View>

          {/* SEARCH */}
          <View style={styles.searchBox}>
            <Ionicons
              name="search-outline"
              size={20}
              color="#9389A8"
            />

            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search product, seller, email or Account ID..."
              placeholderTextColor="#A49BB5"
            />

            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch("")}
              >
                <Ionicons
                  name="close-circle"
                  size={19}
                  color="#9389A8"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* FILTERS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
          >
            {FILTERS.map((filter) => {
              const selected =
                selectedFilter === filter;

              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    selected && styles.selectedFilter,
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selected && styles.selectedFilterText,
                    ]}
                  >
                    {filter}
                  </Text>

                  <Text
                    style={[
                      styles.filterCount,
                      selected && styles.selectedFilterText,
                    ]}
                  >
                    {countFor(filter)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* PRODUCT COUNT */}
          <View style={styles.listHeading}>
            <Text style={styles.sectionTitle}>
              Marketplace Listings
            </Text>

            <Text style={styles.resultCount}>
              {filteredListings.length} found
            </Text>
          </View>

          {/* PRODUCTS */}
          {filteredListings.length > 0 ? (
            filteredListings.map((item) => {
              const images = getProductImages(item);

              const productName =
                item.name ||
                item.productName ||
                "Unnamed product";

              const status = item.status || "Pending";

              const seller = getSellerDetails(
                item,
                users
              );

              return (
                <View
                  key={item.id}
                  style={styles.productCard}
                >
                  <TouchableOpacity
                    style={styles.productTop}
                    activeOpacity={0.85}
                    onPress={() =>
                      setSelectedProduct(item)
                    }
                  >
                    {images.length > 0 ? (
                      <Image
                        source={{ uri: images[0] }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={styles.productImagePlaceholder}
                      >
                        <Ionicons
                          name="image-outline"
                          size={32}
                          color="#A78BFA"
                        />

                        <Text style={styles.placeholderText}>
                          No photo
                        </Text>
                      </View>
                    )}

                    <View style={styles.productInfo}>
                      <View
                        style={[
                          styles.statusBadge,
                          getStatusStyle(status),
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            getStatusTextStyle(status),
                          ]}
                        >
                          {status}
                        </Text>
                      </View>

                      <Text
                        style={styles.productName}
                        numberOfLines={2}
                      >
                        {productName}
                      </Text>

                      <Text style={styles.productCategory}>
                        {item.category || "Uncategorised"}
                      </Text>

                      <Text style={styles.productPrice}>
                        {formatPrice(item.price)}
                      </Text>

                      <Text style={styles.viewHint}>
                        Tap to view full listing
                      </Text>

                      <View style={styles.sellerPreview}>
                        <Ionicons
                          name="person-circle-outline"
                          size={15}
                          color={PURPLE}
                        />

                        <Text
                          style={styles.sellerPreviewText}
                          numberOfLines={1}
                        >
                          {seller.name}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.cardDivider} />

                  {/* ADMIN ACTIONS */}
                  <View style={styles.actionRow}>
                    {status.toLowerCase() === "pending" && (
                      <>
                        <TouchableOpacity
                          style={styles.approveButton}
                          onPress={() =>
                            changeStatus(item, "Active")
                          }
                        >
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={17}
                            color="#15803D"
                          />

                          <Text style={styles.approveText}>
                            Approve
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() =>
                            changeStatus(item, "Rejected")
                          }
                        >
                          <Ionicons
                            name="close-circle-outline"
                            size={17}
                            color="#DC2626"
                          />

                          <Text style={styles.rejectText}>
                            Reject
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {status.toLowerCase() === "rejected" && (
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() =>
                          changeStatus(item, "Active")
                        }
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={17}
                          color="#15803D"
                        />

                        <Text style={styles.approveText}>
                          Approve
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEdit(item)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={17}
                        color={PURPLE}
                      />

                      <Text style={styles.editText}>
                        Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => confirmDelete(item)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color="#DC2626"
                      />

                      <Text style={styles.deleteText}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons
                name="cube-outline"
                size={43}
                color={PURPLE}
              />

              <Text style={styles.emptyTitle}>
                {listings.length === 0
                  ? "No products available"
                  : "No matching products"}
              </Text>

              <Text style={styles.emptyDescription}>
                {listings.length === 0
                  ? "Products created through the student Sell screen will appear here when they are available in this app session."
                  : "Try another search term or select a different filter."}
              </Text>

              {(search || selectedFilter !== "All") && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setSearch("");
                    setSelectedFilter("All");
                  }}
                >
                  <Text style={styles.clearButtonText}>
                    Clear Search and Filter
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* INFORMATION NOTICE */}
          <View style={styles.noticeCard}>
            <Ionicons
              name="information-circle-outline"
              size={21}
              color={PURPLE}
            />

            <Text style={styles.noticeText}>
              Product changes currently affect the listings
              held in this app's ListingsContext. Seller
              information is matched with registered student
              records where available. Notifications are saved
              locally on this device. Shared student listings
              and permanent changes require backend integration.
            </Text>
          </View>

          <Text style={styles.footer}>
            CampusMart Admin Panel
          </Text>
        </View>
      </ScrollView>

      {/* EDIT PRODUCT MODAL */}
      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Edit Product
                </Text>

                <Text style={styles.modalSubtitle}>
                  Update the listing information
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditVisible(false)}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={DARK}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>
              Product Name
            </Text>

            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter product name"
              placeholderTextColor="#A49BB5"
            />

            <Text style={styles.inputLabel}>
              Product Price (₦)
            </Text>

            <TextInput
              style={styles.input}
              value={editPrice}
              onChangeText={setEditPrice}
              placeholder="Enter product price"
              placeholderTextColor="#A49BB5"
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveEdit}
            >
              <Text style={styles.saveButtonText}>
                Save Changes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditVisible(false)}
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PRODUCT DETAILS MODAL */}
      <Modal
        visible={!!selectedProduct}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Product Details
                </Text>

                <Text style={styles.modalSubtitle}>
                  Review the complete listing
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedProduct(null)}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={DARK}
                />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <ScrollView
                showsVerticalScrollIndicator={false}
              >
                {/* PRODUCT PHOTOS */}
                <Text style={styles.detailSectionTitle}>
                  Product Photos
                </Text>

                {getProductImages(selectedProduct).length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.imageList}
                  >
                    {getProductImages(selectedProduct).map(
                      (uri, index) => (
                        <Image
                          key={`${selectedProduct.id}-${index}`}
                          source={{ uri }}
                          style={styles.detailImage}
                          resizeMode="cover"
                        />
                      )
                    )}
                  </ScrollView>
                ) : (
                  <View style={styles.noMedia}>
                    <Ionicons
                      name="image-outline"
                      size={32}
                      color={PURPLE}
                    />

                    <Text style={styles.noMediaText}>
                      No product photos available.
                    </Text>
                  </View>
                )}

                {/* PRODUCT VIDEO */}
                <Text style={styles.detailSectionTitle}>
                  Product Video
                </Text>

                {getProductVideo(selectedProduct) ? (
                  <ProductVideo
                    uri={getProductVideo(selectedProduct)}
                  />
                ) : (
                  <View style={styles.noMedia}>
                    <Ionicons
                      name="videocam-outline"
                      size={32}
                      color={PURPLE}
                    />

                    <Text style={styles.noMediaText}>
                      No product video available.
                    </Text>
                  </View>
                )}

                {/* SELLER INFORMATION */}
                <Text style={styles.detailSectionTitle}>
                  Seller Information
                </Text>

                {(() => {
                  const seller = getSellerDetails(
                    selectedProduct,
                    users
                  );

                  return (
                    <View style={styles.detailCard}>
                      <DetailRow
                        label="Seller Name"
                        value={seller.name}
                      />

                      <DetailRow
                        label="Account ID"
                        value={seller.accountId}
                      />

                      <DetailRow
                        label="Email Address"
                        value={seller.email}
                      />

                      <DetailRow
                        label="Phone Number"
                        value={seller.phone}
                      />
                    </View>
                  );
                })()}

                {/* LISTING INFORMATION */}
                <Text style={styles.detailSectionTitle}>
                  Listing Information
                </Text>

                <View style={styles.detailCard}>
                  <Text style={styles.detailProductName}>
                    {selectedProduct.name ||
                      selectedProduct.productName ||
                      "Unnamed product"}
                  </Text>

                  <Text style={styles.detailPrice}>
                    {formatPrice(selectedProduct.price)}
                  </Text>

                  <View style={styles.detailDivider} />

                  <DetailRow
                    label="Category"
                    value={
                      selectedProduct.category || "Not provided"
                    }
                  />

                  <DetailRow
                    label="Condition"
                    value={
                      selectedProduct.condition || "Not provided"
                    }
                  />

                  <DetailRow
                    label="Quantity"
                    value={selectedProduct.quantity ?? 1}
                  />

                  <DetailRow
                    label="Location"
                    value={
                      selectedProduct.location || "Not provided"
                    }
                  />

                  <DetailRow
                    label="Status"
                    value={
                      selectedProduct.status || "Pending"
                    }
                  />

                  <DetailRow
                    label="Listing ID"
                    value={selectedProduct.id}
                  />

                  <Text style={styles.descriptionLabel}>
                    Description
                  </Text>

                  <Text style={styles.descriptionText}>
                    {selectedProduct.description ||
                      "No description provided."}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeDetailsButton}
                  onPress={() => setSelectedProduct(null)}
                >
                  <Text style={styles.closeDetailsText}>
                    Close Details
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

// STYLES
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 25,
  },

  container: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
    paddingHorizontal: 19,
    paddingTop: 15,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 22,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 11,
    color: "#827A98",
    marginTop: 4,
  },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    padding: 18,
    marginBottom: 18,
  },

  summaryLabel: {
    color: "#827A98",
    fontSize: 12,
  },

  summaryNumber: {
    color: DARK,
    fontSize: 31,
    fontWeight: "900",
    marginTop: 4,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: "#EEE8F5",
    marginVertical: 14,
  },

  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 9,
  },

  summaryItem: {
    color: "#71677E",
    fontSize: 11,
    fontWeight: "700",
  },

  searchBox: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE3F5",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 9,
  },

  searchInput: {
    flex: 1,
    color: DARK,
    fontSize: 13,
  },

  filterList: {
    gap: 9,
    paddingVertical: 16,
  },

  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },

  selectedFilter: {
    backgroundColor: PURPLE,
  },

  filterText: {
    color: "#777087",
    fontSize: 11,
    fontWeight: "700",
  },

  selectedFilterText: {
    color: "#FFFFFF",
  },

  filterCount: {
    color: PURPLE,
    fontSize: 10,
    fontWeight: "800",
  },

  listHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },

  sectionTitle: {
    color: DARK,
    fontSize: 17,
    fontWeight: "800",
  },

  resultCount: {
    color: "#827A98",
    fontSize: 11,
  },

  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#EEE8FA",
  },

  productTop: {
    flexDirection: "row",
    gap: 13,
  },

  productImage: {
    width: 105,
    height: 120,
    borderRadius: 13,
    backgroundColor: "#F0EAFE",
  },

  productImagePlaceholder: {
    width: 105,
    height: 120,
    borderRadius: 13,
    backgroundColor: "#F0EAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderText: {
    fontSize: 10,
    color: PURPLE,
    marginTop: 5,
  },

  productInfo: {
    flex: 1,
    justifyContent: "center",
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 7,
  },

  activeBadge: {
    backgroundColor: "#DCFCE7",
  },

  pendingBadge: {
    backgroundColor: "#FEF3C7",
  },

  rejectedBadge: {
    backgroundColor: "#FEE2E2",
  },

  soldBadge: {
    backgroundColor: "#E2E8F0",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },

  activeText: {
    color: "#15803D",
  },

  pendingText: {
    color: "#B45309",
  },

  rejectedText: {
    color: "#B91C1C",
  },

  soldText: {
    color: "#475569",
  },

  productName: {
    color: DARK,
    fontSize: 14,
    fontWeight: "800",
  },

  productCategory: {
    color: PURPLE,
    fontSize: 11,
    marginTop: 4,
  },

  productPrice: {
    color: DARK,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 7,
  },

  viewHint: {
    color: "#9389A8",
    fontSize: 10,
    marginTop: 5,
  },

  sellerPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },

  sellerPreviewText: {
    color: "#71677E",
    fontSize: 10,
    fontWeight: "700",
    flex: 1,
  },

  cardDivider: {
    height: 1,
    backgroundColor: "#F0EDF5",
    marginTop: 14,
  },

  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 15,
    paddingTop: 13,
  },

  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  approveText: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "800",
  },

  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  rejectText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "800",
  },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  editText: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: "800",
  },

  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  deleteText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "800",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    padding: 27,
    alignItems: "center",
    marginTop: 5,
  },

  emptyTitle: {
    color: DARK,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 13,
  },

  emptyDescription: {
    color: "#827A98",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },

  clearButton: {
    backgroundColor: PURPLE,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 17,
  },

  clearButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#F0EAFE",
    borderRadius: 14,
    padding: 13,
    marginTop: 14,
  },

  noticeText: {
    flex: 1,
    color: "#6D5A91",
    fontSize: 11,
    lineHeight: 17,
  },

  footer: {
    textAlign: "center",
    color: "#9994A8",
    fontSize: 11,
    marginTop: 23,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(27,21,59,0.5)",
    justifyContent: "center",
    padding: 18,
  },

  editModal: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 21,
  },

  detailsModal: {
    width: "100%",
    maxWidth: 550,
    maxHeight: "90%",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 19,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 21,
  },

  modalTitle: {
    color: DARK,
    fontSize: 20,
    fontWeight: "800",
  },

  modalSubtitle: {
    color: "#827A98",
    fontSize: 11,
    marginTop: 4,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },

  inputLabel: {
    color: DARK,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 7,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#DDD5E9",
    borderRadius: 12,
    paddingHorizontal: 13,
    color: DARK,
    fontSize: 13,
    marginBottom: 16,
  },

  saveButton: {
    height: 50,
    borderRadius: 13,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 13,
  },

  cancelText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: "700",
  },

  detailSectionTitle: {
    color: DARK,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 16,
    marginBottom: 11,
  },

  imageList: {
    gap: 10,
    paddingRight: 5,
  },

  detailImage: {
    width: 220,
    height: 190,
    borderRadius: 14,
    backgroundColor: "#F0EAFE",
  },

  video: {
    width: "100%",
    height: 210,
    backgroundColor: DARK,
    borderRadius: 14,
  },

  noMedia: {
    minHeight: 100,
    backgroundColor: "#F5F0FF",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    padding: 14,
  },

  noMediaText: {
    color: "#827A98",
    fontSize: 11,
  },

  detailCard: {
    backgroundColor: "#F8F5FF",
    borderRadius: 15,
    padding: 15,
  },

  detailProductName: {
    color: DARK,
    fontSize: 18,
    fontWeight: "800",
  },

  detailPrice: {
    color: PURPLE,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 6,
  },

  detailDivider: {
    height: 1,
    backgroundColor: "#E8E0F2",
    marginVertical: 14,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },

  detailLabel: {
    color: "#827A98",
    fontSize: 11,
  },

  detailValue: {
    color: DARK,
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
  },

  descriptionLabel: {
    color: DARK,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 5,
  },

  descriptionText: {
    color: "#71677E",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },

  closeDetailsButton: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 17,
    marginBottom: 8,
  },

  closeDetailsText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
});
