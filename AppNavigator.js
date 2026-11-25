
import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Authentication screens
import WelcomeScreen from "./screens/WelcomeScreen";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";

// Admin screens
import AdminLoginScreen from "./screens/AdminLoginScreen";
import AdminDashboardScreen from "./screens/AdminDashboardScreen";
import AdminUsersScreen from "./screens/AdminUsersScreen";
import AdminOrdersScreen from "./screens/AdminOrdersScreen";
import AdminProductsScreen from "./screens/AdminProductsScreen";
import AdminSellersScreen from "./screens/AdminSellersScreen";
import AdminPaymentSettingsScreen from "./screens/AdminPaymentSettingsScreen";

// Marketplace screens
import HomeScreen from "./screens/HomeScreen";
import SearchScreen from "./screens/SearchScreen";
import SellScreen from "./screens/SellScreen";
import PreviewListingScreen from "./screens/PreviewListingScreen";

// Order and account screens
import OrdersScreen from "./screens/OrdersScreen";
import CheckoutScreen from "./screens/CheckoutScreen";
import SellerOrdersScreen from "./screens/SellerOrdersScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MyListingsScreen from "./screens/MyListingsScreen";
import SellerBankAccountScreen from "./screens/SellerBankAccountScreen";

// Product screens
import ProductDetailsScreen from "./screens/ProductDetailsScreen";
import CartScreen from "./screens/CartScreen";

// Notifications
import NotificationsScreen from "./screens/NotificationsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] =
    useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const completed = await AsyncStorage.getItem(
        "onboardingCompleted"
      );

      setOnboardingCompleted(completed === "true");
    } catch (error) {
      console.log("Could not check onboarding status:", error);
      setOnboardingCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIcon}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>

        <Text style={styles.loadingTitle}>CampusMart</Text>

        <Text style={styles.loadingText}>
          Preparing your marketplace...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={
          onboardingCompleted ? "Login" : "Welcome"
        }
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: {
            backgroundColor: "#F7F3FF",
          },
        }}
      >
        {/* STUDENT AUTHENTICATION */}

        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
        />

        {/* ADMIN AUTHENTICATION */}

        <Stack.Screen
          name="AdminLogin"
          component={AdminLoginScreen}
        />

        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
        />

        <Stack.Screen
          name="AdminUsers"
          component={AdminUsersScreen}
        />

        <Stack.Screen
          name="AdminOrders"
          component={AdminOrdersScreen}
        />

        <Stack.Screen
          name="AdminProducts"
          component={AdminProductsScreen}
        />

        <Stack.Screen
          name="AdminSellers"
          component={AdminSellersScreen}
        />

        <Stack.Screen
          name="AdminPaymentSettings"
          component={AdminPaymentSettingsScreen}
        />

        {/* MARKETPLACE */}

        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />

        <Stack.Screen
          name="Search"
          component={SearchScreen}
        />

        <Stack.Screen
          name="Sell"
          component={SellScreen}
        />

        <Stack.Screen
          name="PreviewListing"
          component={PreviewListingScreen}
        />

        {/* ORDERS AND CHECKOUT */}

        <Stack.Screen
          name="Orders"
          component={OrdersScreen}
        />

        <Stack.Screen
          name="SellerOrders"
          component={SellerOrdersScreen}
        />

        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
        />

        {/* NOTIFICATIONS */}

        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
        />

        {/* ACCOUNT */}

        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
        />

        <Stack.Screen
          name="MyListings"
          component={MyListingsScreen}
        />

        <Stack.Screen
          name="SellerBankAccount"
          component={SellerBankAccountScreen}
        />

        {/* PRODUCTS AND CART */}

        <Stack.Screen
          name="ProductDetails"
          component={ProductDetailsScreen}
        />

        <Stack.Screen
          name="Cart"
          component={CartScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F7F3FF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#EEE7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  loadingTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#24194A",
    marginBottom: 7,
  },

  loadingText: {
    fontSize: 14,
    color: "#817991",
    textAlign: "center",
  },
});
