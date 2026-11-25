import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { createVideoPlayer } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const categories = [
  "Phones & Tablets",
  "Computers",
  "Electronics",
  "Fashion",
  "Shoes",
  "Bags",
  "Books & Study",
  "Beauty & Personal Care",
  "Home & Hostel",
  "Sports & Fitness",
  "Accessories",
  "Others",
];

const conditions = ["Brand New", "Fairly Used", "Used"];

const MAX_PHOTOS = 3;
const MAX_VIDEO_DURATION = 45;

// Read the real video duration when the picker doesn't provide it.
// Keep this duration-checking logic in place.
const getVideoDurationInSeconds = (uri) => {
  return new Promise((resolve) => {
    let finished = false;
    let player = null;
    let loadSubscription = null;
    let statusSubscription = null;

    const finish = (value) => {
      if (finished) return;
      finished = true;

      try {
        loadSubscription && loadSubscription.remove();
        statusSubscription && statusSubscription.remove();
        player && player.release();
      } catch (error) {
        // Ignore cleanup errors.
      }

      resolve(value);
    };

    const tryRead = () => {
      if (player && player.duration > 0) {
        finish(player.duration);
      }
    };

    try {
      player = createVideoPlayer(uri);

      loadSubscription = player.addListener(
        "sourceLoad",
        (payload) => {
          if (payload && payload.duration > 0) {
            finish(payload.duration);
          } else {
            tryRead();
          }
        }
      );

      statusSubscription = player.addListener(
        "statusChange",
        ({ status }) => {
          if (status === "readyToPlay") {
            tryRead();
          }

          if (status === "error") {
            finish(null);
          }
        }
      );

      tryRead();
    } catch (error) {
      finish(null);
    }

    // Stop waiting after 8 seconds.
    setTimeout(() => finish(null), 8000);
  });
};

export default function SellScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmallPhone = width < 380;
  const isDesktop = width >= 768;

  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [location, setLocation] = useState("");
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);

  const numericPrice = Number(price) || 0;

  // Listing fee is 10% of the price, but never more than ₦200.
  const listingFee = Math.min(Math.round(numericPrice * 0.1), 200);

  const formatMoney = (amount) =>
    `₦${Number(amount || 0).toLocaleString("en-NG")}`;

  const pageWidth = Math.min(width, 850);
  const sidePadding = isSmallPhone ? 13 : 18;

  const photoSize = Math.floor(
    (pageWidth - sidePadding * 2 - 36 - 2 - 20) / 3
  );

  // Request photo/video library permission.
  const requestMediaPermission = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow CampusMart to access your photos and videos."
      );

      return false;
    }

    return true;
  };

  // SELECT PRODUCT PHOTOS.
  // Existing maximum of three photos is unchanged.
  const choosePhotos = async () => {
    try {
      if (photos.length >= MAX_PHOTOS) {
        Alert.alert(
          "Photo limit reached",
          `You can add up to ${MAX_PHOTOS} photos.`
        );
        return;
      }

      const permitted = await requestMediaPermission();

      if (!permitted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS - photos.length,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const newPhotos = result.assets.map((asset) => ({
        uri: asset.uri,
      }));

      setPhotos((current) =>
        [...current, ...newPhotos].slice(0, MAX_PHOTOS)
      );
    } catch (error) {
      Alert.alert(
        "Could not open photos",
        "Please try selecting your photos again."
      );
    }
  };

  // SELECT OR REPLACE PRODUCT VIDEO.
  // Keep the existing 45-second limit and duration validation.
  const chooseVideo = async () => {
    try {
      const permitted = await requestMediaPermission();

      if (!permitted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: true,
        videoMaxDuration: MAX_VIDEO_DURATION,
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const selectedVideo = result.assets[0];

      /*
       * Expo usually returns duration in milliseconds.
       * Some Android phones don't provide it, so read
       * the actual duration from the video when necessary.
       */
      let durationInSeconds = null;

      if (
        typeof selectedVideo.duration === "number" &&
        selectedVideo.duration > 0
      ) {
        durationInSeconds = selectedVideo.duration / 1000;
      } else {
        durationInSeconds =
          await getVideoDurationInSeconds(selectedVideo.uri);
      }

      if (durationInSeconds === null) {
        Alert.alert(
          "Could not check video",
          "We could not read the length of this video. Please try another video."
        );
        return;
      }

      if (durationInSeconds > MAX_VIDEO_DURATION + 0.5) {
        Alert.alert(
          "Video too long",
          "Your product video must not exceed 45 seconds."
        );
        return;
      }

      // Store the video only after it passes validation.
      setVideo(selectedVideo);
    } catch (error) {
      Alert.alert(
        "Could not open videos",
        "Please try selecting your video again."
      );
    }
  };

  // REMOVE A PHOTO.
  const removePhoto = (uri) => {
    setPhotos((current) =>
      current.filter((photo) => photo.uri !== uri)
    );
  };

  // REMOVE THE SELECTED VIDEO.
  const removeVideo = () => {
    setVideo(null);
  };

  // VALIDATE THE LISTING AND OPEN PREVIEW.
  const handlePreview = () => {
    if (photos.length === 0) {
      Alert.alert(
        "Add product photos",
        "Please add at least one photo of your item."
      );
      return;
    }

    if (!productName.trim()) {
      Alert.alert(
        "Product name required",
        "Enter your product name."
      );
      return;
    }

    if (numericPrice <= 0) {
      Alert.alert(
        "Invalid price",
        "Enter a valid product price."
      );
      return;
    }

    if (!category) {
      Alert.alert(
        "Category required",
        "Select a product category."
      );
      return;
    }

    if (!condition) {
      Alert.alert(
        "Condition required",
        "Select the product condition."
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        "Description required",
        "Describe your product."
      );
      return;
    }

    if (
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1
    ) {
      Alert.alert(
        "Invalid quantity",
        "Enter a whole-number quantity of at least 1."
      );
      return;
    }

    if (!location.trim()) {
      Alert.alert(
        "Pickup location required",
        "Enter where we can collect the item."
      );
      return;
    }

    navigation.navigate("PreviewListing", {
      productName: productName.trim(),
      price: numericPrice,
      description: description.trim(),
      category,
      condition,
      quantity: String(quantity),
      location: location.trim(),
      photos,
      video,
      listingFee,
    });
  };

  const FieldLabel = ({ children }) => (
    <Text style={styles.label}>{children}</Text>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View
          style={[
            styles.page,
            isDesktop && styles.desktopPage,
          ]}
        >
          {/* HEADER */}
          <View
            style={[
              styles.header,
              isSmallPhone && styles.headerSmall,
              {
                height: 70 + insets.top,
                paddingTop: insets.top,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#24194A"
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              Create listing
            </Text>

            <View style={{ width: 42 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollContent,
              isSmallPhone && styles.scrollContentSmall,
              { paddingBottom: 45 + insets.bottom },
            ]}
          >
            {/* INTRODUCTION */}
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Ionicons
                  name="storefront-outline"
                  size={25}
                  color="#7C3AED"
                />
              </View>

              <Text
                style={[
                  styles.introTitle,
                  isSmallPhone && styles.introTitleSmall,
                ]}
              >
                Sell on CampusMart
              </Text>

              <Text style={styles.introText}>
                Share what you’re selling with students on
                your campus. We’ll help coordinate delivery.
              </Text>

              <View style={styles.progressRow}>
                <View style={styles.progressActive} />
                <View style={styles.progressInactive} />
                <View style={styles.progressInactive} />

                <Text style={styles.progressText}>
                  Item details
                </Text>
              </View>
            </View>

            {/* SECTION 1: PHOTOS AND VIDEO */}
            <View style={styles.card}>
              <View style={styles.sectionHeadingRow}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>1</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>
                    Product photos
                  </Text>
                  <Text style={styles.helperText}>
                    Add clear photos so buyers can inspect your item.
                  </Text>
                </View>

                <Text style={styles.counter}>
                  {photos.length}/{MAX_PHOTOS}
                </Text>
              </View>

              {/* PHOTO UPLOAD TILE */}
              <TouchableOpacity
                style={styles.addPhotoTile}
                onPress={choosePhotos}
                activeOpacity={0.8}
              >
                <View style={styles.uploadIcon}>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={27}
                    color="#7C3AED"
                  />
                </View>

                <Text style={styles.uploadTitle}>
                  {photos.length > 0
                    ? "Add more photos"
                    : "Upload product photos"}
                </Text>

                <Text style={styles.uploadSubtitle}>
                  Choose up to {MAX_PHOTOS} images from your device
                </Text>

                <View style={styles.uploadButton}>
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>
                    Choose photos
                  </Text>
                </View>
              </TouchableOpacity>

              {/* SELECTED PHOTO THUMBNAILS */}
              {photos.length > 0 && (
                <View style={styles.photoGrid}>
                  {photos.map((photo, index) => (
                    <View
                      key={`${photo.uri}-${index}`}
                      style={[
                        styles.photoWrap,
                        {
                          width: photoSize,
                          height: photoSize,
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: photo.uri }}
                        style={styles.photoThumbnail}
                        resizeMode="cover"
                      />

                      {index === 0 && (
                        <View style={styles.coverBadge}>
                          <Text style={styles.coverText}>
                            Cover
                          </Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.removePhoto}
                        onPress={() => removePhoto(photo.uri)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="close"
                          size={16}
                          color="#FFFFFF"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.mediaDivider} />

              {/* VIDEO UPLOAD SECTION */}
              <View style={styles.sectionHeadingRow}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>2</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>
                    Product video
                  </Text>
                  <Text style={styles.helperText}>
                    Show buyers how your item looks or works.
                    Maximum 45 seconds.
                  </Text>
                </View>
              </View>

              {/* VIDEO UPLOAD TILE */}
              {!video ? (
                <TouchableOpacity
                  style={styles.addPhotoTile}
                  onPress={chooseVideo}
                  activeOpacity={0.8}
                >
                  <View style={styles.uploadIcon}>
                    <Ionicons
                      name="videocam-outline"
                      size={28}
                      color="#7C3AED"
                    />
                  </View>

                  <Text style={styles.uploadTitle}>
                    Upload product video
                  </Text>

                  <Text style={styles.uploadSubtitle}>
                    Choose a video from your device
                  </Text>

                  <View style={styles.uploadButton}>
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                    <Text style={styles.uploadButtonText}>
                      Choose video
                    </Text>
                  </View>

                  <Text style={styles.videoLimitText}>
                    Optional • Up to 45 seconds
                  </Text>
                </TouchableOpacity>
              ) : (
                /* VIDEO SELECTED CARD */
                <View style={styles.selectedVideoCard}>
                  <View style={styles.selectedVideoInfo}>
                    <View style={styles.selectedVideoIcon}>
                      <Ionicons
                        name="videocam"
                        size={28}
                        color="#7C3AED"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedVideoTitle}>
                        Video selected
                      </Text>

                      <Text
                        style={styles.selectedVideoName}
                        numberOfLines={2}
                      >
                        {video.fileName || "Product video ready"}
                      </Text>

                      <Text style={styles.videoLimitText}>
                        Duration checked • Maximum 45 seconds
                      </Text>
                    </View>

                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#16A34A"
                    />
                  </View>

                  <View style={styles.videoActions}>
                    <TouchableOpacity
                      style={styles.replaceVideoButton}
                      onPress={chooseVideo}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="refresh-outline"
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text style={styles.replaceVideoText}>
                        Replace video
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.removeVideoButton}
                      onPress={removeVideo}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color="#B42318"
                      />
                      <Text style={styles.removeVideoText}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* SECTION 2: PRODUCT INFORMATION */}
            <View style={styles.card}>
              <View style={styles.sectionHeadingRow}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>3</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>
                    Product information
                  </Text>
                  <Text style={styles.helperText}>
                    Add the details buyers need to make a decision.
                  </Text>
                </View>
              </View>

              <FieldLabel>Product name *</FieldLabel>

              <TextInput
                style={styles.input}
                value={productName}
                onChangeText={setProductName}
                placeholder="e.g. Samsung Galaxy A15"
                placeholderTextColor="#A49CB5"
                maxLength={80}
              />

              <FieldLabel>Category *</FieldLabel>

              <View style={styles.categoryContainer}>
                {categories.map((item) => {
                  const selected = category === item;

                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.categoryChip,
                        selected && styles.categoryChipActive,
                      ]}
                      onPress={() => setCategory(item)}
                      activeOpacity={0.8}
                    >
                      {selected && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color="#FFFFFF"
                          style={{ marginRight: 5 }}
                        />
                      )}

                      <Text
                        style={[
                          styles.categoryChipText,
                          selected && styles.categoryChipTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <FieldLabel>Product description *</FieldLabel>

              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe its features, condition, and any defects..."
                placeholderTextColor="#A49CB5"
                multiline
                textAlignVertical="top"
                maxLength={1000}
              />

              <Text style={styles.characterCount}>
                {description.length}/1000 characters
              </Text>
            </View>

            {/* SECTION 3: PRICE AND CONDITION */}
            <View style={styles.card}>
              <View style={styles.sectionHeadingRow}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>4</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>
                    Price and condition
                  </Text>
                  <Text style={styles.helperText}>
                    Set your selling price and item condition.
                  </Text>
                </View>
              </View>

              <FieldLabel>Selling price (₦) *</FieldLabel>

              <View style={styles.priceInputWrap}>
                <Text style={styles.currency}>₦</Text>

                <TextInput
                  style={styles.priceInput}
                  value={price}
                  onChangeText={(value) =>
                    setPrice(value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="Enter amount"
                  placeholderTextColor="#A49CB5"
                  keyboardType="numeric"
                />
              </View>

              {/* LISTING FEE */}
              <View style={styles.feeBox}>
                <View style={styles.feeRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.feeLabel}>Listing fee</Text>
                    <Text style={styles.feeNote}>
                      10% of the selling price, capped at ₦200
                    </Text>
                  </View>

                  <Text style={styles.feeAmount}>
                    {formatMoney(listingFee)}
                  </Text>
                </View>
              </View>

              <FieldLabel>Product condition *</FieldLabel>

              <View style={styles.conditionRow}>
                {conditions.map((item) => {
                  const selected = condition === item;

                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.conditionButton,
                        selected && styles.conditionButtonActive,
                      ]}
                      onPress={() => setCondition(item)}
                      activeOpacity={0.8}
                    >
                      {selected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={17}
                          color="#7C3AED"
                        />
                      )}

                      <Text
                        style={[
                          styles.conditionText,
                          selected && styles.conditionTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <FieldLabel>Quantity available *</FieldLabel>

              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={(value) =>
                  setQuantity(value.replace(/[^0-9]/g, ""))
                }
                placeholder="1"
                keyboardType="numeric"
                placeholderTextColor="#A49CB5"
              />
            </View>

            {/* SECTION 4: PICKUP DETAILS */}
            <View style={styles.card}>
              <View style={styles.sectionHeadingRow}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>5</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>
                    Pickup details
                  </Text>
                  <Text style={styles.helperText}>
                    Where can our team collect the item?
                  </Text>
                </View>
              </View>

              <FieldLabel>Pickup location *</FieldLabel>

              <View style={styles.locationInput}>
                <Ionicons
                  name="location-outline"
                  size={21}
                  color="#7C3AED"
                />

                <TextInput
                  style={styles.locationTextInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. OOU Main Campus, Ibogun"
                  placeholderTextColor="#A49CB5"
                />
              </View>

              <View style={styles.deliveryNote}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={23}
                  color="#7C3AED"
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryTitle}>
                    CampusMart delivery
                  </Text>

                  <Text style={styles.summaryText}>
                    Our team will coordinate item collection and delivery
                    after an order is placed.
                  </Text>
                </View>
              </View>
            </View>

            {/* LISTING FEE INFORMATION */}
            <View style={styles.feeDisclosure}>
              <Ionicons
                name="information-circle-outline"
                size={19}
                color="#7C3AED"
              />

              <Text style={styles.disclosureText}>
                Review your photos, video, and item details before continuing.
                Your listing will not be published until the required steps
                are completed.
              </Text>
            </View>

            {/* PREVIEW BUTTON */}
            <TouchableOpacity
              style={styles.previewButton}
              onPress={handlePreview}
              activeOpacity={0.85}
            >
              <Text style={styles.previewButtonText}>
                Preview listing
              </Text>

              <Ionicons
                name="arrow-forward"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <Text style={styles.bottomNote}>
              You can inspect your photos and play your video on the preview
              screen before continuing.
            </Text>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ALL STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3FF",
  },

  page: {
    flex: 1,
  },

  desktopPage: {
    width: "100%",
    maxWidth: 850,
    alignSelf: "center",
  },

  header: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7F3FF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE8F6",
  },

  headerSmall: {
    paddingHorizontal: 14,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
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

  scrollContent: {
    padding: 18,
    paddingBottom: 45,
  },

  scrollContentSmall: {
    paddingHorizontal: 13,
    paddingTop: 14,
  },

  hero: {
    marginBottom: 20,
    paddingTop: 8,
  },

  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#EDE5FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  introTitle: {
    fontSize: 27,
    fontWeight: "900",
    color: "#24194A",
    marginBottom: 8,
  },

  introTitleSmall: {
    fontSize: 24,
  },

  introText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#777083",
    maxWidth: 600,
  },

  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
  },

  progressActive: {
    height: 5,
    width: 42,
    borderRadius: 5,
    backgroundColor: "#8B5CF6",
  },

  progressInactive: {
    height: 5,
    width: 22,
    borderRadius: 5,
    backgroundColor: "#DDD4ED",
  },

  progressText: {
    marginLeft: 7,
    fontSize: 12,
    color: "#817991",
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EEE8F6",
  },

  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginBottom: 20,
  },

  sectionNumber: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#EEE7FF",
    justifyContent: "center",
    alignItems: "center",
  },

  sectionNumberText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: "900",
  },

  sectionTitle: {
    color: "#24194A",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },

  helperText: {
    color: "#817991",
    fontSize: 12,
    lineHeight: 18,
  },

  counter: {
    fontSize: 12,
    color: "#7C3AED",
    fontWeight: "800",
  },

  addPhotoTile: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CDBAF8",
    borderRadius: 18,
    backgroundColor: "#FBF9FF",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    minHeight: 190,
  },

  uploadIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: "#EEE7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  uploadTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#332B4D",
    textAlign: "center",
  },

  uploadSubtitle: {
    fontSize: 12,
    color: "#948BA6",
    marginTop: 6,
    textAlign: "center",
  },

  uploadButton: {
    marginTop: 15,
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },

  photoWrap: {
    aspectRatio: 1,
    position: "relative",
  },

  photoThumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    backgroundColor: "#EEE8F6",
  },

  coverBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    backgroundColor: "#24194A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },

  coverText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  removePhoto: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#24194A",
    alignItems: "center",
    justifyContent: "center",
  },

  mediaDivider: {
    height: 1,
    backgroundColor: "#F0EAF8",
    marginVertical: 22,
  },

  videoLimitText: {
    color: "#817991",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 10,
    textAlign: "center",
  },

  selectedVideoCard: {
    backgroundColor: "#FBF9FF",
    borderWidth: 1,
    borderColor: "#DCCDFB",
    borderRadius: 18,
    padding: 14,
  },

  selectedVideoInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  selectedVideoIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: "#EEE7FF",
    alignItems: "center",
    justifyContent: "center",
  },

  selectedVideoTitle: {
    color: "#332B4D",
    fontSize: 14,
    fontWeight: "800",
  },

  selectedVideoName: {
    color: "#817991",
    fontSize: 12,
    marginTop: 5,
  },

  videoActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 17,
  },

  replaceVideoButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 10,
  },

  replaceVideoText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  removeVideoButton: {
    minHeight: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0C7C4",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 13,
  },

  removeVideoText: {
    color: "#B42318",
    fontSize: 12,
    fontWeight: "800",
  },

  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#332B4D",
    marginBottom: 9,
    marginTop: 7,
  },

  input: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7DFF4",
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#1B153B",
    marginBottom: 17,
  },

  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 17,
  },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7DFF4",
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxWidth: "100%",
  },

  categoryChipActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },

  categoryChipText: {
    fontSize: 12,
    color: "#5E576F",
    fontWeight: "600",
    flexShrink: 1,
  },

  categoryChipTextActive: {
    color: "#FFFFFF",
  },

  textArea: {
    minHeight: 125,
    paddingTop: 14,
    marginBottom: 0,
  },

  characterCount: {
    textAlign: "right",
    marginTop: 7,
    marginBottom: 10,
    fontSize: 11,
    color: "#948BA6",
  },

  priceInputWrap: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7DFF4",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 12,
  },

  currency: {
    color: "#7C3AED",
    fontSize: 18,
    fontWeight: "900",
    marginRight: 8,
  },

  priceInput: {
    flex: 1,
    color: "#1B153B",
    fontSize: 18,
    fontWeight: "800",
  },

  feeBox: {
    backgroundColor: "#F4EFFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },

  feeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  feeLabel: {
    color: "#5E4B86",
    fontSize: 13,
    fontWeight: "800",
  },

  feeNote: {
    color: "#81719D",
    fontSize: 11,
    marginTop: 5,
  },

  feeAmount: {
    fontSize: 19,
    color: "#6D28D9",
    fontWeight: "900",
  },

  conditionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  conditionButton: {
    flex: 1,
    minWidth: 100,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7DFF4",
    paddingVertical: 14,
    borderRadius: 13,
  },

  conditionButtonActive: {
    backgroundColor: "#F2EBFF",
    borderColor: "#8B5CF6",
  },

  conditionText: {
    fontSize: 12,
    color: "#5E576F",
    fontWeight: "700",
  },

  conditionTextActive: {
    color: "#6D28D9",
  },

  locationInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7DFF4",
    borderRadius: 14,
    paddingHorizontal: 15,
    minHeight: 54,
  },

  locationTextInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#1B153B",
  },

  deliveryNote: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#F8F5FF",
    borderRadius: 15,
    padding: 15,
    marginTop: 18,
    alignItems: "flex-start",
  },

  summaryTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#332B4D",
    marginBottom: 5,
  },

  summaryText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#817991",
  },

  feeDisclosure: {
    flexDirection: "row",
    gap: 9,
    alignItems: "flex-start",
    marginVertical: 6,
  },

  disclosureText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#817991",
  },

  previewButton: {
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#8B5CF6",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 17,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 4,
  },

  previewButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  bottomNote: {
    textAlign: "center",
    fontSize: 11,
    lineHeight: 17,
    color: "#948BA6",
    marginTop: 12,
  },
});