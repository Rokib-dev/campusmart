
import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AdminLoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    const adminEmail = email.trim().toLowerCase();
    const adminPassword = password.trim();

    if (!adminEmail || !adminPassword) {
      Alert.alert(
        "Missing Information",
        "Please enter your admin email and password."
      );
      return;
    }

    // FRONTEND DEMO ONLY:
    // Real administrator verification will be added with the backend.

    setLoading(true);

    navigation.replace("AdminDashboard", {
      adminEmail: adminEmail,
    });

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#F7F3FF"
        barStyle="dark-content"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 25,
              paddingBottom: insets.bottom + 30,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color="#24194A"
            />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons
                name="shield-checkmark"
                size={38}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.brandName}>CampusMart</Text>
            <Text style={styles.adminLabel}>ADMIN PORTAL</Text>
          </View>

          <View style={styles.headingContainer}>
            <Text style={styles.heading}>
              Welcome Back
            </Text>

            <Text style={styles.description}>
              Sign in to manage your CampusMart marketplace.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Admin Email</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#9187A8"
              />

              <TextInput
                style={styles.input}
                placeholder="Enter admin email"
                placeholderTextColor="#AAA2B9"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>

            <Text style={styles.label}>Password</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#9187A8"
              />

              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#AAA2B9"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
              />

              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    showPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={21}
                  color="#9187A8"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Please wait..." : "Admin Sign In"}
              </Text>

              <Ionicons
                name="arrow-forward"
                size={19}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.securityNote}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#8B5CF6"
            />

            <Text style={styles.securityText}>
              Restricted access. This is a frontend preview.
              Administrator verification will be added before
              the app goes live.
            </Text>
          </View>

          <Text style={styles.footer}>
            CampusMart Administration
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3FF",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 35,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 38,
  },

  logo: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },

  brandName: {
    fontSize: 25,
    fontWeight: "900",
    color: "#24194A",
  },

  adminLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 3,
    color: "#8B5CF6",
    marginTop: 6,
  },

  headingContainer: {
    marginBottom: 30,
  },

  heading: {
    fontSize: 29,
    fontWeight: "900",
    color: "#24194A",
    marginBottom: 9,
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#817991",
  },

  form: {
    marginBottom: 28,
  },

  label: {
    fontSize: 13,
    fontWeight: "800",
    color: "#352A55",
    marginBottom: 10,
    marginTop: 18,
  },

  inputContainer: {
    height: 58,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE3F6",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: "#24194A",
  },

  loginButton: {
    height: 58,
    borderRadius: 17,
    backgroundColor: "#8B5CF6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 32,
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EEE7FF",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },

  securityText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    color: "#665782",
  },

  footer: {
    textAlign: "center",
    fontSize: 11,
    color: "#A39AAF",
    marginTop: 35,
  },
});
