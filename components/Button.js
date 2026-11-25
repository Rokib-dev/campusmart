import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  loading = false,
}) {
  const isOutline = variant === "outline";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={loading}
      style={[
        styles.button,
        isOutline
          ? styles.outlineButton
          : styles.primaryButton,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={isOutline ? "#8B5CF6" : "#FFFFFF"}
        />
      ) : (
        <>
          <Text
            style={[
              styles.text,
              isOutline
                ? styles.outlineText
                : styles.primaryText,
            ]}
          >
            {title}
          </Text>

          {icon && (
            <Ionicons
              name={icon}
              size={19}
              color={
                isOutline
                  ? "#8B5CF6"
                  : "#FFFFFF"
              }
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    width: "100%",
  },

  primaryButton: {
    backgroundColor: "#8B5CF6",
  },

  outlineButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#8B5CF6",
  },

  text: {
    fontSize: 16,
    fontWeight: "700",
  },

  primaryText: {
    color: "#FFFFFF",
  },

  outlineText: {
    color: "#8B5CF6",
  },
});