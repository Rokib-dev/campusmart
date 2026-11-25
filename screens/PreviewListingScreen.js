
import React, { useState } from "react";

import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  StatusBar,
  useWindowDimensions,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";

import { useListings } from "../context/ListingsContext";
import { useUsers } from "../context/UsersContext";

// Plays the selected product video
function ProductVideo({ uri }) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = false;
  });

  return (
    <View style={styles.videoPlayerContainer}>
      <VideoView
        style={styles.videoPlayer}
        player={player}
        nativeControls
        contentFit="contain"
        allowsFullscreen
        allowsPictureInPicture={false}
      />
    </View>
  );
}

export default function PreviewListingScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Shared listing functions
  const { addListing } = useListings();

  // Logged-in student information
  const { currentUser } = useUsers();

  const {
    productName = "",
    price = "0",
    description = "",
    category = "",
    condition = "",
    quantity = "1",
    location = "",
    photos = [],
    video = null,
    listingFee,
  } = route.params || {};

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const numericPrice = Number(price) || 0;

  // Listing fee: 10% of price, maximum ₦200
  const calculatedListingFee = Math.min(
    Math.round(numericPrice * 0.1),
    200
  );

  const finalListingFee =
    listingFee !== undefined && listingFee !== null
      ? Number(listingFee)
      : calculatedListingFee;

  const formatMoney = (amount) => {
    return `₦${Number(amount || 0).toLocaleString("en-NG")}`;
  };

  // Open photo viewer
  const openPhoto = (photo, index) => {
    setSelectedPhoto(photo);
    setPhotoIndex(index);
  };

  // Close photo viewer
  const closePhoto = () => {
    setSelectedPhoto(null);
  };

  // Previous photo
  const showPreviousPhoto = () => {
    if (photos.length === 0) return;

    const previousIndex =
      (photoIndex - 1 + photos.length) % photos.length;

    setPhotoIndex(previousIndex);
    setSelectedPhoto(photos[previousIndex]);
  };

  // Next photo
  const showNextPhoto = () => {
    if (photos.length === 0) return;

    const nextIndex = (photoIndex + 1) % photos.length;

    setPhotoIndex(nextIndex);
    setSelectedPhoto(photos[nextIndex]);
  };

  // Save product and return directly to Home
  const handleContinue = () => {
    if (submitting) return;

    if (!productName.trim()) {
      Alert.alert(
        "Missing product name",
        "Please go back and enter your product name."
      );
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      Alert.alert(
        "Invalid price",
        "Please go back and enter a valid product price."
      );
      return;
    }

    if (!photos || photos.length === 0) {
      Alert.alert(
        "Product photo required",
        "Please go back and add at least one product photo."
      );
      return;
    }

    if (!currentUser?.accountId) {
      Alert.alert(
        "Account unavailable",
        "Please log in before submitting a product."
      );
      return;
    }

    try {
      setSubmitting(true);

      // Product information and seller information
      const newListing = {
        name: productName.trim(),
        price: numericPrice,
        description,
        category,
        condition,
        quantity: Number(quantity) || 1,
        location,

        images: photos,
        photos,
        video,

        listingFee: finalListingFee,

        status: "Pending",
        createdAt: new Date().toISOString(),

        // Seller details
        sellerAccountId: currentUser.accountId,
        sellerName: currentUser.fullName,
        sellerEmail: currentUser.email,
        sellerProfilePhoto: currentUser.profilePhoto || null,
      };

      // Save product in ListingsContext
      addListing(newListing);

      setSubmitting(false);

      Alert.alert(
        "Product submitted successfully",
        "Your product has been saved to My Listings. You will now return to the CampusMart Home screen.",
        [
          {
            text: "Continue to Home",
            onPress: () => {
              // Return directly to the existing Home screen
              navigation.popToTop();
            },
          },
        ],
        {
          cancelable: false,
        }
      );
    } catch (error) {
      setSubmitting(false);

      Alert.alert(
        "Submission failed",
        error.message || "Something went wrong. Please try again."
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F7F3FF"
      />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            height: 62 + insets.top,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back to edit listing"
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#24194A"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Preview listing
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 30 + insets.bottom },
        ]}
      >
        {/* PREVIEW NOTICE */}
        <View style={styles.notice}>
          <View style={styles.noticeIcon}>
            <Ionicons
              name="eye-outline"
              size={23}
              color="#7C3AED"
            />
          </View>

          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>
              Review your listing
            </Text>

            <Text style={styles.noticeText}>
              Check your photos, video and item details before
              submitting. You can go back to make changes.
            </Text>
          </View>
        </View>

        {/* PRODUCT PHOTOS */}
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionHeading}>
            Product photos
          </Text>

          <Text style={styles.sectionCount}>
            {photos.length} photo{photos.length === 1 ? "" : "s"}
          </Text>
        </View>

        <View style={styles.photoContainer}>
          {photos.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const nextIndex = Math.round(
                    event.nativeEvent.contentOffset.x /
                      (width - 36)
                  );

                  setPhotoIndex(
                    Math.min(
                      Math.max(nextIndex, 0),
                      photos.length - 1
                    )
                  );
                }}
              >
                {photos.map((photo, index) => (
                  <TouchableOpacity
                    key={`${photo.uri}-${index}`}
                    activeOpacity={0.9}
                    onPress={() => openPhoto(photo, index)}
                  >
                    <Image
                      source={{ uri: photo.uri }}
                      style={[
                        styles.productImage,
                        { width: width - 36 },
                      ]}
                      resizeMode="contain"
                    />

                    <View style={styles.inspectPhotoLabel}>
                      <Ionicons
                        name="expand-outline"
                        size={15}
                        color="#FFFFFF"
                      />

                      <Text style={styles.inspectPhotoText}>
                        Tap to inspect
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {photos.length > 1 && (
                <View style={styles.photoCounter}>
                  <Text style={styles.photoCounterText}>
                    {photoIndex + 1} / {photos.length}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyMedia}>
              <Ionicons
                name="image-outline"
                size={46}
                color="#A49CB5"
              />

              <Text style={styles.emptyMediaTitle}>
                No product photos
              </Text>

              <Text style={styles.emptyMediaText}>
                Go back and add photos of your item.
              </Text>
            </View>
          )}
        </View>

        {photos.length > 0 && (
          <Text style={styles.helperText}>
            Tap a photo to view it in full screen.
          </Text>
        )}

        {/* PHOTO THUMBNAILS */}
        {photos.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailList}
          >
            {photos.map((photo, index) => (
              <TouchableOpacity
                key={`thumbnail-${photo.uri}-${index}`}
                onPress={() => {
                  setPhotoIndex(index);
                }}
                style={[
                  styles.thumbnailWrapper,
                  photoIndex === index &&
                    styles.thumbnailSelected,
                ]}
              >
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* PRODUCT VIDEO */}
        <View style={styles.videoSection}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionHeading}>
              Product video
            </Text>

            <View style={styles.videoLimitBadge}>
              <Text style={styles.videoLimitText}>
                Max 45 seconds
              </Text>
            </View>
          </View>

          {video?.uri ? (
            <>
              <ProductVideo uri={video.uri} />

              <View style={styles.videoReadyRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={19}
                  color="#16A34A"
                />

                <Text style={styles.videoReadyText}>
                  Video selected and ready to preview
                </Text>
              </View>

              <Text style={styles.helperText}>
                Use the video controls to play, pause or view
                the video in full screen.
              </Text>
            </>
          ) : (
            <View style={styles.noVideoCard}>
              <Ionicons
                name="videocam-outline"
                size={34}
                color="#A49CB5"
              />

              <Text style={styles.emptyMediaTitle}>
                No product video
              </Text>

              <Text style={styles.emptyMediaText}>
                You can go back to add a video up to 45 seconds
                long.
              </Text>
            </View>
          )}
        </View>

        {/* PRODUCT INFORMATION */}
        <View style={styles.card}>
          <Text style={styles.category}>
            {category || "Uncategorised"}
          </Text>

          <Text style={styles.productName}>
            {productName || "Product name"}
          </Text>

          <Text style={styles.price}>
            {formatMoney(numericPrice)}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>
            Product description
          </Text>

          <Text style={styles.description}>
            {description || "No description provided."}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>
            Item details
          </Text>

          <DetailRow
            label="Condition"
            value={condition || "Not specified"}
          />

          <DetailRow
            label="Quantity available"
            value={String(quantity || "1")}
          />

          <DetailRow
            label="Category"
            value={category || "Not specified"}
          />

          <DetailRow
            label="Pickup location"
            value={location || "Not specified"}
            last
          />
        </View>

        {/* LISTING FEE */}
        <View style={styles.feeCard}>
          <View style={styles.feeIcon}>
            <Ionicons
              name="receipt-outline"
              size={23}
              color="#7C3AED"
            />
          </View>

          <View style={styles.feeInfo}>
            <Text style={styles.feeTitle}>
              Listing fee
            </Text>

            <Text style={styles.feeDescription}>
              10% of your selling price, capped at ₦200
            </Text>

            <Text style={styles.feeCalculation}>
              {numericPrice >= 2000
                ? "Maximum fee of ₦200 applies"
                : `${formatMoney(numericPrice)} × 10%`}
            </Text>
          </View>

          <Text style={styles.feeAmount}>
            {formatMoney(finalListingFee)}
          </Text>
        </View>

        {/* DELIVERY INFORMATION */}
        <View style={styles.deliveryCard}>
          <View style={styles.deliveryIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={25}
              color="#7C3AED"
            />
          </View>

          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryTitle}>
              CampusMart delivery
            </Text>

            <Text style={styles.deliveryText}>
              Our team will coordinate collection from the
              seller and delivery to the buyer after an order
              is placed.
            </Text>
          </View>
        </View>

        {/* EDIT LISTING */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          disabled={submitting}
        >
          <Ionicons
            name="create-outline"
            size={20}
            color="#7C3AED"
          />

          <Text style={styles.editButtonText}>
            Edit listing
          </Text>
        </TouchableOpacity>

        {/* SUBMIT LISTING */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            submitting && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={submitting}
        >
          <Text style={styles.continueButtonText}>
            {submitting ? "Submitting..." : "Submit Product"}
          </Text>

          <Ionicons
            name="arrow-forward"
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <Text style={styles.bottomNote}>
          Your item will remain pending until the required
          payment and publishing steps are completed.
        </Text>
      </ScrollView>

      {/* FULL-SCREEN PHOTO INSPECTOR */}
      <Modal
        visible={Boolean(selectedPhoto)}
        transparent
        animationType="fade"
        onRequestClose={closePhoto}
        statusBarTranslucent
      >
        <View style={styles.photoModal}>
          <TouchableOpacity
            style={[
              styles.closePhotoButton,
              { top: insets.top + 12 },
            ]}
            onPress={closePhoto}
            accessibilityLabel="Close photo preview"
          >
            <Ionicons
              name="close"
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          {selectedPhoto?.uri && (
            <Image
              source={{ uri: selectedPhoto.uri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}

          {photos.length > 1 && (
            <>
              <TouchableOpacity
                style={styles.previousPhotoButton}
                onPress={showPreviousPhoto}
                accessibilityLabel="Previous photo"
              >
                <Ionicons
                  name="chevron-back"
                  size={27}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextPhotoButton}
                onPress={showNextPhoto}
                accessibilityLabel="Next photo"
              >
                <Ionicons
                  name="chevron-forward"
                  size={27}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.fullScreenCounter}>
            {photos.length > 0 ? photoIndex + 1 : 0} /{" "}
            {photos.length}
          </Text>
        </View>
      </Modal>
    </View>
  );
}

// Reusable product detail row
function DetailRow({ label, value, last = false }) {
  return (
    <View
      style={[
        styles.detailRow,
        last && styles.detailRowLast,
      ]}
    >
      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3FF",
  },

  header: {
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE8F6",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE8F6",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#24194A",
  },

  headerSpacer: {
    width: 42,
  },

  content: {
    padding: 18,
  },

  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#EEE7FF",
    padding: 16,
    borderRadius: 17,
    marginBottom: 22,
  },

  noticeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  noticeContent: {
    flex: 1,
  },

  noticeTitle: {
    color: "#33205E",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 5,
  },

  noticeText: {
    color: "#716487",
    fontSize: 12,
    lineHeight: 19,
  },

  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },

  sectionHeading: {
    color: "#24194A",
    fontSize: 16,
    fontWeight: "800",
  },

  sectionCount: {
    color: "#817991",
    fontSize: 12,
    fontWeight: "600",
  },

  photoContainer: {
    height: 280,
    backgroundColor: "#EAE4F5",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 9,
    position: "relative",
  },

  productImage: {
    height: 280,
    backgroundColor: "#EAE4F5",
  },

  inspectPhotoLabel: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: "rgba(36,25,74,0.82)",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  inspectPhotoText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  photoCounter: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(36,25,74,0.85)",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },

  photoCounterText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  emptyMedia: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },

  emptyMediaTitle: {
    color: "#332B4D",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 10,
    textAlign: "center",
  },

  emptyMediaText: {
    color: "#817991",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    textAlign: "center",
  },

  helperText: {
    color: "#817991",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
    marginBottom: 17,
  },

  thumbnailList: {
    gap: 10,
    paddingBottom: 18,
  },

  thumbnailWrapper: {
    width: 66,
    height: 66,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },

  thumbnailSelected: {
    borderColor: "#7C3AED",
  },

  thumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#EAE4F5",
  },

  videoSection: {
    marginBottom: 20,
  },

  videoLimitBadge: {
    backgroundColor: "#EEE7FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  videoLimitText: {
    color: "#6D28D9",
    fontSize: 11,
    fontWeight: "700",
  },

  videoPlayerContainer: {
    width: "100%",
    height: 230,
    backgroundColor: "#171322",
    borderRadius: 17,
    overflow: "hidden",
  },

  videoPlayer: {
    width: "100%",
    height: "100%",
  },

  videoReadyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 11,
  },

  videoReadyText: {
    color: "#287A43",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },

  noVideoCard: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEE8F6",
    borderRadius: 17,
    padding: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EEE8F6",
  },

  category: {
    color: "#7C3AED",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 8,
  },

  productName: {
    color: "#24194A",
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "900",
  },

  price: {
    color: "#7C3AED",
    fontSize: 25,
    fontWeight: "900",
    marginTop: 10,
  },

  divider: {
    height: 1,
    backgroundColor: "#EEE8F6",
    marginVertical: 18,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#24194A",
    marginBottom: 10,
  },

  description: {
    color: "#716B80",
    fontSize: 14,
    lineHeight: 22,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2EEF8",
  },

  detailRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },

  detailLabel: {
    color: "#817991",
    fontSize: 13,
    flex: 1,
  },

  detailValue: {
    color: "#332B4D",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },

  feeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F0E9FF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  feeIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  feeInfo: {
    flex: 1,
  },

  feeTitle: {
    color: "#33205E",
    fontSize: 14,
    fontWeight: "800",
  },

  feeDescription: {
    color: "#716487",
    fontSize: 12,
    marginTop: 4,
  },

  feeCalculation: {
    color: "#81719D",
    fontSize: 11,
    marginTop: 4,
  },

  feeAmount: {
    color: "#6D28D9",
    fontSize: 19,
    fontWeight: "900",
  },

  deliveryCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: "#EEE8F6",
    marginBottom: 18,
  },

  deliveryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F4EEFF",
    alignItems: "center",
    justifyContent: "center",
  },

  deliveryInfo: {
    flex: 1,
  },

  deliveryTitle: {
    color: "#332B4D",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 5,
  },

  deliveryText: {
    color: "#817991",
    fontSize: 12,
    lineHeight: 19,
  },

  editButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CDBAF8",
    borderRadius: 15,
    marginBottom: 12,
  },

  editButtonText: {
    color: "#7C3AED",
    fontSize: 15,
    fontWeight: "800",
  },

  continueButton: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#8B5CF6",
    borderRadius: 16,
  },

  continueButtonDisabled: {
    opacity: 0.6,
  },

  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  bottomNote: {
    textAlign: "center",
    color: "#948BA6",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 13,
  },

  photoModal: {
    flex: 1,
    backgroundColor: "#100D18",
    alignItems: "center",
    justifyContent: "center",
  },

  closePhotoButton: {
    position: "absolute",
    right: 18,
    zIndex: 2,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#30283E",
    alignItems: "center",
    justifyContent: "center",
  },

  fullScreenImage: {
    width: "100%",
    height: "80%",
  },

  previousPhotoButton: {
    position: "absolute",
    left: 15,
    top: "48%",
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#30283E",
    alignItems: "center",
    justifyContent: "center",
  },

  nextPhotoButton: {
    position: "absolute",
    right: 15,
    top: "48%",
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#30283E",
    alignItems: "center",
    justifyContent: "center",
  },

  fullScreenCounter: {
    position: "absolute",
    bottom: 35,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
