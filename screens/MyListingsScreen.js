
import React, { useState } from "react";
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
import {
  useVideoPlayer,
  VideoView,
} from "expo-video";
import { useListings } from "../context/ListingsContext";

const PURPLE = "#8B5CF6";
const DARK = "#1B153B";
const BACKGROUND = "#F5F0FF";

const filters = ["All", "Active", "Pending", "Sold"];

// Get all saved product photos.
function getProductImages(item) {
  const savedImages = item.images || item.photos || [];

  const imageList = Array.isArray(savedImages)
    ? savedImages
    : [savedImages];

  const validImages = imageList
    .map((image) =>
      typeof image === "string"
        ? image
        : image?.uri
    )
    .filter(Boolean);

  if (validImages.length === 0 && item.image) {
    const singleImage =
      typeof item.image === "string"
        ? item.image
        : item.image?.uri;

    if (singleImage) {
      validImages.push(singleImage);
    }
  }

  return validImages;
}

// Get the saved product video.
function getProductVideo(item) {
  if (!item.video) return null;

  return typeof item.video === "string"
    ? item.video
    : item.video.uri || null;
}

// Product video player.
function ProductVideo({ uri }) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={styles.detailVideo}
      nativeControls
      contentFit="contain"
      allowsFullscreen
      allowsPictureInPicture={false}
    />
  );
}

// Reusable product information row.
function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

export default function MyListingsScreen({ navigation }) {
  const {
    listings,
    updateListing,
    deleteListing,
  } = useListings();

  const [selectedFilter, setSelectedFilter] = useState("All");

  const [editVisible, setEditVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const [viewingItem, setViewingItem] = useState(null);

  // Navigate to Sell screen.
  const navigateToSell = () => {
    const state = navigation?.getState?.();

    if (state?.routeNames?.includes("Sell")) {
      navigation.navigate("Sell");
      return;
    }

    const parent = navigation?.getParent?.();
    const parentState = parent?.getState?.();

    if (parentState?.routeNames?.includes("Sell")) {
      parent.navigate("Sell");
      return;
    }

    Alert.alert(
      "Coming soon",
      "The Sell screen is not available in this navigation stack."
    );
  };

  // Filter listings.
  const filteredListings =
    selectedFilter === "All"
      ? listings
      : listings.filter(
          (item) =>
            item.status?.toLowerCase() ===
            selectedFilter.toLowerCase()
        );

  // Count listings by status.
  const countFor = (status) => {
    if (status === "All") {
      return listings.length;
    }

    return listings.filter(
      (item) =>
        item.status?.toLowerCase() ===
        status.toLowerCase()
    ).length;
  };

  // Format Nigerian currency.
  const formatPrice = (price) => {
    return `₦${Number(price || 0).toLocaleString("en-NG")}`;
  };

  // Open edit modal.
  const openEdit = (item) => {
    setEditingItem(item);
    setEditName(item.name || item.productName || "");
    setEditPrice(String(item.price ?? ""));
    setEditVisible(true);
  };

  // Save edited product.
  const saveEdit = () => {
    if (!editingItem) return;

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

    updateListing(editingItem.id, {
      name: cleanName,
      productName: cleanName,
      price: numericPrice,
    });

    setEditVisible(false);
    setEditingItem(null);

    Alert.alert(
      "Listing updated",
      "Your changes have been applied."
    );
  };

  // Confirm product deletion.
  const confirmDelete = (item) => {
    const productName =
      item.name || item.productName || "this product";

    Alert.alert(
      "Delete listing",
      `Are you sure you want to delete "${productName}"?`,
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

            if (viewingItem?.id === item.id) {
              setViewingItem(null);
            }
          },
        },
      ]
    );
  };

  // Open complete product details.
  const openListingDetails = (item) => {
    setViewingItem(item);
  };

  // Status badge styles.
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return styles.activeStatus;
      case "pending":
        return styles.pendingStatus;
      case "sold":
        return styles.soldStatus;
      default:
        return styles.pendingStatus;
    }
  };

  const getStatusTextStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return styles.activeStatusText;
      case "pending":
        return styles.pendingStatusText;
      case "sold":
        return styles.soldStatusText;
      default:
        return styles.pendingStatusText;
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
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate("Profile");
                }
              }}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={DARK}
              />
            </TouchableOpacity>

            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>
                My Listings
              </Text>

              <Text style={styles.headerSubtitle}>
                Manage your products for sale
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addIconButton}
              onPress={navigateToSell}
            >
              <Ionicons
                name="add"
                size={25}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* SUMMARY */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryLabel}>
                  Total Listings
                </Text>

                <Text style={styles.summaryNumber}>
                  {listings.length}
                </Text>
              </View>

              <View style={styles.summaryIcon}>
                <Ionicons
                  name="storefront-outline"
                  size={27}
                  color={PURPLE}
                />
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryBottom}>
              <View style={styles.summarySmallItem}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: "#16A34A" },
                  ]}
                />

                <Text style={styles.summarySmallText}>
                  {countFor("Active")} Active
                </Text>
              </View>

              <View style={styles.summarySmallItem}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: "#D97706" },
                  ]}
                />

                <Text style={styles.summarySmallText}>
                  {countFor("Pending")} Pending
                </Text>
              </View>

              <View style={styles.summarySmallItem}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: "#64748B" },
                  ]}
                />

                <Text style={styles.summarySmallText}>
                  {countFor("Sold")} Sold
                </Text>
              </View>
            </View>
          </View>

          {/* FILTERS HEADER */}
          <View style={styles.filterHeader}>
            <Text style={styles.sectionTitle}>
              Your Products
            </Text>

            <Text style={styles.productCount}>
              {filteredListings.length} items
            </Text>
          </View>

          {/* FILTER BUTTONS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {filters.map((filter) => {
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
                      selected && styles.selectedFilterCount,
                    ]}
                  >
                    {countFor(filter)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* PRODUCT LIST */}
          {filteredListings.length > 0 ? (
            filteredListings.map((item) => {
              const imageUri = getProductImages(item)[0];

              const productName =
                item.name || item.productName || "Unnamed product";

              return (
                <View
                  key={item.id}
                  style={styles.productCard}
                >
                  <TouchableOpacity
                    style={styles.productTop}
                    activeOpacity={0.85}
                    onPress={() => openListingDetails(item)}
                  >
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.productImage}>
                        <Ionicons
                          name="image-outline"
                          size={34}
                          color="#A78BFA"
                        />

                        <Text style={styles.imageLabel}>
                          Product photo
                        </Text>
                      </View>
                    )}

                    <View style={styles.productDetails}>
                      <View
                        style={[
                          styles.statusBadge,
                          getStatusStyle(item.status),
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            getStatusTextStyle(item.status),
                          ]}
                        >
                          {item.status || "Pending"}
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

                      <Text style={styles.productCondition}>
                        {item.condition || "Condition not provided"}
                      </Text>

                      <Text style={styles.productPrice}>
                        {formatPrice(item.price)}
                      </Text>

                      <Text style={styles.tapToView}>
                        Tap to view photos and video
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.productDivider} />

                  {/* PRODUCT ACTIONS */}
                  <View style={styles.productActions}>
                    <TouchableOpacity
                      style={styles.viewAction}
                      onPress={() => openListingDetails(item)}
                    >
                      <Ionicons
                        name="eye-outline"
                        size={17}
                        color="#2563EB"
                      />

                      <Text style={styles.viewActionText}>
                        View
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editAction}
                      onPress={() => openEdit(item)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={17}
                        color={PURPLE}
                      />

                      <Text style={styles.editActionText}>
                        Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteAction}
                      onPress={() => confirmDelete(item)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color="#DC2626"
                      />

                      <Text style={styles.deleteActionText}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="pricetags-outline"
                  size={38}
                  color={PURPLE}
                />
              </View>

              <Text style={styles.emptyTitle}>
                {selectedFilter === "All"
                  ? "No listings yet"
                  : `No ${selectedFilter.toLowerCase()} listings`}
              </Text>

              <Text style={styles.emptyDescription}>
                {selectedFilter === "All"
                  ? "You haven't added any products yet. Start selling on CampusMart."
                  : `You don't have any ${selectedFilter.toLowerCase()} listings right now.`}
              </Text>

              {selectedFilter === "All" && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={navigateToSell}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text style={styles.emptyButtonText}>
                    Add Your First Product
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ADD PRODUCT BUTTON */}
          <TouchableOpacity
            style={styles.bottomAddButton}
            onPress={navigateToSell}
          >
            <Ionicons
              name="add-circle-outline"
              size={21}
              color="#FFFFFF"
            />

            <Text style={styles.bottomAddButtonText}>
              Add New Product
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            CampusMart — Your Campus. Your Marketplace.
          </Text>
        </View>
      </ScrollView>

      {/* EDIT LISTING MODAL */}
      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Edit Listing
                </Text>

                <Text style={styles.modalSubtitle}>
                  Update your product details
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
              placeholderTextColor="#A39BAD"
            />

            <Text style={styles.inputLabel}>
              Product Price (₦)
            </Text>

            <TextInput
              style={styles.input}
              value={editPrice}
              onChangeText={setEditPrice}
              placeholder="Enter product price"
              placeholderTextColor="#A39BAD"
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
              <Text style={styles.cancelButtonText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* VIEW COMPLETE PRODUCT DETAILS */}
      <Modal
        visible={!!viewingItem}
        transparent
        animationType="slide"
        onRequestClose={() => setViewingItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Product Details
                </Text>

                <Text style={styles.modalSubtitle}>
                  Your complete product listing
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setViewingItem(null)}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={DARK}
                />
              </TouchableOpacity>
            </View>

            {viewingItem && (
              <ScrollView
                showsVerticalScrollIndicator={false}
              >
                {/* PRODUCT PHOTOS */}
                <Text style={styles.detailSectionTitle}>
                  Product Photos
                </Text>

                {getProductImages(viewingItem).length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.detailImageList}
                  >
                    {getProductImages(viewingItem).map(
                      (imageUri, index) => (
                        <Image
                          key={`${viewingItem.id}-photo-${index}`}
                          source={{ uri: imageUri }}
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
                      size={35}
                      color="#A78BFA"
                    />

                    <Text style={styles.noMediaText}>
                      No product photos were saved.
                    </Text>
                  </View>
                )}

                {/* PRODUCT VIDEO */}
                <Text style={styles.detailSectionTitle}>
                  Product Video
                </Text>

                {getProductVideo(viewingItem) ? (
                  <ProductVideo
                    uri={getProductVideo(viewingItem)}
                  />
                ) : (
                  <View style={styles.noMedia}>
                    <Ionicons
                      name="videocam-outline"
                      size={35}
                      color="#A78BFA"
                    />

                    <Text style={styles.noMediaText}>
                      No product video available.
                    </Text>
                  </View>
                )}

                {/* PRODUCT INFORMATION */}
                <Text style={styles.detailSectionTitle}>
                  Product Information
                </Text>

                <View style={styles.detailInfoCard}>
                  <Text style={styles.detailProductName}>
                    {viewingItem.name ||
                      viewingItem.productName ||
                      "Unnamed product"}
                  </Text>

                  <Text style={styles.detailPrice}>
                    {formatPrice(viewingItem.price)}
                  </Text>

                  <View style={styles.detailDivider} />

                  <DetailRow
                    label="Category"
                    value={viewingItem.category || "Not provided"}
                  />

                  <DetailRow
                    label="Condition"
                    value={viewingItem.condition || "Not provided"}
                  />

                  <DetailRow
                    label="Quantity"
                    value={String(viewingItem.quantity ?? 1)}
                  />

                  <DetailRow
                    label="Location"
                    value={viewingItem.location || "Not provided"}
                  />

                  <DetailRow
                    label="Status"
                    value={viewingItem.status || "Pending"}
                  />

                  <DetailRow
                    label="Listing fee"
                    value={formatPrice(viewingItem.listingFee)}
                  />

                  <Text style={styles.detailDescriptionLabel}>
                    Description
                  </Text>

                  <Text style={styles.detailDescription}>
                    {viewingItem.description ||
                      "No description provided."}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.detailCloseButton}
                  onPress={() => setViewingItem(null)}
                >
                  <Text style={styles.detailCloseButtonText}>
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
    maxWidth: 650,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    gap: 12,
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
    fontSize: 23,
    fontWeight: "800",
    color: DARK,
  },

  headerSubtitle: {
    color: "#888399",
    fontSize: 12,
    marginTop: 4,
  },

  addIconButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 19,
    marginBottom: 28,
  },

  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryLabel: {
    color: "#888399",
    fontSize: 13,
  },

  summaryNumber: {
    color: DARK,
    fontSize: 32,
    fontWeight: "800",
    marginTop: 4,
  },

  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#EDE5FF",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryDivider: {
    height: 1,
    backgroundColor: "#F0EDF5",
    marginVertical: 16,
  },

  summaryBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },

  summarySmallItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  summarySmallText: {
    fontSize: 11,
    color: "#777087",
    fontWeight: "600",
  },

  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: DARK,
  },

  productCount: {
    fontSize: 12,
    color: "#888399",
  },

  filterContainer: {
    gap: 9,
    paddingVertical: 16,
  },

  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },

  selectedFilter: {
    backgroundColor: PURPLE,
  },

  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#777087",
  },

  selectedFilterText: {
    color: "#FFFFFF",
  },

  filterCount: {
    fontSize: 11,
    fontWeight: "700",
    color: PURPLE,
  },

  selectedFilterCount: {
    color: "#FFFFFF",
  },

  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    padding: 15,
    marginBottom: 14,
  },

  productTop: {
    flexDirection: "row",
    gap: 14,
  },

  productImage: {
    width: 105,
    height: 120,
    borderRadius: 15,
    backgroundColor: "#F0EAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  imageLabel: {
    fontSize: 9,
    color: PURPLE,
    marginTop: 5,
  },

  productDetails: {
    flex: 1,
    justifyContent: "center",
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 7,
  },

  activeStatus: {
    backgroundColor: "#DCFCE7",
  },

  pendingStatus: {
    backgroundColor: "#FEF3C7",
  },

  soldStatus: {
    backgroundColor: "#E2E8F0",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  activeStatusText: {
    color: "#15803D",
  },

  pendingStatusText: {
    color: "#B45309",
  },

  soldStatusText: {
    color: "#475569",
  },

  productName: {
    fontSize: 15,
    fontWeight: "800",
    color: DARK,
  },

  productCategory: {
    fontSize: 11,
    color: PURPLE,
    marginTop: 4,
  },

  productCondition: {
    fontSize: 11,
    color: "#888399",
    marginTop: 4,
  },

  productPrice: {
    fontSize: 17,
    fontWeight: "800",
    color: DARK,
    marginTop: 7,
  },

  tapToView: {
    fontSize: 10,
    color: PURPLE,
    marginTop: 5,
  },

  productDivider: {
    height: 1,
    backgroundColor: "#F0EDF5",
    marginTop: 15,
  },

  productActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
    paddingTop: 13,
  },

  viewAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  viewActionText: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 12,
  },

  editAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  editActionText: {
    color: PURPLE,
    fontWeight: "700",
    fontSize: 12,
  },

  deleteAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  deleteActionText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 12,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginTop: 5,
  },

  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 24,
    backgroundColor: "#EDE5FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  emptyTitle: {
    color: DARK,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDescription: {
    color: "#888399",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 18,
  },

  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: PURPLE,
    borderRadius: 13,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  bottomAddButton: {
    minHeight: 52,
    backgroundColor: PURPLE,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 12,
  },

  bottomAddButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  footer: {
    textAlign: "center",
    color: "#9994A8",
    fontSize: 11,
    marginTop: 25,
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(27, 21, 59, 0.45)",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 23,
    padding: 22,
  },

  detailsModal: {
    width: "100%",
    maxWidth: 550,
    maxHeight: "90%",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 23,
    padding: 20,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: DARK,
  },

  modalSubtitle: {
    fontSize: 12,
    color: "#888399",
    marginTop: 5,
  },

  closeButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: DARK,
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#DDD5E9",
    borderRadius: 13,
    paddingHorizontal: 14,
    fontSize: 14,
    color: DARK,
    marginBottom: 18,
  },

  saveButton: {
    height: 52,
    backgroundColor: PURPLE,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  cancelButton: {
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 7,
  },

  cancelButtonText: {
    color: "#6D28D9",
    fontWeight: "700",
    fontSize: 13,
  },

  // PRODUCT DETAILS
  detailSectionTitle: {
    color: DARK,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 12,
  },

  detailImageList: {
    gap: 10,
    paddingRight: 5,
  },

  detailImage: {
    width: 230,
    height: 220,
    borderRadius: 15,
    backgroundColor: "#F0EAFE",
  },

  detailVideo: {
    width: "100%",
    height: 220,
    backgroundColor: DARK,
    borderRadius: 15,
  },

  noMedia: {
    minHeight: 110,
    backgroundColor: "#F5F0FF",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 15,
  },

  noMediaText: {
    fontSize: 12,
    color: "#888399",
    textAlign: "center",
  },

  detailInfoCard: {
    backgroundColor: "#F8F5FF",
    borderRadius: 16,
    padding: 16,
  },

  detailProductName: {
    fontSize: 19,
    fontWeight: "800",
    color: DARK,
  },

  detailPrice: {
    fontSize: 21,
    fontWeight: "900",
    color: PURPLE,
    marginTop: 7,
  },

  detailDivider: {
    height: 1,
    backgroundColor: "#E8E0F2",
    marginVertical: 15,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 13,
  },

  detailLabel: {
    color: "#888399",
    fontSize: 12,
  },

  detailValue: {
    color: DARK,
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
  },

  detailDescriptionLabel: {
    color: DARK,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
  },

  detailDescription: {
    color: "#71677E",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 7,
  },

  detailCloseButton: {
    backgroundColor: PURPLE,
    borderRadius: 13,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },

  detailCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
