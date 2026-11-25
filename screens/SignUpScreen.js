
import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import CampusLogo from "../components/CampusLogo";
import InputField from "../components/InputField";
import Button from "../components/Button";

import { useUsers } from "../context/UsersContext";

export default function SignUpScreen({ navigation }) {
  const { registerUser, usersLoading } = useUsers();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [isCreating, setIsCreating] = useState(false);

  // PASSWORD STRENGTH
  const getPasswordStrength = (value) => {
    let score = 0;

    if (value.length >= 8) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    if (!value) {
      return {
        score: 0,
        label: "Enter a password",
        color: "#D9D1E7",
      };
    }

    if (score <= 1) {
      return {
        score,
        label: "Weak",
        color: "#DC3545",
      };
    }

    if (score <= 2) {
      return {
        score,
        label: "Fair",
        color: "#E6A23C",
      };
    }

    if (score === 3) {
      return {
        score,
        label: "Good",
        color: "#6C8FE5",
      };
    }

    return {
      score,
      label: "Strong",
      color: "#239B72",
    };
  };

  const passwordStrength = getPasswordStrength(password);

  // UPDATE FORM FIELDS
  const updateField = (field, value, setter) => {
    setter(value);

    setErrors((previous) => ({
      ...previous,
      [field]: "",
      ...(field === "password"
        ? { confirmPassword: "" }
        : {}),
    }));
  };

  // CHOOSE PROFILE PHOTO
  const chooseProfilePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Photo permission required",
          "Allow CampusMart to access your photo library to choose a profile picture."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (!result.canceled && result.assets?.length > 0) {
        setProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        "Unable to open photos",
        "Please try selecting your profile photo again."
      );
    }
  };

  // VALIDATE FORM
  const validateForm = () => {
    const newErrors = {};

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.replace(/[\s()-]/g, "");
    const cleanDepartment = department.trim();
    const cleanLevel = level.trim();

    if (cleanName.length < 3) {
      newErrors.fullName =
        "Enter your full name (at least 3 characters).";
    }

    if (!cleanEmail) {
      newErrors.email = "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!cleanPhone) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
      newErrors.phone =
        "Enter a valid phone number with 10–15 digits.";
    }

    if (cleanDepartment.length < 2) {
      newErrors.department = "Enter your department.";
    }

    if (!cleanLevel) {
      newErrors.level =
        "Select or enter your current level.";
    } else if (
      !/^(100|200|300|400|500|600)(\s*level)?$/i.test(
        cleanLevel
      )
    ) {
      newErrors.level =
        "Enter a level such as 100 Level, 200 Level or 300 Level.";
    }

    if (!password) {
      newErrors.password = "Create a password.";
    } else if (password.length < 8) {
      newErrors.password =
        "Use at least 8 characters for your password.";
    } else if (
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password)
    ) {
      newErrors.password =
        "Include an uppercase letter, a lowercase letter and a number.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        "Your passwords do not match.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // CREATE AND SAVE STUDENT ACCOUNT
  const handleCreateAccount = async () => {
    if (!validateForm()) {
      return;
    }

    if (isCreating) {
      return;
    }

    if (usersLoading) {
      Alert.alert(
        "Please wait",
        "Student account records are still loading. Try again shortly."
      );
      return;
    }

    try {
      setIsCreating(true);

      const newUser = await registerUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        department: department.trim(),
        level: level.trim(),
        profilePhoto: profilePhoto,
      });

      Alert.alert(
        "Account Created Successfully",
        `Welcome to CampusMart, ${newUser.fullName}!\n\nYour Account ID is:\n${newUser.accountId}\n\nPlease keep this ID for your records.`,
        [
          {
            text: "Continue to Home",
            onPress: () => navigation.replace("Home"),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Registration Failed",
        error.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  // DISPLAY VALIDATION ERRORS
  const renderError = (field) => {
    if (!errors[field]) {
      return null;
    }

    return (
      <Text style={styles.errorText}>
        {errors[field]}
      </Text>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <CampusLogo />

          <Text style={styles.title}>
            Create your account
          </Text>

          <Text style={styles.subtitle}>
            Join students buying and selling on campus.
          </Text>

          <View style={styles.demoNotice}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#7650CF"
            />

            <Text style={styles.demoNoticeText}>
              Your account details will be saved on this device.
            </Text>
          </View>

          {/* PROFILE PHOTO */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={chooseProfilePhoto}
              activeOpacity={0.8}
            >
              {profilePhoto ? (
                <Image
                  source={{ uri: profilePhoto }}
                  style={styles.profilePhoto}
                />
              ) : (
                <Ionicons
                  name="person-outline"
                  size={38}
                  color="#8B5CF6"
                />
              )}

              <View style={styles.cameraBadge}>
                <Ionicons
                  name="camera"
                  size={15}
                  color="#FFFFFF"
                />
              </View>
            </TouchableOpacity>

            <Text style={styles.photoTitle}>
              Profile photo
            </Text>

            <Text style={styles.photoSubtitle}>
              Optional · Choose a clear photo of yourself
            </Text>

            <TouchableOpacity
              onPress={chooseProfilePhoto}
              activeOpacity={0.7}
            >
              <Text style={styles.photoLink}>
                {profilePhoto ? "Change photo" : "Upload photo"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* SIGNUP FORM */}
          <View style={styles.form}>
            <InputField
              label="Full name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={(value) =>
                updateField("fullName", value, setFullName)
              }
              icon="person-outline"
              autoCapitalize="words"
            />
            {renderError("fullName")}

            <InputField
              label="Email address"
              placeholder="Enter your email"
              value={email}
              onChangeText={(value) =>
                updateField("email", value, setEmail)
              }
              keyboardType="email-address"
              icon="mail-outline"
              autoCapitalize="none"
            />
            {renderError("email")}

            <InputField
              label="Phone number"
              placeholder="e.g. 08012345678"
              value={phone}
              onChangeText={(value) =>
                updateField("phone", value, setPhone)
              }
              keyboardType="phone-pad"
              icon="call-outline"
            />
            {renderError("phone")}

            <InputField
              label="Department"
              placeholder="e.g. Industrial Relations"
              value={department}
              onChangeText={(value) =>
                updateField("department", value, setDepartment)
              }
              icon="school-outline"
              autoCapitalize="words"
            />
            {renderError("department")}

            <InputField
              label="Level"
              placeholder="e.g. 100 Level"
              value={level}
              onChangeText={(value) =>
                updateField("level", value, setLevel)
              }
              icon="layers-outline"
              autoCapitalize="words"
            />
            {renderError("level")}

            <InputField
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChangeText={(value) =>
                updateField("password", value, setPassword)
              }
              secureTextEntry
              icon="lock-closed-outline"
              autoCapitalize="none"
            />

            {/* PASSWORD STRENGTH */}
            <View style={styles.strengthSection}>
              <View style={styles.strengthHeader}>
                <Text style={styles.strengthLabel}>
                  Password strength
                </Text>

                <Text
                  style={[
                    styles.strengthValue,
                    { color: passwordStrength.color },
                  ]}
                >
                  {passwordStrength.label}
                </Text>
              </View>

              <View style={styles.strengthTrack}>
                {[1, 2, 3, 4].map((segment) => (
                  <View
                    key={segment}
                    style={[
                      styles.strengthSegment,
                      {
                        backgroundColor:
                          segment <= passwordStrength.score
                            ? passwordStrength.color
                            : "#E9E3F0",
                      },
                    ]}
                  />
                ))}
              </View>

              <Text style={styles.passwordHint}>
                Use at least 8 characters, including uppercase,
                lowercase and a number.
              </Text>
            </View>

            {renderError("password")}

            <InputField
              label="Confirm password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={(value) =>
                updateField(
                  "confirmPassword",
                  value,
                  setConfirmPassword
                )
              }
              secureTextEntry
              icon="shield-checkmark-outline"
              autoCapitalize="none"
            />
            {renderError("confirmPassword")}

            <Button
              title={
                isCreating
                  ? "Creating Account..."
                  : "Create Account"
              }
              onPress={handleCreateAccount}
              icon="arrow-forward"
            />
          </View>

          {/* LOGIN LINK */}
          <View style={styles.loginRow}>
            <Text style={styles.loginQuestion}>
              Already have an account?
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLink}>
                Login
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.brand}>
            BUY • SELL • CONNECT
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3FF",
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingVertical: 30,
  },

  card: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 26,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },

  title: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "800",
    color: "#1B153B",
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 22,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    color: "#81788F",
  },

  demoNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F1EBFF",
    marginBottom: 22,
  },

  demoNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#6243A5",
  },

  photoSection: {
    alignItems: "center",
    marginBottom: 28,
  },

  photoButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#DCCBFF",
    backgroundColor: "#F5F0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  profilePhoto: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },

  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: 1,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#8B5CF6",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  photoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1B153B",
  },

  photoSubtitle: {
    marginTop: 5,
    textAlign: "center",
    fontSize: 12,
    color: "#81788F",
  },

  photoLink: {
    marginTop: 10,
    color: "#8B5CF6",
    fontSize: 13,
    fontWeight: "700",
  },

  form: {
    width: "100%",
  },

  errorText: {
    color: "#D9304F",
    fontSize: 12,
    lineHeight: 17,
    marginTop: -12,
    marginBottom: 15,
    marginLeft: 4,
  },

  strengthSection: {
    marginTop: -8,
    marginBottom: 18,
  },

  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  strengthLabel: {
    fontSize: 12,
    color: "#81788F",
  },

  strengthValue: {
    fontSize: 12,
    fontWeight: "700",
  },

  strengthTrack: {
    flexDirection: "row",
    gap: 5,
  },

  strengthSegment: {
    flex: 1,
    height: 5,
    borderRadius: 5,
  },

  passwordHint: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    color: "#938AA0",
  },

  loginRow: {
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },

  loginQuestion: {
    color: "#81788F",
    fontSize: 13,
  },

  loginLink: {
    color: "#8B5CF6",
    fontSize: 13,
    fontWeight: "700",
  },

  brand: {
    marginTop: 22,
    textAlign: "center",
    color: "#B0A6BF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
});
