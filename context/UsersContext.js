
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

const UsersContext = createContext(null);

const USERS_STORAGE_KEY = "campusmart_users";
const SESSION_STORAGE_KEY = "campusmart_current_session";
const NOTIFICATIONS_STORAGE_KEY = "campusmart_notifications";

export function UsersProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUserState] = useState(null);
  const [usersLoading, setUsersLoading] = useState(true);

  // Normalize email addresses consistently.
  const normalizeEmail = (email) => {
    return String(email || "").trim().toLowerCase();
  };

  // Load student accounts and restore the previous session.
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const [savedUsers, savedSession] = await Promise.all([
        AsyncStorage.getItem(USERS_STORAGE_KEY),
        AsyncStorage.getItem(SESSION_STORAGE_KEY),
      ]);

      const parsedUsers = savedUsers
        ? JSON.parse(savedUsers)
        : [];

      const safeUsers = Array.isArray(parsedUsers)
        ? parsedUsers
        : [];

      setUsers(safeUsers);

      if (savedSession) {
        const session = JSON.parse(savedSession);

        const student = safeUsers.find(
          (user) =>
            user.accountId === session.accountId &&
            user.status === "Active"
        );

        if (student) {
          setCurrentUserState(student);
        } else {
          await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
          setCurrentUserState(null);
        }
      }
    } catch (error) {
      console.log("Error loading student accounts:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Generate the next account ID.
  const generateAccountId = (existingUsers) => {
    const year = new Date().getFullYear();
    const prefix = `CM-${year}-`;

    const numbers = existingUsers
      .filter((user) =>
        user.accountId?.startsWith(prefix)
      )
      .map((user) =>
        Number(user.accountId.replace(prefix, ""))
      )
      .filter((number) => Number.isFinite(number));

    const nextNumber =
      numbers.length > 0
        ? Math.max(...numbers) + 1
        : 1;

    return `${prefix}${String(nextNumber).padStart(6, "0")}`;
  };

  // Set the currently active student.
  const setCurrentUser = async (student) => {
    if (!student?.accountId) {
      throw new Error("A valid student account is required.");
    }

    if (student.status !== "Active") {
      throw new Error("This student account is not active.");
    }

    await AsyncStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        accountId: student.accountId,
      })
    );

    setCurrentUserState(student);
  };

  // Save a notification for a specific student account.
  const saveNotification = async (notification) => {
    try {
      if (!notification.userAccountId) {
        console.log(
          "Notification was not saved: missing student account ID."
        );
        return false;
      }

      const accountExists = users.some(
        (user) =>
          user.accountId === notification.userAccountId
      );

      if (!accountExists) {
        console.log(
          "Notification was not saved: student account not found."
        );
        return false;
      }

      const savedNotifications =
        await AsyncStorage.getItem(
          NOTIFICATIONS_STORAGE_KEY
        );

      const parsedNotifications = savedNotifications
        ? JSON.parse(savedNotifications)
        : [];

      const existingNotifications = Array.isArray(
        parsedNotifications
      )
        ? parsedNotifications
        : [];

      const updatedNotifications = [
        notification,
        ...existingNotifications,
      ];

      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(updatedNotifications)
      );

      console.log(
        `Notification saved for ${notification.userAccountId}`
      );

      return true;
    } catch (error) {
      console.log("Error saving notification:", error);
      return false;
    }
  };

  // Create a personalized first-time welcome notification.
  const createWelcomeNotification = async (student) => {
    const firstName =
      student.fullName?.trim() || "Student";

    const notification = {
      id: `welcome-${student.accountId}-${Date.now()}`,
      userAccountId: student.accountId,
      userEmail: normalizeEmail(student.email),
      title: "Welcome to CampusMart!",
      message: `Welcome to CampusMart, ${firstName}! We're excited to have you here. Discover amazing products from fellow students, buy what you need, and sell items within your campus community. Welcome aboard!`,
      type: "welcome",
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    await saveNotification(notification);
  };

  // Create a personalized returning-student notification.
  const createWelcomeBackNotification = async (student) => {
    const firstName =
      student.fullName?.trim() || "Student";

    const notification = {
      id: `welcome-back-${student.accountId}-${Date.now()}`,
      userAccountId: student.accountId,
      userEmail: normalizeEmail(student.email),
      title: `Welcome Back, ${firstName}!`,
      message: `It's great to have you back, ${firstName}! Your campus marketplace is waiting for you. Explore new products, discover great deals, and see what's happening on CampusMart.`,
      type: "welcome-back",
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    await saveNotification(notification);
  };

  // Create a notification for a specific registered student.
  const createAccountNotification = async ({
    accountId,
    title,
    message,
    type = "account-update",
  }) => {
    if (!accountId) {
      throw new Error("Student account ID is required.");
    }

    if (!title?.trim() || !message?.trim()) {
      throw new Error("Notification title and message are required.");
    }

    const student = users.find(
      (user) => user.accountId === accountId
    );

    if (!student) {
      throw new Error("Student account was not found.");
    }

    const notification = {
      id: `${type}-${accountId}-${Date.now()}`,
      userAccountId: student.accountId,
      userEmail: normalizeEmail(student.email),
      title: title.trim(),
      message: message.trim(),
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const saved = await saveNotification(notification);

    if (!saved) {
      throw new Error("Could not save the notification.");
    }

    return notification;
  };

  // Register and save a new student profile.
  // A new registration automatically starts a demo session.
  const registerUser = async (userData) => {
    if (usersLoading) {
      throw new Error(
        "Please wait while student accounts are loading."
      );
    }

    const normalizedEmail = normalizeEmail(userData.email);

    if (!normalizedEmail) {
      throw new Error("A valid email address is required.");
    }

    const emailExists = users.some(
      (user) =>
        normalizeEmail(user.email) === normalizedEmail
    );

    if (emailExists) {
      throw new Error(
        "An account with this email address already exists."
      );
    }

    const newUser = {
      accountId: generateAccountId(users),
      fullName: userData.fullName?.trim() || "",
      email: normalizedEmail,
      phone: userData.phone?.trim() || "",
      department: userData.department?.trim() || "",
      level: userData.level?.trim() || "",
      profilePhoto: userData.profilePhoto || null,
      registrationDate: new Date().toISOString(),
      status: "Active",
    };

    const updatedUsers = [...users, newUser];

    await AsyncStorage.setItem(
      USERS_STORAGE_KEY,
      JSON.stringify(updatedUsers)
    );

    setUsers(updatedUsers);

    // Start a session for the newly registered student.
    await setCurrentUser(newUser);

    // Save the welcome notification for this account only.
    await createWelcomeNotification(newUser);

    return newUser;
  };

  // Demo login: find a registered student using their email.
  // This does NOT verify a password.
  const loginDemo = async (email) => {
    if (usersLoading) {
      throw new Error(
        "Please wait while student accounts are loading."
      );
    }

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      throw new Error("Please enter your email address.");
    }

    const student = users.find(
      (user) =>
        normalizeEmail(user.email) === normalizedEmail
    );

    if (!student) {
      throw new Error(
        "No registered student account was found with this email."
      );
    }

    if (student.status !== "Active") {
      throw new Error(
        "Your account is currently suspended. Please contact CampusMart support."
      );
    }

    // Start the correct student's session first.
    await setCurrentUser(student);

    // Save the welcome-back notification for that student.
    await createWelcomeBackNotification(student);

    return student;
  };

  // Log out the current student.
  const logout = async () => {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentUserState(null);
  };

  // Find a student using their account ID.
  const getUserById = (accountId) => {
    return users.find(
      (user) => user.accountId === accountId
    );
  };

  // Find a student using their email.
  const getUserByEmail = (email) => {
    const normalizedEmail = normalizeEmail(email);

    return users.find(
      (user) =>
        normalizeEmail(user.email) === normalizedEmail
    );
  };

  // Update a student's saved information.
  const updateUser = async (accountId, updates) => {
    const safeUpdates = { ...updates };

    // Account IDs must never be changed through profile editing.
    delete safeUpdates.accountId;

    if (safeUpdates.email !== undefined) {
      safeUpdates.email = normalizeEmail(safeUpdates.email);
    }

    const updatedUsers = users.map((user) =>
      user.accountId === accountId
        ? {
            ...user,
            ...safeUpdates,
            accountId: user.accountId,
          }
        : user
    );

    await AsyncStorage.setItem(
      USERS_STORAGE_KEY,
      JSON.stringify(updatedUsers)
    );

    setUsers(updatedUsers);

    // Keep the active session profile up to date.
    const updatedCurrentUser = updatedUsers.find(
      (user) => user.accountId === currentUser?.accountId
    );

    if (updatedCurrentUser) {
      if (updatedCurrentUser.status === "Active") {
        setCurrentUserState(updatedCurrentUser);
      } else {
        await logout();
      }
    }
  };

  // Activate or suspend a student account.
  const setUserStatus = async (accountId, status) => {
    if (!["Active", "Suspended"].includes(status)) {
      throw new Error("Invalid account status.");
    }

    return updateUser(accountId, { status });
  };

  return (
    <UsersContext.Provider
      value={{
        users,
        usersLoading,
        currentUser,
        setCurrentUser,
        registerUser,
        loginDemo,
        logout,
        getUserById,
        getUserByEmail,
        updateUser,
        setUserStatus,
        createAccountNotification,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
}

// Access student account and session functions.
export function useUsers() {
  const context = useContext(UsersContext);

  if (!context) {
    throw new Error(
      "useUsers must be used inside UsersProvider."
    );
  }

  return context;
}
