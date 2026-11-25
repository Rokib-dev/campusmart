import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  secureTextEntry = false,
  icon,
  autoCapitalize = "none",
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] =
    useState(false);

  const hasValue =
    value !== undefined &&
    value !== null &&
    value.length > 0;

  const floating = focused || hasValue;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputFocused,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={focused ? "#8B5CF6" : "#8A829B"}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={floating ? "" : placeholder || ""}
          placeholderTextColor="#A39BAD"
          keyboardType={keyboardType}
          secureTextEntry={
            secureTextEntry && !showPassword
          }
          autoCapitalize={autoCapitalize}
          style={styles.input}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() =>
              setShowPassword(!showPassword)
            }
            style={styles.eye}
          >
            <Ionicons
              name={
                showPassword
                  ? "eye-outline"
                  : "eye-off-outline"
              }
              size={20}
              color="#8A829B"
            />
          </TouchableOpacity>
        )}

        {floating && (
          <View
            pointerEvents="none"
            style={styles.labelBackground}
          >
            <Text
              style={[
                styles.floatingLabel,
                focused && styles.floatingLabelFocused,
              ]}
            >
              {label}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: 18,
  },

  inputContainer: {
    height: 58,
    width: "100%",
    borderWidth: 1.3,
    borderColor: "#D9D1E7",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },

  inputFocused: {
    borderColor: "#8B5CF6",
    borderWidth: 1.8,
  },

  leftIcon: {
    marginLeft: 16,
  },

  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 15,
    color: "#1B153B",
    fontSize: 15,
    outlineStyle: "none",
  },

  eye: {
    paddingHorizontal: 16,
  },

  labelBackground: {
    position: "absolute",
    top: -8,
    left: 13,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 5,
  },

  floatingLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8A829B",
  },

  floatingLabelFocused: {
    color: "#8B5CF6",
  },
});