import React, { memo, useCallback, useMemo, useState } from "react";

import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useWindowDimensions,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import CampusLogo from "../components/CampusLogo";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { useUsers } from "../context/UsersContext";

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const PURPLE = "#8B5CF6";
const DARK = "#1B153B";

const COLORS = {
  background: "#F7F3FF",
  card: "#FFFFFF",
  hero: "#F0E9FF",
  error: "#D9304F",
  subtitle: "#81788F",
  remember: "#766E82",
  checkboxIdle: "#A69CB5",
  backText: "#9B92A8",
  brand: "#B0A6BF",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const COMPACT_HEIGHT_BREAKPOINT = 740;
const NARROW_WIDTH_BREAKPOINT = 360;

const MESSAGES = {
  emailRequired: "Please enter your email address.",
  emailInvalid: "Enter a valid email address.",
  passwordRequired: "Please enter your password.",
  passwordShort: `Your password must contain at least ${MIN_PASSWORD_LENGTH} characters.`,
};

// Config-driven form fields (rendered with .map below).
const FORM_FIELDS = [
  {
    name: "email",
    label: "Email address",
    placeholder: "Enter your email",
    keyboardType: "email-address",
    icon: "mail-outline",
    autoCapitalize: "none",
  },
  {
    name: "password",
    label: "Password",
    placeholder: "Enter your password",
    secureTextEntry: true,
    icon: "lock-closed-outline",
    autoCapitalize: "none",
  },
];

const INITIAL_FORM = { email: "", password: "" };

/* -------------------------------------------------------------------------- */
/*                               PURE HELPERS                                 */
/* -------------------------------------------------------------------------- */

// Validate login form. Returns an errors object (empty = valid).
const validateLoginForm = ({ email, password }) => {
  const errors = {};
  const cleanEmail = email.trim();

  if (!cleanEmail) {
    errors.email = MESSAGES.emailRequired;
  } else if (!EMAIL_REGEX.test(cleanEmail)) {
    errors.email = MESSAGES.emailInvalid;
  }

  if (!password) {
    errors.password = MESSAGES.passwordRequired;
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = MESSAGES.passwordShort;
  }

  return errors;
};

/* -------------------------------------------------------------------------- */
/*                            SMALL MEMOISED PARTS                            */
/* -------------------------------------------------------------------------- */

const ErrorText = memo(function ErrorText({ message }) {
  if (!message) return null;

  return <Text style={styles.errorText}>{message}</Text>;
});

// Input + its error message together.
const FormField = memo(function FormField({
  name,
  value,
  error,
  onChange,
  ...inputProps
}) {
  const handleChangeText = useCallback(
    (text) => onChange(name, text),
    [onChange, name]
  );

  return (
    <>
      <InputField
        {...inputProps}
        value={value}
        onChangeText={handleChangeText}
      />

      <ErrorText message={error} />
    </>
  );
});

// Remember Me and Forgot Password.
const OptionsRow = memo(function OptionsRow({
  rememberMe,
  onToggleRemember,
  onForgotPassword,
}) {
  return (
    <View style={styles.optionsRow}>
      <TouchableOpacity
        style={styles.rememberButton}
        onPress={onToggleRemember}
        activeOpacity={0.7}
      >
        <Ionicons
          name={rememberMe ? "checkbox" : "square-outline"}
          size={19}
          color={rememberMe ? PURPLE : COLORS.checkboxIdle}
        />

        <Text style={styles.rememberText}>Keep me signed in</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onForgotPassword} activeOpacity={0.7}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/*                                   SCREEN                                   */
/* -------------------------------------------------------------------------- */

export default function LoginScreen({ navigation }) {
  const { height, width } = useWindowDimensions();

  const compact = height < COMPACT_HEIGHT_BREAKPOINT;

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const { loginDemo, usersLoading } = useUsers();

  const heroHeight = useMemo(
    () =>
      Math.min(compact ? 155 : 210, height * (compact ? 0.19 : 0.25)),
    [compact, height]
  );

  const screenPadding = useMemo(
    () => ({ paddingHorizontal: width < NARROW_WIDTH_BREAKPOINT ? 15 : 21 }),
    [width]
  );

  // Hidden admin access.
  const handleSecretAdminAccess = useCallback(() => {
    navigation.navigate("AdminLogin");
  }, [navigation]);

  // Update any field and clear its error (one handler for all inputs).
  const handleChange = useCallback((field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));

    setErrors((previous) =>
      previous[field] ? { ...previous, [field]: "" } : previous
    );
  }, []);

  // Validate login form.
  const validateForm = useCallback(() => {
    const newErrors = validateLoginForm(form);

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }, [form]);

  // Student login.
  const handleLogin = useCallback(async () => {
    if (submitting) return;

    if (!validateForm()) return;

    if (usersLoading) {
      Alert.alert(
        "Please wait",
        "CampusMart is loading student accounts. Try again shortly."
      );
      return;
    }

    try {
      setSubmitting(true);

      const student = await loginDemo(form.email);

      Alert.alert(
        "Login Successful",
        `Welcome back, ${student.fullName}!\n\nYour Account ID: ${student.accountId}`,
        [
          {
            text: "Continue to Home",
            onPress: () => navigation.replace("Home"),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error.message || "Unable to log in. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }, [submitting, validateForm, usersLoading, loginDemo, form.email, navigation]);

  // Forgot password.
  const handleForgotPassword = useCallback(() => {
    Alert.alert(
      "Password recovery",
      "Password recovery will be available after CampusMart is connected to an authentication service."
    );
  }, []);

  const handleToggleRemember = useCallback(
    () => setRememberMe((previous) => !previous),
    []
  );

  const goToSignUp = useCallback(
    () => navigation.navigate("SignUp"),
    [navigation]
  );

  const goToWelcome = useCallback(
    () => navigation.replace("Welcome"),
    [navigation]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.screen, screenPadding]}>
        <View style={styles.card}>
          {/* CampusMart Logo */}
          <View style={styles.logoContainer}>
            <CampusLogo onLongPress={handleSecretAdminAccess} />
          </View>

          {/* Login Illustration */}
          <View style={[styles.heroContainer, { height: heroHeight }]}>
            <Image
              source={require("../assets/images/campusmart-login.png")}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          {/* Heading */}
          <Text style={[styles.title, compact && styles.titleCompact]}>
            Welcome Back
          </Text>

          <Text style={styles.subtitle}>
            Sign in to your CampusMart account
          </Text>

          {/* Login Form */}
          <View style={styles.form}>
            {FORM_FIELDS.map((field) => (
              <FormField
                key={field.name}
                {...field}
                value={form[field.name]}
                error={errors[field.name]}
                onChange={handleChange}
              />
            ))}

            <OptionsRow
              rememberMe={rememberMe}
              onToggleRemember={handleToggleRemember}
              onForgotPassword={handleForgotPassword}
            />

            {/* Login Button */}
            <Button
              title={submitting ? "Please wait..." : "Login"}
              onPress={handleLogin}
              icon="arrow-forward"
              loading={submitting}
            />
          </View>

          {/* Sign Up */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account?</Text>

            <TouchableOpacity onPress={goToSignUp} activeOpacity={0.7}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={goToWelcome} style={styles.backButton}>
            <Text style={styles.backText}>Back to Welcome</Text>
          </TouchableOpacity>

          <Text style={styles.brand}>BUY • SELL • CONNECT</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  screen: {
    flex: 1,
    justifyContent: "center",
  },

  card: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: COLORS.card,
    borderRadius: 25,
    paddingHorizontal: 19,
    paddingVertical: 12,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 7,
  },

  heroContainer: {
    width: "100%",
    backgroundColor: COLORS.hero,
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: DARK,
    textAlign: "left",
  },

  titleCompact: {
    fontSize: 25,
  },

  subtitle: {
    fontSize: 13,
    color: COLORS.subtitle,
    marginTop: 5,
    marginBottom: 12,
  },

  form: {
    width: "100%",
  },

  errorText: {
    color: COLORS.error,
    fontSize: 11,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 4,
  },

  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: -3,
    marginBottom: 13,
  },

  rememberButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  rememberText: {
    fontSize: 11,
    color: COLORS.remember,
  },

  forgotText: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: "700",
  },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 19,
  },

  signupText: {
    color: COLORS.subtitle,
    fontSize: 12,
  },

  signupLink: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: "800",
  },

  backButton: {
    alignSelf: "center",
    marginTop: 8,
    padding: 3,
  },

  backText: {
    color: COLORS.backText,
    fontSize: 10,
  },

  brand: {
    marginTop: 7,
    textAlign: "center",
    color: COLORS.brand,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
  },
});