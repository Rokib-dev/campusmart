
import React from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  useWindowDimensions,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PURPLE = "#8B5CF6";
const DARK = "#24194A";
const BACKGROUND = "#F7F3FF";

export default function AdminDashboardScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isWideScreen = width >= 700;

  const adminEmail =
    route?.params?.adminEmail || "Admin account";

  // Placeholder statistics until backend integration.
  const dashboardStats = [
    {
      title: "Total Orders",
      value: "0",
      icon: "receipt-outline",
    },
    {
      title: "Registered Users",
      value: "0",
      icon: "people-outline",
    },
    {
      title: "Total Products",
      value: "0",
      icon: "cube-outline",
    },
    {
      title: "Total Revenue",
      value: "₦0",
      icon: "wallet-outline",
    },
  ];

  // Admin management sections.
  const managementItems = [
    {
      id: "orders",
      title: "Manage Orders",
      description: "View orders and update their progress",
      icon: "receipt-outline",
      route: "AdminOrders",
      available: true,
    },
    {
      id: "products",
      title: "Manage Products",
      description: "Review, approve, edit and remove listings",
      icon: "cube-outline",
      route: "AdminProducts",
      available: true,
    },
    {
      id: "users",
      title: "Registered Users",
      description: "View, edit and manage student accounts",
      icon: "people-outline",
      route: "AdminUsers",
      available: true,
    },
    {
      id: "sellers",
      title: "Manage Sellers",
      description: "Review seller accounts and activities",
      icon: "storefront-outline",
      route: "AdminSellers",
      available: true,
    },
    {
      id: "payments",
      title: "Payment Settings",
      description: "Manage business payment settings and seller payouts",
      icon: "card-outline",
      route: "AdminPaymentSettings",
      available: true,
    },
    {
      id: "delivery",
      title: "Delivery Management",
      description: "Manage pickups and customer deliveries",
      icon: "bicycle-outline",
      available: false,
    },
  ];

  // Open management sections.
  const handleManagementPress = (item) => {
    if (!item.available || !item.route) {
      Alert.alert(
        "Coming Soon",
        `${item.title} will be available when this feature is developed.`
      );
      return;
    }

    navigation.navigate(item.route, {
      adminEmail,
    });
  };

  // Admin logout.
  const handleLogout = () => {
    Alert.alert(
      "Admin Logout",
      "Are you sure you want to log out of the admin dashboard?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            navigation.replace("AdminLogin");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={DARK}
        barStyle="light-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 30,
        }}
      >
        {/* HEADER */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 20,
            },
          ]}
        >
          <View style={styles.headerTop}>
            <View style={styles.brandContainer}>
              <Text style={styles.headerLabel}>
                CAMPUSMART
              </Text>

              <Text style={styles.headerTitle}>
                Admin Dashboard
              </Text>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons
                name="log-out-outline"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* ADMIN INFORMATION */}
          <View style={styles.adminInfo}>
            <View style={styles.adminAvatar}>
              <Ionicons
                name="shield-checkmark"
                size={27}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.adminTextContainer}>
              <Text style={styles.welcomeText}>
                Welcome, Administrator
              </Text>

              <Text
                style={styles.adminEmail}
                numberOfLines={1}
              >
                {adminEmail}
              </Text>

              <View style={styles.adminStatus}>
                <View style={styles.onlineDot} />

                <Text style={styles.adminStatusText}>
                  Admin panel
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* MAIN CONTENT */}
        <View
          style={[
            styles.content,
            isWideScreen && styles.wideContent,
          ]}
        >
          {/* OVERVIEW */}
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Overview
            </Text>

            <Text style={styles.sectionSubtitle}>
              CampusMart platform summary
            </Text>
          </View>

          <View style={styles.statsGrid}>
            {dashboardStats.map((stat) => (
              <View
                key={stat.title}
                style={[
                  styles.statCard,
                  isWideScreen && styles.wideStatCard,
                ]}
              >
                <View style={styles.statIcon}>
                  <Ionicons
                    name={stat.icon}
                    size={23}
                    color={PURPLE}
                  />
                </View>

                <Text style={styles.statValue}>
                  {stat.value}
                </Text>

                <Text style={styles.statTitle}>
                  {stat.title}
                </Text>
              </View>
            ))}
          </View>

          {/* MANAGEMENT */}
          <View style={styles.managementHeading}>
            <Text style={styles.sectionTitle}>
              Management
            </Text>

            <Text style={styles.sectionSubtitle}>
              Control and manage marketplace activities
            </Text>
          </View>

          <View style={styles.managementList}>
            {managementItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.managementCard}
                onPress={() => handleManagementPress(item)}
                activeOpacity={0.75}
              >
                <View style={styles.managementIcon}>
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={PURPLE}
                  />
                </View>

                <View style={styles.managementText}>
                  <Text style={styles.managementTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.managementDescription}>
                    {item.description}
                  </Text>

                  {!item.available && (
                    <Text style={styles.comingSoonText}>
                      Coming soon
                    </Text>
                  )}
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={21}
                  color="#A49BB9"
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* ADMIN NOTICE */}
          <View style={styles.noticeCard}>
            <View style={styles.noticeIcon}>
              <Ionicons
                name="information-circle-outline"
                size={23}
                color={PURPLE}
              />
            </View>

            <View style={styles.noticeTextContainer}>
              <Text style={styles.noticeTitle}>
                Admin Information
              </Text>

              <Text style={styles.noticeText}>
                The dashboard statistics are currently placeholders.
                Live users, orders, products, payments and delivery
                activities will be connected through the backend.
              </Text>
            </View>
          </View>

          {/* SECURITY NOTICE */}
          <View style={styles.securityNotice}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#B45309"
            />

            <Text style={styles.securityText}>
              Admin login is currently in frontend demonstration
              mode. Real administrator verification must be
              implemented through the backend before launch.
            </Text>
          </View>

          {/* FOOTER */}
          <Text style={styles.footer}>
            CampusMart Admin Panel
          </Text>

          <Text style={styles.footerVersion}>
            Management Dashboard
          </Text>
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

  // HEADER
  header: {
    backgroundColor: DARK,
    paddingHorizontal: 22,
    paddingBottom: 28,
    borderBottomLeftRadius: 27,
    borderBottomRightRadius: 27,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brandContainer: {
    flex: 1,
  },

  headerLabel: {
    color: "#C4B5FD",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 6,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },

  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ADMIN INFORMATION
  adminInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 27,
    backgroundColor: "rgba(255,255,255,0.09)",
    padding: 15,
    borderRadius: 17,
  },

  adminAvatar: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },

  adminTextContainer: {
    marginLeft: 13,
    flex: 1,
  },

  welcomeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  adminEmail: {
    color: "#D6CFF0",
    fontSize: 12,
    marginTop: 5,
  },

  adminStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#86EFAC",
  },

  adminStatusText: {
    color: "#C4B5FD",
    fontSize: 10,
    fontWeight: "600",
  },

  // CONTENT
  content: {
    paddingHorizontal: 18,
    paddingTop: 25,
  },

  wideContent: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },

  sectionHeading: {
    marginBottom: 16,
  },

  sectionTitle: {
    color: DARK,
    fontSize: 19,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#827A98",
    fontSize: 12,
    marginTop: 5,
  },

  // STATISTICS
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },

  statCard: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#EEE8FA",
    minHeight: 135,
  },

  wideStatCard: {
    width: "23%",
  },

  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#F1EBFF",
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    color: DARK,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 13,
  },

  statTitle: {
    color: "#827A98",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  // MANAGEMENT
  managementHeading: {
    marginTop: 31,
    marginBottom: 15,
  },

  managementList: {
    gap: 11,
  },

  managementCard: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEE8FA",
  },

  managementIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: "#F1EBFF",
    alignItems: "center",
    justifyContent: "center",
  },

  managementText: {
    flex: 1,
    marginLeft: 13,
    marginRight: 8,
  },

  managementTitle: {
    color: DARK,
    fontSize: 14,
    fontWeight: "800",
  },

  managementDescription: {
    color: "#827A98",
    fontSize: 11,
    marginTop: 5,
    lineHeight: 16,
  },

  comingSoonText: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 5,
  },

  // ADMIN NOTICE
  noticeCard: {
    flexDirection: "row",
    backgroundColor: "#F0EAFE",
    borderRadius: 16,
    padding: 15,
    marginTop: 25,
    borderWidth: 1,
    borderColor: "#E4D8FF",
  },

  noticeIcon: {
    marginRight: 10,
    marginTop: 1,
  },

  noticeTextContainer: {
    flex: 1,
  },

  noticeTitle: {
    color: "#5B35A5",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 5,
  },

  noticeText: {
    color: "#6D5A91",
    fontSize: 11,
    lineHeight: 18,
  },

  // SECURITY NOTICE
  securityNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#FFF7E6",
    borderColor: "#FDE5B2",
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    marginTop: 13,
  },

  securityText: {
    flex: 1,
    color: "#925B13",
    fontSize: 11,
    lineHeight: 17,
  },

  // FOOTER
  footer: {
    textAlign: "center",
    color: "#827A98",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 28,
  },

  footerVersion: {
    textAlign: "center",
    color: "#AAA2BA",
    fontSize: 10,
    marginTop: 5,
  },
});
