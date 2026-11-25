import React, {
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { useListings } from "../context/ListingsContext";
import { useUsers } from "../context/UsersContext";

const PURPLE = "#8B5CF6";
const DARK = "#1B153B";
const BACKGROUND = "#F5F0FF";

const ORDERS_STORAGE_KEY = "campusmart_orders";

// Safely read saved arrays from AsyncStorage
const readSavedArray = async (key) => {
  try {
    const savedData = await AsyncStorage.getItem(key);

    if (!savedData) return [];

    const parsedData = JSON.parse(savedData);

    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.log(`Error reading ${key}:`, error);
    return [];
  }
};

// Check whether a listing belongs to the current seller
const listingBelongsToSeller = (listing, accountId, email) => {
  if (listing.sellerAccountId) {
    return listing.sellerAccountId === accountId;
  }

  return (
    !!email &&
    listing.sellerEmail?.trim().toLowerCase() === email
  );
};

// Get only the current seller's products from an order
const getSellerOrderItems = (order, accountId, email) => {
  const items = Array.isArray(order.items)
    ? order.items
    : [];

  return items.filter((item) => {
    if (item.sellerAccountId) {
      return item.sellerAccountId === accountId;
    }

    return (
      !!email &&
      item.sellerEmail?.trim().toLowerCase() === email
    );
  });
};

export default function ProfileScreen({ navigation }) {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;
  const isSmallPhone = width < 360;

  // SHARED APP DATA
  const { listings, isLoading: listingsLoading } = useListings();

  const {
    users,
    currentUser,
    updateUser,
    logout: logoutUser,
  } = useUsers();

  const accountId = currentUser?.accountId || "";

  const normalizedEmail =
    currentUser?.email?.trim().toLowerCase() || "";

  // SELLER'S OWN LISTINGS ONLY
  const myListings = listings.filter((item) =>
    listingBelongsToSeller(item, accountId, normalizedEmail)
  );

  const totalListings = myListings.length;

  const activeListings = myListings.filter(
    (item) => item.status?.toLowerCase() === "active"
  ).length;

  const pendingListings = myListings.filter(
    (item) => item.status?.toLowerCase() === "pending"
  ).length;

  const soldListings = myListings.filter(
    (item) => item.status?.toLowerCase() === "sold"
  ).length;

  // STUDENT ACCOUNT DATA
  const user = {
    accountId,
    name: currentUser?.fullName || "CampusMart Student",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    department: currentUser?.department || "",
    level: currentUser?.level || "",
  };

  // SELLER ORDER DATA
  const [allOrders, setAllOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Reload orders whenever the Profile screen is opened
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadOrders = async () => {
        setOrdersLoading(true);

        const savedOrders = await readSavedArray(
          ORDERS_STORAGE_KEY
        );

        if (isActive) {
          setAllOrders(savedOrders);
          setOrdersLoading(false);
        }
      };

      loadOrders();

      return () => {
        isActive = false;
      };
    }, [])
  );

  // Find orders containing this seller's products
  const myOrders = allOrders
    .map((order) => {
      const sellerItems = getSellerOrderItems(
        order,
        accountId,
        normalizedEmail
      );

      if (sellerItems.length === 0) return null;

      return {
        ...order,
        sellerItems,
      };
    })
    .filter(Boolean);

  // Total unique orders received by this seller
  const totalOrders = myOrders.length;

  // Completed orders
  const completedOrders = myOrders.filter(
    (order) =>
      order.status?.toLowerCase() === "delivered"
  );

  const completedSales = completedOrders.length;

  // Orders not yet delivered
  const pendingOrders = myOrders.filter(
    (order) =>
      order.status?.toLowerCase() !== "delivered"
  ).length;

  // Estimated earnings from delivered seller products
  // This applies the planned 10% commission.
  const totalEarnings = completedOrders.reduce(
    (orderTotal, order) => {
      const sellerProductTotal = order.sellerItems.reduce(
        (itemTotal, item) => {
          const price = Number(
            item.price ?? item.unitPrice ?? 0
          );

          const quantity = Number(item.quantity ?? 1);

          return itemTotal + price * quantity;
        },
        0
      );

      return orderTotal + sellerProductTotal * 0.9;
    },
    0
  );

  const formatMoney = (amount) => {
    return `₦${Number(amount || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const dashboardLoading =
    listingsLoading || ordersLoading;

  // PROFILE STATE
  const [photo, setPhoto] = useState(
    currentUser?.profilePhoto || null
  );

  const [editVisible, setEditVisible] = useState(false);
  const [draft, setDraft] = useState(user);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setDraft(user);
    setPhoto(currentUser?.profilePhoto || null);
  }, [currentUser]);

  // NAVIGATION
  const navigateTo = (screen) => {
    const state = navigation?.getState?.();

    if (state?.routeNames?.includes(screen)) {
      navigation.navigate(screen);
      return;
    }

    const parent = navigation?.getParent?.();
    const parentState = parent?.getState?.();

    if (parentState?.routeNames?.includes(screen)) {
      parent.navigate(screen);
      return;
    }

    Alert.alert(
      "Coming soon",
      `${screen} has not been added to the app yet.`
    );
  };

  // OPEN EDIT PROFILE
  const openEditProfile = () => {
    setDraft({ ...user });
    setPhoto(currentUser?.profilePhoto || null);
    setErrors({});
    setEditVisible(true);
  };

  // UPDATE PROFILE INPUT
  const updateDraft = (field, value) => {
    setDraft((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  // CHOOSE PROFILE PHOTO
  const choosePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Photo permission required",
          "Allow CampusMart to access your photo library."
        );

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        "Unable to open photos",
        "Please try selecting your profile picture again."
      );
    }
  };

  // SAVE PROFILE
  const saveProfile = async () => {
    const nextErrors = {};

    if (draft.name.trim().length < 3) {
      nextErrors.name = "Enter your full name.";
    }

    const nextEmail = draft.email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (draft.phone.trim()) {
      const phone = draft.phone.replace(/[\s()-]/g, "");

      if (!/^\+?\d{10,15}$/.test(phone)) {
        nextErrors.phone = "Enter a valid phone number.";
      }
    }

    if (!draft.department.trim()) {
      nextErrors.department = "Enter your department.";
    }

    if (
      !/^(100|200|300|400|500|600)(\s*Level)?$/i.test(
        draft.level.trim()
      )
    ) {
      nextErrors.level = "Enter a level such as 200 Level.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (!currentUser?.accountId) {
      Alert.alert(
        "Account unavailable",
        "Please log in to update your profile."
      );

      return;
    }

    const emailAlreadyUsed = users.some(
      (student) =>
        student.accountId !== currentUser.accountId &&
        student.email?.toLowerCase() === nextEmail
    );

    if (emailAlreadyUsed) {
      setErrors({
        email: "This email address is already registered.",
      });

      return;
    }

    try {
      await updateUser(currentUser.accountId, {
        fullName: draft.name.trim(),
        email: nextEmail,
        phone: draft.phone.trim(),
        department: draft.department.trim(),
        level: draft.level.trim(),
        profilePhoto: photo,
      });

      setEditVisible(false);

      Alert.alert(
        "Profile updated",
        "Your student information has been saved successfully."
      );
    } catch (error) {
      Alert.alert(
        "Update failed",
        error.message || "Unable to save your profile."
      );
    }
  };

  // LOGOUT
  const confirmLogout = () => {
    Alert.alert(
      "Log out",
      "Are you sure you want to leave CampusMart?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logoutUser();
              navigation.replace("Login");
            } catch (error) {
              Alert.alert(
                "Logout failed",
                "Unable to log out. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  // ACCOUNT MENU
  const menuItems = [
    {
      title: "My Listings",
      subtitle: "Manage products you are selling",
      icon: "pricetag-outline",
      action: () => navigateTo("MyListings"),
    },
    {
      title: "My Orders",
      subtitle: "View and track your purchases",
      icon: "receipt-outline",
      action: () => navigateTo("Orders"),
    },
    {
      title: "My Sales",
      subtitle: "View orders containing your products",
      icon: "cash-outline",
      action: () => navigateTo("SellerOrders"),
    },
    {
      title: "Bank Account Settings",
      subtitle: "Manage your seller payout details",
      icon: "card-outline",
      action: () => navigateTo("SellerBankAccount"),
    },
    {
      title: "Saved Items",
      subtitle: "Products you have saved",
      icon: "heart-outline",
      action: () => navigateTo("Home"),
    },
    {
      title: "Reviews & Ratings",
      subtitle: "View your seller ratings",
      icon: "star-outline",
      action: () =>
        Alert.alert(
          "Reviews & Ratings",
          "Seller reviews will be available when the marketplace backend is connected."
        ),
    },
  ];

  const renderError = (field) => {
    if (!errors[field]) return null;

    return (
      <Text style={styles.errorText}>
        {errors[field]}
      </Text>
    );
  };

  const renderEditField = (
    field,
    label,
    placeholder,
    options = {}
  ) => (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <TextInput
        value={draft[field]}
        onChangeText={(value) => updateDraft(field, value)}
        placeholder={placeholder}
        placeholderTextColor="#A39BAD"
        keyboardType={options.keyboardType || "default"}
        autoCapitalize={options.autoCapitalize || "sentences"}
        style={[
          styles.editInput,
          errors[field] && styles.inputError,
        ]}
      />

      {renderError(field)}
    </View>
  );

  const renderMenuItem = (item, index, total) => (
    <TouchableOpacity
      key={item.title}
      style={[
        styles.menuItem,
        index !== total - 1 && styles.menuBorder,
      ]}
      onPress={item.action}
      activeOpacity={0.7}
    >
      <View style={styles.menuIcon}>
        <Ionicons
          name={item.icon}
          size={23}
          color={PURPLE}
        />
      </View>

      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#9CA3AF"
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.container,
            isSmallPhone && styles.containerSmall,
            isDesktop && styles.desktopContainer,
          ]}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigateTo("Home");
                  }
                }}
                accessibilityLabel="Go back"
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color={DARK}
                />
              </TouchableOpacity>

              <Text
                style={[
                  styles.headerTitle,
                  isSmallPhone && styles.headerTitleSmall,
                ]}
              >
                My Profile
              </Text>
            </View>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigateTo("Settings")}
              accessibilityLabel="Settings"
            >
              <Ionicons
                name="settings-outline"
                size={23}
                color={DARK}
              />
            </TouchableOpacity>
          </View>

          {/* PROFILE CARD */}
          <View
            style={[
              styles.profileCard,
              isSmallPhone && styles.profileCardSmall,
            ]}
          >
            <View style={styles.avatarWrapper}>
              {photo ? (
                <Image
                  source={{ uri: photo }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons
                    name="person"
                    size={48}
                    color={PURPLE}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.cameraButton}
                onPress={openEditProfile}
                accessibilityLabel="Edit profile"
              >
                <Ionicons
                  name="create-outline"
                  size={17}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>

            {!!user.accountId && (
              <Text style={styles.accountId}>
                Account ID: {user.accountId}
              </Text>
            )}

            {!!user.phone && (
              <View style={styles.contactRow}>
                <Ionicons
                  name="call-outline"
                  size={15}
                  color="#827894"
                />
                <Text style={styles.contactText}>{user.phone}</Text>
              </View>
            )}

            <View style={styles.studentInfo}>
              {!!user.department && (
                <View style={styles.infoBadge}>
                  <Ionicons
                    name="school-outline"
                    size={15}
                    color={PURPLE}
                  />
                  <Text style={styles.infoText}>
                    {user.department}
                  </Text>
                </View>
              )}

              {!!user.level && (
                <View style={styles.infoBadge}>
                  <Ionicons
                    name="book-outline"
                    size={15}
                    color={PURPLE}
                  />
                  <Text style={styles.infoText}>
                    {user.level}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={openEditProfile}
              activeOpacity={0.8}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.editButtonText}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>

          {/* MY ACTIVITY */}
          <Text style={styles.sectionTitle}>My Activity</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons
                name="pricetags-outline"
                size={24}
                color={PURPLE}
              />
              <Text style={styles.statNumber}>
                {dashboardLoading ? "..." : totalListings}
              </Text>
              <Text style={styles.statLabel}>Listings</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons
                name="bag-check-outline"
                size={24}
                color={PURPLE}
              />
              <Text style={styles.statNumber}>
                {dashboardLoading ? "..." : completedSales}
              </Text>
              <Text style={styles.statLabel}>Completed Orders</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons
                name="star-outline"
                size={24}
                color={PURPLE}
              />
              <Text style={styles.statNumber}>0.0</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* MY STORE */}
          <View style={styles.storeHeading}>
            <View style={styles.storeHeadingText}>
              <Text style={styles.sectionTitle}>My Store</Text>
              <Text style={styles.storeSubtitle}>
                Your products, orders and estimated earnings.
              </Text>
            </View>

            <View style={styles.storeIcon}>
              <Ionicons
                name="storefront-outline"
                size={24}
                color={PURPLE}
              />
            </View>
          </View>

          <View style={styles.storeCard}>
            {/* LISTING AND ORDER STATISTICS */}
            <View style={styles.storeStatsGrid}>
              <View style={styles.storeMetric}>
                <Text style={styles.storeNumber}>
                  {dashboardLoading ? "..." : totalListings}
                </Text>
                <Text style={styles.storeLabel}>
                  Total Listings
                </Text>
              </View>

              <View style={styles.storeMetric}>
                <Text style={styles.storeNumber}>
                  {dashboardLoading ? "..." : activeListings}
                </Text>
                <Text style={styles.storeLabel}>
                  Active Listings
                </Text>
              </View>

              <View style={styles.storeMetric}>
                <Text style={styles.storeNumber}>
                  {dashboardLoading ? "..." : pendingListings}
                </Text>
                <Text style={styles.storeLabel}>
                  Pending Listings
                </Text>
              </View>

              <View style={styles.storeMetric}>
                <Text style={styles.storeNumber}>
                  {dashboardLoading ? "..." : soldListings}
                </Text>
                <Text style={styles.storeLabel}>
                  Sold Listings
                </Text>
              </View>

              <View style={styles.storeMetric}>
                <Text style={styles.storeNumber}>
                  {dashboardLoading ? "..." : totalOrders}
                </Text>
                <Text style={styles.storeLabel}>
                  Orders Received
                </Text>
              </View>

              <View style={styles.storeMetric}>
                <Text style={styles.storeNumber}>
                  {dashboardLoading ? "..." : pendingOrders}
                </Text>
                <Text style={styles.storeLabel}>
                  Pending Orders
                </Text>
              </View>
            </View>

            <View style={styles.storeEarnings}>
              <View style={styles.earningsInfo}>
                <Text style={styles.earningsLabel}>
                  Estimated Total Earnings
                </Text>

                <Text style={styles.earningsAmount}>
                  {dashboardLoading
                    ? "Calculating..."
                    : formatMoney(totalEarnings)}
                </Text>

                <Text style={styles.demoNote}>
                  Based on delivered orders after the planned 10% commission.
                </Text>
              </View>

              <Ionicons
                name="wallet-outline"
                size={29}
                color={PURPLE}
              />
            </View>

            <TouchableOpacity
              style={styles.storePrimaryButton}
              onPress={() => navigateTo("Sell")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.storePrimaryButtonText}>
                Add New Product
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.storeSecondaryButton}
              onPress={() => navigateTo("MyListings")}
              activeOpacity={0.8}
            >
              <Text style={styles.storeSecondaryButtonText}>
                Manage My Listings
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={PURPLE}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.storeSecondaryButton}
              onPress={() => navigateTo("SellerOrders")}
              activeOpacity={0.8}
            >
              <Text style={styles.storeSecondaryButtonText}>
                View My Sales
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={PURPLE}
              />
            </TouchableOpacity>
          </View>

          {/* ACCOUNT MENU */}
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.menuCard}>
            {menuItems.map((item, index) =>
              renderMenuItem(item, index, menuItems.length)
            )}
          </View>

          {/* SUPPORT */}
          <Text style={styles.sectionTitle}>Support</Text>

          <View style={styles.menuCard}>
            {renderMenuItem(
              {
                title: "Help & Support",
                subtitle: "Get help with your account",
                icon: "help-circle-outline",
                action: () => navigateTo("Help"),
              },
              0,
              3
            )}

            {renderMenuItem(
              {
                title: "Settings",
                subtitle: "Account and app preferences",
                icon: "settings-outline",
                action: () => navigateTo("Settings"),
              },
              1,
              3
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={confirmLogout}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, styles.logoutIcon]}>
                <Ionicons
                  name="log-out-outline"
                  size={23}
                  color="#EF4444"
                />
              </View>

              <View style={styles.menuTextContainer}>
                <Text style={styles.logoutTitle}>Log Out</Text>
                <Text style={styles.menuSubtitle}>
                  Sign out of your account
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {/* HIDDEN ADMIN ACCESS */}
          <Pressable
            onLongPress={() => navigateTo("AdminLogin")}
            delayLongPress={1500}
            hitSlop={20}
            style={styles.hiddenAdminAccess}
            accessibilityLabel="CampusMart footer"
          >
            <Text style={styles.footer}>
              CampusMart{"\n"}
              Your Campus. Your Marketplace.
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={editVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[
              styles.modalCard,
              isDesktop && styles.modalCardDesktop,
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Edit Profile
                </Text>
                <Text style={styles.modalSubtitle}>
                  Update your student details
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditVisible(false)}
              >
                <Ionicons
                  name="close"
                  size={23}
                  color={DARK}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity
                style={styles.photoPicker}
                onPress={choosePhoto}
              >
                {photo ? (
                  <Image
                    source={{ uri: photo }}
                    style={styles.modalAvatar}
                  />
                ) : (
                  <View style={styles.modalAvatarPlaceholder}>
                    <Ionicons
                      name="camera-outline"
                      size={26}
                      color={PURPLE}
                    />
                  </View>
                )}

                <View>
                  <Text style={styles.photoPickerTitle}>
                    Change profile photo
                  </Text>
                  <Text style={styles.photoPickerSubtitle}>
                    Choose a photo from your device
                  </Text>
                </View>
              </TouchableOpacity>

              {renderEditField(
                "name",
                "Full name",
                "Enter your full name"
              )}

              {renderEditField(
                "email",
                "Email address",
                "Enter your email",
                {
                  keyboardType: "email-address",
                  autoCapitalize: "none",
                }
              )}

              {renderEditField(
                "phone",
                "Phone number",
                "Enter your phone number",
                { keyboardType: "phone-pad" }
              )}

              {renderEditField(
                "department",
                "Department",
                "Enter your department"
              )}

              {renderEditField(
                "level",
                "Level",
                "e.g. 200 Level"
              )}

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveProfile}
                activeOpacity={0.8}
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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    paddingBottom: 35,
  },
  container: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  containerSmall: {
    paddingHorizontal: 14,
  },
  desktopContainer: {
    maxWidth: 700,
    paddingHorizontal: 35,
    paddingTop: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginRight: 12,
  },
  headerButton: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flexShrink: 1,
    fontSize: 25,
    fontWeight: "800",
    color: DARK,
  },
  headerTitleSmall: {
    fontSize: 22,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 25,
    alignItems: "center",
    marginBottom: 28,
  },
  profileCardSmall: {
    padding: 18,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 15,
  },
  avatar: {
    width: 95,
    height: 95,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: "#EDE5FF",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    position: "absolute",
    right: -2,
    bottom: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PURPLE,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: DARK,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 14,
    color: "#888399",
    marginTop: 6,
    textAlign: "center",
  },
  accountId: {
    fontSize: 12,
    fontWeight: "700",
    color: PURPLE,
    marginTop: 7,
    textAlign: "center",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  contactText: {
    color: "#827894",
    fontSize: 13,
  },
  studentInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 18,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BACKGROUND,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
    maxWidth: "100%",
  },
  infoText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#6D28D9",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PURPLE,
    paddingVertical: 13,
    paddingHorizontal: 25,
    borderRadius: 14,
    marginTop: 22,
    gap: 8,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: DARK,
    marginBottom: 14,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 3,
    alignItems: "center",
    gap: 7,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: DARK,
  },
  statLabel: {
    fontSize: 11,
    color: "#888399",
    fontWeight: "600",
    textAlign: "center",
  },
  storeHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  storeHeadingText: {
    flex: 1,
  },
  storeSubtitle: {
    fontSize: 12,
    color: "#888399",
    marginTop: -8,
    marginBottom: 12,
  },
  storeIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#EDE5FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  storeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
  },
  storeStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE9F5",
    paddingBottom: 15,
  },
  storeMetric: {
    width: "33.33%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 3,
  },
  storeNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: DARK,
  },
  storeLabel: {
    fontSize: 10,
    color: "#888399",
    textAlign: "center",
    marginTop: 5,
  },
  storeEarnings: {
    backgroundColor: BACKGROUND,
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  earningsInfo: {
    flex: 1,
    paddingRight: 10,
  },
  earningsLabel: {
    color: "#777087",
    fontSize: 12,
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: DARK,
    marginTop: 4,
  },
  demoNote: {
    fontSize: 10,
    lineHeight: 15,
    color: "#888399",
    marginTop: 4,
  },
  storePrimaryButton: {
    minHeight: 50,
    backgroundColor: PURPLE,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  storePrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  storeSecondaryButton: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EDF5",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
  },
  storeSecondaryButtonText: {
    color: DARK,
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 1,
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    gap: 12,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0EDF5",
  },
  menuIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: BACKGROUND,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutIcon: {
    backgroundColor: "#FEF2F2",
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: DARK,
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#9994A8",
    marginTop: 5,
  },
  logoutTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#EF4444",
  },
  hiddenAdminAccess: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 20,
    color: "#9994A8",
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(27, 21, 59, 0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    width: "100%",
    maxHeight: "92%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 30,
  },
  modalCardDesktop: {
    maxWidth: 560,
    alignSelf: "center",
    borderRadius: 26,
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  modalTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: DARK,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#888399",
    marginTop: 5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E8E0F4",
    borderRadius: 16,
    marginBottom: 22,
  },
  modalAvatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
  },
  modalAvatarPlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#EDE5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPickerTitle: {
    color: DARK,
    fontSize: 14,
    fontWeight: "700",
  },
  photoPickerSubtitle: {
    color: "#888399",
    fontSize: 12,
    marginTop: 5,
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: DARK,
    marginBottom: 8,
  },
  editInput: {
    height: 52,
    borderWidth: 1.2,
    borderColor: "#D9D1E7",
    borderRadius: 13,
    paddingHorizontal: 14,
    color: DARK,
    fontSize: 15,
    backgroundColor: "#FFFFFF",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 5,
  },
  saveButton: {
    height: 53,
    backgroundColor: PURPLE,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  cancelButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    color: "#6D28D9",
    fontSize: 14,
    fontWeight: "700",
  },
});