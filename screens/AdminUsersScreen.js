
import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUsers } from "../context/UsersContext";

export default function AdminUsersScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // Get registered student accounts from UsersContext
  const {
    users: registeredUsers,
    usersLoading,
    updateUser,
    setUserStatus,
  } = useUsers();

  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    level: "",
  });

  const filters = ["All", "Active", "Blocked"];

  // FORMAT REGISTRATION DATE
  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // CONVERT USERSCONTEXT DATA INTO SCREEN FORMAT
  const users = registeredUsers.map((user) => ({
    id: user.accountId,
    accountId: user.accountId,
    name: user.fullName || "",
    email: user.email || "",
    phone: user.phone || "",
    department: user.department || "",
    level: user.level || "",
    date: formatDate(user.registrationDate),
    status: user.status === "Suspended" ? "Blocked" : "Active",
    profilePhoto: user.profilePhoto || null,
  }));

  // SEARCH AND FILTER USERS
  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      user.name.toLowerCase().includes(searchText) ||
      user.email.toLowerCase().includes(searchText) ||
      user.phone.toLowerCase().includes(searchText) ||
      user.department.toLowerCase().includes(searchText) ||
      user.accountId.toLowerCase().includes(searchText);

    const matchesFilter =
      selectedFilter === "All" ||
      user.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  // STATISTICS
  const activeCount = users.filter(
    (user) => user.status === "Active"
  ).length;

  const blockedCount = users.filter(
    (user) => user.status === "Blocked"
  ).length;

  // OPEN STUDENT DETAILS
  const showUserDetails = (user) => {
    setSelectedUser(user);

    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      level: user.level,
    });

    setIsEditing(false);
    setModalVisible(true);
  };

  // START EDITING
  const startEditing = () => {
    if (!selectedUser) return;

    setEditForm({
      name: selectedUser.name,
      email: selectedUser.email,
      phone: selectedUser.phone,
      department: selectedUser.department,
      level: selectedUser.level,
    });

    setIsEditing(true);
  };

  // UPDATE FORM FIELDS
  const updateField = (field, value) => {
    setEditForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // SAVE STUDENT INFORMATION
  const saveChanges = async () => {
    if (!selectedUser || isSaving) return;

    if (
      !editForm.name.trim() ||
      !editForm.email.trim() ||
      !editForm.phone.trim() ||
      !editForm.department.trim() ||
      !editForm.level.trim()
    ) {
      Alert.alert(
        "Missing Information",
        "Please complete all student information fields."
      );
      return;
    }

    const normalizedEmail = editForm.email.trim().toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );
      return;
    }

    // PREVENT DUPLICATE EMAIL ADDRESSES
    const emailAlreadyUsed = registeredUsers.some(
      (user) =>
        user.accountId !== selectedUser.accountId &&
        user.email?.toLowerCase() === normalizedEmail
    );

    if (emailAlreadyUsed) {
      Alert.alert(
        "Email Already Exists",
        "Another student is already registered with this email address."
      );
      return;
    }

    try {
      setIsSaving(true);

      await updateUser(selectedUser.accountId, {
        fullName: editForm.name.trim(),
        email: normalizedEmail,
        phone: editForm.phone.trim(),
        department: editForm.department.trim(),
        level: editForm.level.trim(),
      });

      const updatedUser = {
        ...selectedUser,
        name: editForm.name.trim(),
        email: normalizedEmail,
        phone: editForm.phone.trim(),
        department: editForm.department.trim(),
        level: editForm.level.trim(),
      };

      setSelectedUser(updatedUser);
      setIsEditing(false);

      Alert.alert(
        "Changes Saved",
        "Student information has been updated successfully."
      );
    } catch (error) {
      Alert.alert(
        "Update Failed",
        error.message || "Unable to update student information."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ACTIVATE OR BLOCK STUDENT
  const toggleUserStatus = () => {
    if (!selectedUser) return;

    const newStatus =
      selectedUser.status === "Active" ? "Blocked" : "Active";

    const action =
      newStatus === "Blocked" ? "block" : "activate";

    Alert.alert(
      `${newStatus} Student`,
      `Are you sure you want to ${action} this student's account?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: newStatus === "Blocked" ? "Block" : "Activate",
          style: newStatus === "Blocked" ? "destructive" : "default",

          onPress: async () => {
            try {
              const contextStatus =
                newStatus === "Blocked" ? "Suspended" : "Active";

              await setUserStatus(
                selectedUser.accountId,
                contextStatus
              );

              setSelectedUser((previous) => ({
                ...previous,
                status: newStatus,
              }));

              Alert.alert(
                "Account Updated",
                `Student account is now ${newStatus.toLowerCase()}.`
              );
            } catch (error) {
              Alert.alert(
                "Update Failed",
                error.message || "Unable to update this account."
              );
            }
          },
        },
      ]
    );
  };

  // CLOSE MODAL
  const closeModal = () => {
    setModalVisible(false);
    setIsEditing(false);
    setSelectedUser(null);
  };

  // REUSABLE EDIT FIELD
  const renderEditField = (
    label,
    field,
    placeholder,
    keyboardType = "default"
  ) => (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <TextInput
        style={styles.formInput}
        value={editForm[field]}
        onChangeText={(value) => updateField(field, value)}
        placeholder={placeholder}
        placeholderTextColor="#A69BB9"
        keyboardType={keyboardType}
        autoCapitalize={
          field === "email" ? "none" : "sentences"
        }
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#F7F3FF"
        barStyle="dark-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 30,
        }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#24194A"
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.smallLabel}>
              CAMPUSMART ADMIN
            </Text>

            <Text style={styles.heading}>
              Registered Users
            </Text>

            <Text style={styles.subtitle}>
              View and manage student accounts
            </Text>
          </View>
        </View>

        {/* STATISTICS */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Ionicons
              name="people-outline"
              size={23}
              color="#8B5CF6"
            />

            <Text style={styles.summaryValue}>
              {usersLoading ? "..." : users.length}
            </Text>

            <Text style={styles.summaryLabel}>
              Total Users
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons
              name="checkmark-circle-outline"
              size={23}
              color="#21966B"
            />

            <Text style={styles.summaryValue}>
              {usersLoading ? "..." : activeCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Active
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons
              name="ban-outline"
              size={23}
              color="#E04B59"
            />

            <Text style={styles.summaryValue}>
              {usersLoading ? "..." : blockedCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Blocked
            </Text>
          </View>
        </View>

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={21}
            color="#9187A8"
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search name, email or account ID"
            placeholderTextColor="#A69BB9"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />

          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color="#9187A8"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* FILTERS */}
        <View style={styles.filterContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.activeFilter,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.activeFilterText,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* STUDENT LIST HEADER */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Student Accounts
          </Text>

          <Text style={styles.listCount}>
            {usersLoading ? "Loading..." : `${filteredUsers.length} found`}
          </Text>
        </View>

        {/* STUDENT LIST */}
        {usersLoading ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="hourglass-outline"
              size={38}
              color="#A69BB9"
            />

            <Text style={styles.emptyTitle}>
              Loading student accounts...
            </Text>
          </View>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <TouchableOpacity
              key={user.accountId}
              style={styles.userCard}
              onPress={() => showUserDetails(user)}
              activeOpacity={0.8}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.name}
                </Text>

                <Text style={styles.userEmail}>
                  {user.email}
                </Text>

                <Text style={styles.userDepartment}>
                  {user.department} · {user.level}
                </Text>

                <Text style={styles.registeredDate}>
                  ID: {user.accountId}
                </Text>

                <Text style={styles.registeredDate}>
                  Registered: {user.date}
                </Text>
              </View>

              <View style={styles.userRight}>
                <View
                  style={[
                    styles.statusBadge,
                    user.status === "Active"
                      ? styles.activeBadge
                      : styles.blockedBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      user.status === "Active"
                        ? styles.activeStatusText
                        : styles.blockedStatusText,
                    ]}
                  >
                    {user.status}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color="#A69BB9"
                />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="people-outline"
              size={42}
              color="#A69BB9"
            />

            <Text style={styles.emptyTitle}>
              {users.length === 0
                ? "No registered students yet"
                : "No users found"}
            </Text>

            <Text style={styles.emptyText}>
              {users.length === 0
                ? "Student accounts created through Sign Up will appear here."
                : "Try another search or select a different filter."}
            </Text>
          </View>
        )}

        {/* INFORMATION NOTICE */}
        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color="#8B5CF6"
          />

          <Text style={styles.noticeText}>
            Student accounts are currently saved locally on
            this device. A backend will be needed before
            registrations from other students' devices can
            appear here.
          </Text>
        </View>

        <Text style={styles.footer}>
          CampusMart Administration
        </Text>
      </ScrollView>

      {/* STUDENT DETAILS AND EDIT MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalSmallLabel}>
                  STUDENT ACCOUNT
                </Text>

                <Text style={styles.modalTitle}>
                  {isEditing ? "Edit Student" : "Student Details"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Ionicons
                  name="close"
                  size={23}
                  color="#24194A"
                />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {isEditing ? (
                  <>
                    <View style={styles.editNotice}>
                      <Ionicons
                        name="create-outline"
                        size={20}
                        color="#8B5CF6"
                      />

                      <Text style={styles.editNoticeText}>
                        Update the student's information below.
                      </Text>
                    </View>

                    {renderEditField(
                      "Full Name",
                      "name",
                      "Enter full name"
                    )}

                    {renderEditField(
                      "Email Address",
                      "email",
                      "Enter email address",
                      "email-address"
                    )}

                    {renderEditField(
                      "Phone Number",
                      "phone",
                      "Enter phone number",
                      "phone-pad"
                    )}

                    {renderEditField(
                      "Department",
                      "department",
                      "Enter department"
                    )}

                    {renderEditField(
                      "Academic Level",
                      "level",
                      "Example: 200 Level"
                    )}

                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={saveChanges}
                      disabled={isSaving}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="save-outline"
                        size={19}
                        color="#FFFFFF"
                      />

                      <Text style={styles.saveButtonText}>
                        {isSaving ? "Saving Changes..." : "Save Changes"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setIsEditing(false)}
                      disabled={isSaving}
                    >
                      <Text style={styles.cancelButtonText}>
                        Cancel Editing
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.profileHeader}>
                      <View style={styles.largeAvatar}>
                        <Text style={styles.largeAvatarText}>
                          {selectedUser.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <Text style={styles.profileName}>
                        {selectedUser.name}
                      </Text>

                      <View
                        style={[
                          styles.statusBadge,
                          selectedUser.status === "Active"
                            ? styles.activeBadge
                            : styles.blockedBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            selectedUser.status === "Active"
                              ? styles.activeStatusText
                              : styles.blockedStatusText,
                          ]}
                        >
                          {selectedUser.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailsContainer}>
                      <DetailRow
                        label="CampusMart Account ID"
                        value={selectedUser.accountId}
                        icon="card-outline"
                      />

                      <DetailRow
                        label="Email Address"
                        value={selectedUser.email}
                        icon="mail-outline"
                      />

                      <DetailRow
                        label="Phone Number"
                        value={selectedUser.phone}
                        icon="call-outline"
                      />

                      <DetailRow
                        label="Department"
                        value={selectedUser.department}
                        icon="school-outline"
                      />

                      <DetailRow
                        label="Academic Level"
                        value={selectedUser.level}
                        icon="book-outline"
                      />

                      <DetailRow
                        label="Registration Date"
                        value={selectedUser.date}
                        icon="calendar-outline"
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={startEditing}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="create-outline"
                        size={19}
                        color="#FFFFFF"
                      />

                      <Text style={styles.editButtonText}>
                        Edit Student Information
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusActionButton,
                        selectedUser.status === "Active"
                          ? styles.blockActionButton
                          : styles.activateActionButton,
                      ]}
                      onPress={toggleUserStatus}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={
                          selectedUser.status === "Active"
                            ? "ban-outline"
                            : "checkmark-circle-outline"
                        }
                        size={19}
                        color={
                          selectedUser.status === "Active"
                            ? "#D94B59"
                            : "#21966B"
                        }
                      />

                      <Text
                        style={[
                          styles.statusActionText,
                          selectedUser.status === "Active"
                            ? styles.blockActionText
                            : styles.activateActionText,
                        ]}
                      >
                        {selectedUser.status === "Active"
                          ? "Block Student Account"
                          : "Activate Student Account"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// STUDENT DETAIL ROW
function DetailRow({ label, value, icon }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={19}
          color="#8B5CF6"
        />
      </View>

      <View style={styles.detailTextContainer}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text style={styles.detailValue}>
          {value || "Not provided"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3FF",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 25,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  headerText: {
    flex: 1,
  },

  smallLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "#8B5CF6",
    marginBottom: 5,
  },

  heading: {
    fontSize: 23,
    fontWeight: "900",
    color: "#24194A",
  },

  subtitle: {
    fontSize: 11,
    color: "#817991",
    marginTop: 4,
  },

  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 18,
    justifyContent: "space-between",
    marginBottom: 23,
  },

  summaryCard: {
    width: "31.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 13,
    borderWidth: 1,
    borderColor: "#EEE8F7",
  },

  summaryValue: {
    fontSize: 23,
    fontWeight: "900",
    color: "#24194A",
    marginTop: 9,
  },

  summaryLabel: {
    fontSize: 10,
    color: "#817991",
    marginTop: 3,
  },

  searchContainer: {
    height: 54,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE3F6",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#24194A",
  },

  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 20,
    marginBottom: 23,
  },

  filterButton: {
    paddingHorizontal: 19,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE3F6",
  },

  activeFilter: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },

  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#817991",
  },

  activeFilterText: {
    color: "#FFFFFF",
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 13,
  },

  listTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#24194A",
  },

  listCount: {
    fontSize: 11,
    color: "#817991",
  },

  userCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 13,
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#EEE8F7",
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#EEE7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  avatarText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#8B5CF6",
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 12,
    fontWeight: "900",
    color: "#24194A",
  },

  userEmail: {
    fontSize: 10,
    color: "#817991",
    marginTop: 4,
  },

  userDepartment: {
    fontSize: 10,
    color: "#665782",
    marginTop: 5,
  },

  registeredDate: {
    fontSize: 9,
    color: "#A39AAF",
    marginTop: 5,
  },

  userRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    alignSelf: "stretch",
    paddingVertical: 2,
    marginLeft: 5,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  activeBadge: {
    backgroundColor: "#E2F7ED",
  },

  blockedBadge: {
    backgroundColor: "#FCE8EA",
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },

  activeStatusText: {
    color: "#21966B",
  },

  blockedStatusText: {
    color: "#D94B59",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 45,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#24194A",
    marginTop: 13,
  },

  emptyText: {
    fontSize: 11,
    lineHeight: 18,
    color: "#817991",
    textAlign: "center",
    marginTop: 6,
  },

  notice: {
    marginHorizontal: 20,
    marginTop: 15,
    padding: 15,
    borderRadius: 15,
    backgroundColor: "#EEE7FF",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  noticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 18,
    color: "#665782",
  },

  footer: {
    textAlign: "center",
    fontSize: 11,
    color: "#A39AAF",
    marginTop: 25,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20, 12, 43, 0.55)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#F7F3FF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 21,
    paddingTop: 22,
    paddingBottom: 30,
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  modalSmallLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "#8B5CF6",
    marginBottom: 5,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#24194A",
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  profileHeader: {
    alignItems: "center",
    paddingVertical: 15,
  },

  largeAvatar: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#E8DEFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  largeAvatarText: {
    fontSize: 27,
    fontWeight: "900",
    color: "#8B5CF6",
  },

  profileName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#24194A",
    marginBottom: 10,
  },

  detailsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    paddingHorizontal: 14,
    marginTop: 10,
    marginBottom: 18,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBF7",
  },

  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#F1EBFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  detailTextContainer: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 10,
    color: "#9187A8",
    marginBottom: 4,
  },

  detailValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#24194A",
  },

  editButton: {
    height: 51,
    borderRadius: 14,
    backgroundColor: "#8B5CF6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginBottom: 11,
  },

  editButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  statusActionButton: {
    minHeight: 49,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginBottom: 12,
    borderWidth: 1,
  },

  blockActionButton: {
    backgroundColor: "#FCE8EA",
    borderColor: "#F5D1D5",
  },

  activateActionButton: {
    backgroundColor: "#E2F7ED",
    borderColor: "#C8EEDB",
  },

  statusActionText: {
    fontSize: 12,
    fontWeight: "800",
  },

  blockActionText: {
    color: "#D94B59",
  },

  activateActionText: {
    color: "#21966B",
  },

  editNotice: {
    backgroundColor: "#EEE7FF",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 18,
  },

  editNoticeText: {
    color: "#665782",
    fontSize: 11,
    flex: 1,
  },

  formGroup: {
    marginBottom: 15,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#24194A",
    marginBottom: 7,
  },

  formInput: {
    height: 49,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE3F6",
    borderRadius: 12,
    paddingHorizontal: 13,
    color: "#24194A",
    fontSize: 13,
  },

  saveButton: {
    height: 51,
    borderRadius: 14,
    backgroundColor: "#8B5CF6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 8,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  cancelButton: {
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  cancelButtonText: {
    color: "#817991",
    fontSize: 12,
    fontWeight: "700",
  },
});
