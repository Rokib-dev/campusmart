
import React, { useCallback, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { useUsers } from "../context/UsersContext";

const PURPLE = "#8B5CF6";
const DARK = "#1B153B";
const BACKGROUND = "#F7F3FF";
const WHITE = "#FFFFFF";

const NOTIFICATIONS_KEY = "campusmart_notifications";

export default function NotificationsScreen({ navigation }) {
  const { currentUser } = useUsers();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Identify the currently logged-in student.
  const currentAccountId = currentUser?.accountId || "";

  const currentEmail = String(currentUser?.email || "")
    .trim()
    .toLowerCase();

  // Check whether a notification belongs to this student.
  const belongsToCurrentUser = (notification) => {
    if (!currentAccountId) {
      return false;
    }

    // Prefer the unique student account ID.
    if (notification?.userAccountId) {
      return (
        notification.userAccountId === currentAccountId
      );
    }

    // Fallback for older notifications.
    const notificationEmail = String(
      notification?.userEmail || ""
    )
      .trim()
      .toLowerCase();

    return (
      currentEmail !== "" &&
      notificationEmail !== "" &&
      notificationEmail === currentEmail
    );
  };

  // Load only this student's notifications.
  const loadNotifications = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem(
        NOTIFICATIONS_KEY
      );

      const parsedNotifications = savedNotifications
        ? JSON.parse(savedNotifications)
        : [];

      const allNotifications = Array.isArray(parsedNotifications)
        ? parsedNotifications
        : [];

      const myNotifications = allNotifications.filter(
        belongsToCurrentUser
      );

      setNotifications(myNotifications);
    } catch (error) {
      console.log("Error loading notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Reload whenever the screen opens or the account changes.
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadNotifications();
    }, [currentAccountId, currentEmail])
  );

  // Update only the logged-in student's notifications.
  const updateMyNotifications = async (updateFunction) => {
    try {
      const savedNotifications = await AsyncStorage.getItem(
        NOTIFICATIONS_KEY
      );

      const parsedNotifications = savedNotifications
        ? JSON.parse(savedNotifications)
        : [];

      const allNotifications = Array.isArray(parsedNotifications)
        ? parsedNotifications
        : [];

      const myNotifications = allNotifications.filter(
        belongsToCurrentUser
      );

      const otherNotifications = allNotifications.filter(
        (item) => !belongsToCurrentUser(item)
      );

      const updatedMyNotifications = updateFunction(
        myNotifications
      );

      const updatedAllNotifications = [
        ...otherNotifications,
        ...updatedMyNotifications,
      ];

      await AsyncStorage.setItem(
        NOTIFICATIONS_KEY,
        JSON.stringify(updatedAllNotifications)
      );

      setNotifications(updatedMyNotifications);
    } catch (error) {
      console.log("Error updating notifications:", error);

      Alert.alert(
        "Error",
        "Could not save your notification changes."
      );
    }
  };

  // Count unread notifications.
  const unreadCount = notifications.filter(
    (item) => !item.isRead
  ).length;

  // Mark one notification as read.
  const markAsRead = (notificationId) => {
    updateMyNotifications((myNotifications) =>
      myNotifications.map((item) =>
        item.id === notificationId
          ? { ...item, isRead: true }
          : item
      )
    );
  };

  // Mark all notifications belonging to this student as read.
  const markAllAsRead = () => {
    if (unreadCount === 0) return;

    updateMyNotifications((myNotifications) =>
      myNotifications.map((item) => ({
        ...item,
        isRead: true,
      }))
    );
  };

  // Delete one notification.
  const deleteNotification = (notificationId) => {
    Alert.alert(
      "Delete notification",
      "Are you sure you want to delete this notification?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            updateMyNotifications((myNotifications) =>
              myNotifications.filter(
                (item) => item.id !== notificationId
              )
            );
          },
        },
      ]
    );
  };

  // Clear only the current student's notifications.
  const clearAllNotifications = () => {
    if (notifications.length === 0) return;

    Alert.alert(
      "Clear notifications",
      "Are you sure you want to delete all your notifications?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear all",
          style: "destructive",
          onPress: () => {
            updateMyNotifications(() => []);
          },
        },
      ]
    );
  };

  // Format notification date.
  const formatDate = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Choose an icon based on notification type.
  const getNotificationIcon = (type) => {
    switch (type) {
      case "approved":
        return "checkmark-circle-outline";

      case "rejected":
        return "close-circle-outline";

      case "order":
      case "order-placed":
      case "new-order":
        return "receipt-outline";

      case "delivery":
        return "cube-outline";

      case "account":
      case "welcome":
      case "welcome-back":
        return "person-circle-outline";

      default:
        return "notifications-outline";
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.isRead && styles.unreadCard,
      ]}
      activeOpacity={0.85}
      onPress={() => {
        if (!item.isRead) {
          markAsRead(item.id);
        }
      }}
    >
      <View style={styles.notificationIcon}>
        <Ionicons
          name={getNotificationIcon(item.type)}
          size={25}
          color={PURPLE}
        />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.titleRow}>
          <Text style={styles.notificationTitle}>
            {item.title || "Notification"}
          </Text>

          {!item.isRead && (
            <View style={styles.unreadDot} />
          )}
        </View>

        <Text style={styles.notificationMessage}>
          {item.message || ""}
        </Text>

        <Text style={styles.notificationDate}>
          {formatDate(item.createdAt)}
        </Text>

        <View style={styles.cardActions}>
          {!item.isRead && (
            <TouchableOpacity
              onPress={() => markAsRead(item.id)}
            >
              <Text style={styles.actionText}>
                Mark as read
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => deleteNotification(item.id)}
          >
            <Text style={styles.deleteText}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={WHITE}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color={DARK}
          />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Notifications
          </Text>

          <Text style={styles.headerSubtitle}>
            {unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount === 1 ? "" : "s"
                }`
              : "Stay updated with your activity"}
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="notifications-outline"
            size={23}
            color={PURPLE}
          />
        </View>
      </View>

      {/* ACTIONS */}
      {notifications.length > 0 && (
        <View style={styles.topActions}>
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.actionText}>
              Mark all as read
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={clearAllNotifications}>
            <Text style={styles.deleteText}>
              Clear all
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* NOTIFICATION LIST */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyDescription}>
            Loading notifications...
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) =>
            String(item.id || index)
          }
          renderItem={renderNotification}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="notifications-off-outline"
                  size={42}
                  color={PURPLE}
                />
              </View>

              <Text style={styles.emptyTitle}>
                You're all caught up
              </Text>

              <Text style={styles.emptyDescription}>
                You don't have any notifications yet. Updates
                about your products and orders will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  header: {
    backgroundColor: WHITE,
    paddingTop: 55,
    paddingBottom: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 3,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#F5F0FF",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: DARK,
  },

  headerSubtitle: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#F5F0FF",
    alignItems: "center",
    justifyContent: "center",
  },

  topActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 17,
  },

  listContent: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },

  notificationCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    elevation: 1,
  },

  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: PURPLE,
  },

  notificationIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#F3EDFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  notificationContent: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  notificationTitle: {
    color: DARK,
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PURPLE,
    marginLeft: 8,
  },

  notificationMessage: {
    color: "#777",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },

  notificationDate: {
    color: "#AAA",
    fontSize: 10,
    marginTop: 9,
  },

  cardActions: {
    flexDirection: "row",
    gap: 18,
    marginTop: 12,
  },

  actionText: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: "800",
  },

  deleteText: {
    color: "#E5484D",
    fontSize: 11,
    fontWeight: "700",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
    paddingBottom: 70,
  },

  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: "#EEE6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    color: DARK,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyDescription: {
    color: "#999",
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 9,
  },
});
