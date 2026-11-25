
import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Alert,
  Modal,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";

import { useCart } from "../context/CartContext";

const PURPLE = "#8B5CF6";
const DARK = "#1B153B";
const BACKGROUND = "#F7F3FF";

// Convert an image into a usable URI.
function getImageUri(image) {
  if (typeof image === "string") {
    return image;
  }

  if (image && typeof image.uri === "string") {
    return image.uri;
  }

  return null;
}

// Get all product images.
function getProductImages(product) {
  let savedImages = [];

  if (Array.isArray(product.images) && product.images.length > 0) {
    savedImages = product.images;
  } else if (Array.isArray(product.photos) && product.photos.length > 0) {
    savedImages = product.photos;
  } else if (product.image) {
    savedImages = [product.image];
  }

  return savedImages.map(getImageUri).filter(Boolean);
}

// Get the product video URI.
function getVideoUri(video) {
  if (typeof video === "string") {
    return video;
  }

  if (video && typeof video.uri === "string") {
    return video.uri;
  }

  return null;
}

export default function ProductDetailsScreen({ navigation, route }) {
  const { addToCart } = useCart();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const isSmallPhone = width < 360;

  // Read product information from navigation.
  const routeParams = route?.params || {};
  const product = routeParams.product || routeParams;

  const productId = product.id || product._id || null;

  const productName =
    product.name ||
    product.productName ||
    "Unnamed product";

  const productPrice = Number(product.price || 0);

  const productCategory = product.category || "General";

  const productCondition =
    product.condition || "Not specified";

  const productLocation =
    product.location || "OOU Main Campus";

  const productDescription =
    product.description || "No description provided.";

  const productSeller =
    product.sellerName ||
    product.seller ||
    "CampusMart Student";

  const sellerPhoto = getImageUri(
    product.sellerProfilePhoto || product.sellerPhoto
  );

  const productQuantity = Number(product.quantity ?? 1);

  const images = getProductImages(product);

  const videoUri = getVideoUri(
    product.video || product.videoUri
  );

  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  // Prepare the video player.
  const videoPlayer = useVideoPlayer(
    videoUri ? { uri: videoUri } : null,
    (player) => {
      player.loop = false;
    }
  );

  // Reset image and favorite states when another product opens.
  useEffect(() => {
    setActiveImage(0);
    setIsFavorite(false);
    setImageViewerVisible(false);
  }, [productId]);

  const safeActiveImage =
    images.length > 0
      ? Math.min(activeImage, images.length - 1)
      : 0;

  // Format Nigerian currency.
  const formatMoney = (amount) => {
    return `₦${Number(amount || 0).toLocaleString("en-NG")}`;
  };

  // Prepare the product before adding it to the cart.
  const prepareCartProduct = () => {
    return {
      ...product,
      id: productId,
      name: productName,
      productName,
      price: productPrice,
      images,
    };
  };

  // Add product to cart.
  const handleAddToCart = () => {
    if (!productId) {
      Alert.alert(
        "Unable to add product",
        "This product does not have a valid listing ID."
      );
      return;
    }

    if (product.status && product.status.toLowerCase() !== "active") {
      Alert.alert(
        "Product unavailable",
        "This product is not currently available for purchase."
      );
      return;
    }

    if (productQuantity < 1) {
      Alert.alert(
        "Out of stock",
        "This product is currently unavailable."
      );
      return;
    }

    addToCart(prepareCartProduct());

    Alert.alert(
      "Added to Cart",
      `${productName} has been added to your cart.`,
      [
        {
          text: "Continue Shopping",
          style: "cancel",
        },
        {
          text: "View Cart",
          onPress: () => navigation.navigate("Cart"),
        },
      ]
    );
  };

  // Buy now.
  const handleBuyNow = () => {
    if (!productId) {
      Alert.alert(
        "Unable to continue",
        "This product does not have a valid listing ID."
      );
      return;
    }

    if (product.status && product.status.toLowerCase() !== "active") {
      Alert.alert(
        "Product unavailable",
        "This product is not currently available for purchase."
      );
      return;
    }

    if (productQuantity < 1) {
      Alert.alert(
        "Out of stock",
        "This product is currently unavailable."
      );
      return;
    }

    addToCart(prepareCartProduct());
    navigation.navigate("Cart");
  };

  // Report listing.
  const handleReport = () => {
    Alert.alert(
      "Report Listing",
      "The product reporting system will be connected to the admin dashboard later."
    );
  };

  // Move to next image.
  const showNextImage = () => {
    if (images.length > 1) {
      setActiveImage(
        (previous) => (previous + 1) % images.length
      );
    }
  };

  // Move to previous image.
  const showPreviousImage = () => {
    if (images.length > 1) {
      setActiveImage((previous) =>
        previous === 0 ? images.length - 1 : previous - 1
      );
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom"]}
    >
      <View style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color={DARK}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Product Details
          </Text>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsFavorite((previous) => !previous)}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={23}
              color={isFavorite ? "#E54872" : DARK}
            />
          </TouchableOpacity>
        </View>

        {/* MAIN CONTENT */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View
            style={[
              styles.mainContent,
              isTablet && styles.tabletContent,
            ]}
          >
            {/* PRODUCT IMAGE */}
            <View
              style={[
                styles.imageContainer,
                isTablet && styles.tabletImageContainer,
              ]}
            >
              {images.length > 0 ? (
                <>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.productImageTap}
                    onPress={() => setImageViewerVisible(true)}
                  >
                    <Image
                      key={images[safeActiveImage]}
                      source={{ uri: images[safeActiveImage] }}
                      style={styles.productImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>

                  {images.length > 1 && (
                    <>
                      <TouchableOpacity
                        style={[styles.imageArrow, styles.leftArrow]}
                        onPress={showPreviousImage}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={22}
                          color={DARK}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.imageArrow, styles.rightArrow]}
                        onPress={showNextImage}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={22}
                          color={DARK}
                        />
                      </TouchableOpacity>
                    </>
                  )}

                  <View style={styles.tapToView}>
                    <Ionicons
                      name="expand-outline"
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.tapToViewText}>
                      Tap image to view
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons
                    name="image-outline"
                    size={65}
                    color={PURPLE}
                  />
                  <Text style={styles.imagePlaceholderText}>
                    No product image available
                  </Text>
                </View>
              )}

              <View style={styles.imageCounter}>
                <Ionicons
                  name="images-outline"
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.imageCounterText}>
                  {images.length > 0
                    ? `${safeActiveImage + 1}/${images.length}`
                    : "0/3"}
                </Text>
              </View>
            </View>

            {/* IMAGE THUMBNAILS */}
            {images.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.thumbnailScroll}
                contentContainerStyle={styles.thumbnailContent}
              >
                {images.map((image, index) => (
                  <TouchableOpacity
                    key={`${productId}-image-${index}`}
                    onPress={() => setActiveImage(index)}
                    style={[
                      styles.thumbnail,
                      safeActiveImage === index && styles.thumbnailActive,
                    ]}
                  >
                    <Image
                      source={{ uri: image }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* PRODUCT VIDEO */}
            {videoUri && (
              <View style={styles.videoSection}>
                <View style={styles.videoHeading}>
                  <Ionicons
                    name="videocam-outline"
                    size={21}
                    color={PURPLE}
                  />
                  <Text style={styles.sectionTitle}>
                    Product Video
                  </Text>
                </View>

                <View style={styles.videoContainer}>
                  <VideoView
                    player={videoPlayer}
                    style={styles.videoPlayer}
                    nativeControls
                    contentFit="contain"
                  />
                </View>

                <Text style={styles.videoHint}>
                  Watch the video uploaded by the seller.
                </Text>
              </View>
            )}

            {/* PRODUCT INFORMATION */}
            <View style={styles.productInfo}>
              <View style={styles.categoryRow}>
                <Text style={styles.categoryBadge}>
                  {productCategory}
                </Text>

                <View style={styles.conditionBadge}>
                  <Text style={styles.conditionText}>
                    {productCondition}
                  </Text>
                </View>
              </View>

              <Text style={styles.productName}>
                {productName}
              </Text>

              <Text style={styles.productPrice}>
                {formatMoney(productPrice)}
              </Text>

              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={19}
                  color={PURPLE}
                />
                <Text style={styles.locationText}>
                  {productLocation}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* SELLER INFORMATION */}
              <Text style={styles.sectionTitle}>
                Seller Information
              </Text>

              <View style={styles.sellerCard}>
                <View style={styles.sellerAvatar}>
                  {sellerPhoto ? (
                    <Image
                      source={{ uri: sellerPhoto }}
                      style={styles.sellerPhoto}
                    />
                  ) : (
                    <Ionicons
                      name="person"
                      size={30}
                      color={PURPLE}
                    />
                  )}
                </View>

                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>
                    {productSeller}
                  </Text>

                  <View style={styles.sellerRating}>
                    <Ionicons
                      name="star"
                      size={15}
                      color="#F5A623"
                    />
                    <Text style={styles.ratingText}>
                      {product.rating || "New"} rating
                    </Text>
                  </View>

                  <Text style={styles.salesText}>
                    {product.sales || 0} successful sales
                  </Text>
                </View>

                <View style={styles.verifiedIcon}>
                  <Ionicons
                    name="shield-checkmark"
                    size={22}
                    color="#16803D"
                  />
                </View>
              </View>

              <View style={styles.divider} />

              {/* DESCRIPTION */}
              <Text style={styles.sectionTitle}>
                Product Description
              </Text>

              <Text style={styles.description}>
                {productDescription}
              </Text>

              {/* QUANTITY */}
              <View style={styles.quantityCard}>
                <Ionicons
                  name="cube-outline"
                  size={22}
                  color={PURPLE}
                />

                <Text style={styles.quantityText}>
                  Available quantity:{" "}
                  <Text style={styles.quantityValue}>
                    {productQuantity}
                  </Text>
                </Text>
              </View>

              {/* DELIVERY */}
              <View style={styles.deliveryCard}>
                <View style={styles.deliveryIcon}>
                  <Ionicons
                    name="bicycle-outline"
                    size={27}
                    color={PURPLE}
                  />
                </View>

                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryTitle}>
                    CampusMart Delivery
                  </Text>

                  <Text style={styles.deliveryText}>
                    We collect the item from the seller and deliver
                    it to you on campus.
                  </Text>

                  <Text style={styles.deliveryPrice}>
                    Delivery fee: ₦500 per order
                  </Text>
                </View>
              </View>

              {/* SAFETY */}
              <View style={styles.safetyCard}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={23}
                  color="#16803D"
                />

                <View style={styles.safetyInfo}>
                  <Text style={styles.safetyTitle}>
                    Shop with confidence
                  </Text>

                  <Text style={styles.safetyText}>
                    Check your item upon delivery and confirm
                    receipt only when you are satisfied.
                  </Text>
                </View>
              </View>

              {/* REPORT */}
              <TouchableOpacity
                style={styles.reportButton}
                onPress={handleReport}
              >
                <Ionicons
                  name="flag-outline"
                  size={18}
                  color="#DC2626"
                />
                <Text style={styles.reportText}>
                  Report this listing
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* FULL SCREEN IMAGE VIEWER */}
        <Modal
          visible={imageViewerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setImageViewerVisible(false)}
        >
          <View style={styles.imageViewer}>
            <TouchableOpacity
              style={styles.closeImageViewer}
              onPress={() => setImageViewerVisible(false)}
            >
              <Ionicons
                name="close"
                size={30}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {images.length > 0 && (
              <Image
                key={`fullscreen-${images[safeActiveImage]}`}
                source={{ uri: images[safeActiveImage] }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}

            {images.length > 1 && (
              <View style={styles.fullScreenControls}>
                <TouchableOpacity onPress={showPreviousImage}>
                  <Ionicons
                    name="chevron-back-circle"
                    size={42}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <Text style={styles.fullScreenCounter}>
                  {safeActiveImage + 1} / {images.length}
                </Text>

                <TouchableOpacity onPress={showNextImage}>
                  <Ionicons
                    name="chevron-forward-circle"
                    size={42}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Modal>

        {/* FIXED PURCHASE BAR */}
        <View
          style={[
            styles.bottomBar,
            isSmallPhone && styles.smallBottomBar,
          ]}
        >
          <View style={styles.bottomPrice}>
            <Text style={styles.bottomPriceLabel}>
              Price
            </Text>

            <Text
              style={[
                styles.bottomPriceValue,
                isSmallPhone && styles.smallPriceValue,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatMoney(productPrice)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.cartButton,
              isSmallPhone && styles.smallCartButton,
            ]}
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <Ionicons
              name="cart-outline"
              size={22}
              color={PURPLE}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.buyButton,
              isSmallPhone && styles.smallBuyButton,
            ]}
            onPress={handleBuyNow}
            activeOpacity={0.85}
          >
            <Text style={styles.buyButtonText}>
              Buy Now
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  page: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },

  header: {
    minHeight: 62,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: DARK,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 25,
  },

  mainContent: {
    width: "100%",
    alignSelf: "center",
  },

  tabletContent: {
    maxWidth: 850,
  },

  imageContainer: {
    width: "100%",
    aspectRatio: 1.15,
    maxHeight: 390,
    backgroundColor: "#EEE7FF",
    overflow: "hidden",
    position: "relative",
  },

  tabletImageContainer: {
    marginTop: 10,
    width: "100%",
    maxHeight: 440,
    alignSelf: "center",
    borderRadius: 20,
  },

  productImageTap: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: "700",
    color: PURPLE,
    marginTop: 12,
  },

  imageArrow: {
    position: "absolute",
    top: "45%",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  leftArrow: {
    left: 12,
  },

  rightArrow: {
    right: 12,
  },

  tapToView: {
    position: "absolute",
    bottom: 14,
    left: 14,
    backgroundColor: "rgba(27,21,59,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  tapToViewText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  imageCounter: {
    position: "absolute",
    bottom: 14,
    right: 14,
    backgroundColor: "rgba(27,21,59,0.75)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  imageCounterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  thumbnailScroll: {
    marginTop: 12,
    maxHeight: 75,
  },

  thumbnailContent: {
    paddingHorizontal: 16,
  },

  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },

  thumbnailActive: {
    borderColor: PURPLE,
  },

  thumbnailImage: {
    width: "100%",
    height: "100%",
  },

  videoSection: {
    paddingHorizontal: 18,
    marginTop: 25,
  },

  videoHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 13,
  },

  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    maxHeight: 300,
    backgroundColor: "#171326",
    borderRadius: 16,
    overflow: "hidden",
  },

  videoPlayer: {
    width: "100%",
    height: "100%",
  },

  videoHint: {
    fontSize: 12,
    color: "#817991",
    marginTop: 9,
  },

  imageViewer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },

  closeImageViewer: {
    position: "absolute",
    top: 50,
    right: 22,
    zIndex: 10,
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#302A40",
    justifyContent: "center",
    alignItems: "center",
  },

  fullScreenImage: {
    width: "100%",
    height: "80%",
  },

  fullScreenControls: {
    width: "80%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },

  fullScreenCounter: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  productInfo: {
    paddingHorizontal: 18,
    paddingTop: 23,
  },

  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 9,
    marginBottom: 15,
  },

  categoryBadge: {
    backgroundColor: "#EEE7FF",
    color: "#6D28D9",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "800",
  },

  conditionBadge: {
    backgroundColor: "#E2F7EA",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  conditionText: {
    color: "#16803D",
    fontSize: 12,
    fontWeight: "800",
  },

  productName: {
    fontSize: 25,
    fontWeight: "900",
    color: DARK,
    lineHeight: 33,
  },

  productPrice: {
    fontSize: 27,
    fontWeight: "900",
    color: PURPLE,
    marginTop: 12,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 13,
    gap: 7,
  },

  locationText: {
    fontSize: 14,
    color: "#817991",
    flexShrink: 1,
  },

  divider: {
    height: 1,
    backgroundColor: "#E7DFF4",
    marginVertical: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: DARK,
    marginBottom: 15,
  },

  sellerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE8F6",
  },

  sellerAvatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#EEE7FF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  sellerPhoto: {
    width: "100%",
    height: "100%",
  },

  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },

  sellerName: {
    fontSize: 15,
    fontWeight: "800",
    color: DARK,
  },

  sellerRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },

  ratingText: {
    fontSize: 12,
    color: "#817991",
    fontWeight: "700",
  },

  salesText: {
    fontSize: 12,
    color: "#817991",
    marginTop: 5,
  },

  verifiedIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#E2F7EA",
    justifyContent: "center",
    alignItems: "center",
  },

  description: {
    fontSize: 14,
    lineHeight: 23,
    color: "#5E576F",
  },

  quantityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EEE7FF",
    padding: 14,
    borderRadius: 15,
    marginTop: 20,
  },

  quantityText: {
    fontSize: 13,
    color: DARK,
    flexShrink: 1,
  },

  quantityValue: {
    fontWeight: "900",
    color: PURPLE,
  },

  deliveryCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 15,
    marginTop: 25,
    borderWidth: 1,
    borderColor: "#EEE8F6",
  },

  deliveryIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#EEE7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  deliveryInfo: {
    flex: 1,
  },

  deliveryTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: DARK,
  },

  deliveryText: {
    fontSize: 13,
    color: "#817991",
    lineHeight: 20,
    marginTop: 6,
  },

  deliveryPrice: {
    fontSize: 13,
    color: "#6D28D9",
    fontWeight: "800",
    marginTop: 9,
  },

  safetyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#E2F7EA",
    padding: 15,
    borderRadius: 16,
    marginTop: 18,
    gap: 12,
  },

  safetyInfo: {
    flex: 1,
  },

  safetyTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#166534",
  },

  safetyText: {
    fontSize: 13,
    color: "#287747",
    lineHeight: 20,
    marginTop: 5,
  },

  reportButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 22,
    paddingVertical: 14,
  },

  reportText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#DC2626",
  },

  // FIXED PURCHASE BAR
  bottomBar: {
    minHeight: 82,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEE8F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 9,
  },

  bottomPrice: {
    flex: 1,
    minWidth: 0,
  },

  bottomPriceLabel: {
    fontSize: 12,
    color: "#817991",
  },

  bottomPriceValue: {
    fontSize: 17,
    fontWeight: "900",
    color: DARK,
    marginTop: 4,
  },

  cartButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EEE7FF",
    justifyContent: "center",
    alignItems: "center",
  },

  buyButton: {
    flex: 1.2,
    minWidth: 110,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: PURPLE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 10,
  },

  buyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  smallBottomBar: {
    paddingHorizontal: 9,
    gap: 7,
  },

  smallPriceValue: {
    fontSize: 14,
  },

  smallCartButton: {
    width: 44,
    height: 46,
  },

  smallBuyButton: {
    minWidth: 105,
    minHeight: 46,
  },
});
