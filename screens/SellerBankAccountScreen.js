
import React, { useState, useEffect } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Crypto from "expo-crypto";

import { useUsers } from "../context/UsersContext";

const PURPLE = "#8B5CF6";
const DARK = "#1B153B";
const BACKGROUND = "#F7F3FF";

export default function SellerBankAccountScreen({ navigation }) {
  const { currentUser, updateUser } = useUsers();

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const [saving, setSaving] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const [passcodeModal, setPasscodeModal] = useState(false);
  const [passcodeMode, setPasscodeMode] = useState("");
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [firstPasscode, setFirstPasscode] = useState("");

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [passcodeError, setPasscodeError] = useState("");

  const hasBankAccount = !!currentUser?.bankAccount?.accountNumber;

  const hasSecurityPasscode =
    !!currentUser?.bankSecurity?.passcodeHash &&
    !!currentUser?.bankSecurity?.passcodeSalt;

  // Load the current seller's saved bank details.
  useEffect(() => {
    setBankName(currentUser?.bankAccount?.bankName || "");
    setAccountNumber(
      currentUser?.bankAccount?.accountNumber || ""
    );
    setAccountName(
      currentUser?.bankAccount?.accountName || ""
    );

    setUnlocked(false);
    setFailedAttempts(0);
  }, [currentUser?.accountId]);

  const validateBankDetails = () => {
    if (!bankName.trim()) {
      Alert.alert("Missing Information", "Enter your bank name.");
      return false;
    }

    if (!/^\d{10}$/.test(accountNumber.trim())) {
      Alert.alert(
        "Invalid Account Number",
        "Your account number must contain exactly 10 digits."
      );
      return false;
    }

    if (!accountName.trim()) {
      Alert.alert(
        "Missing Information",
        "Enter the account holder's name."
      );
      return false;
    }

    return true;
  };

  // Generate a random salt and hash the passcode.
  const createPasscodeHash = async (code) => {
    const randomBytes = await Crypto.getRandomBytesAsync(16);

    const salt = Array.from(randomBytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}:${code}`
    );

    return { salt, hash };
  };

  const hashExistingPasscode = async (code, salt) => {
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}:${code}`
    );
  };

  const openPasscodeModal = (mode) => {
    setPasscodeMode(mode);
    setPasscode("");
    setConfirmPasscode("");
    setFirstPasscode("");
    setPasscodeError("");
    setPasscodeModal(true);
  };

  // Save bank details and, if supplied, the new security passcode.
  const saveBankDetails = async (bankSecurity = null) => {
    if (!currentUser?.accountId) {
      Alert.alert(
        "Account Error",
        "Please log in again."
      );
      return;
    }

    try {
      setSaving(true);

      const updates = {
        bankAccount: {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
          updatedAt: new Date().toISOString(),
        },
      };

      if (bankSecurity) {
        updates.bankSecurity = bankSecurity;
      }

      await updateUser(currentUser.accountId, updates);

      setUnlocked(true);
      setPasscodeModal(false);
      setPasscode("");
      setConfirmPasscode("");
      setPasscodeError("");

      Alert.alert(
        "Bank Details Saved",
        "Your bank details have been saved on this device. Real bank verification and payouts are not active yet."
      );
    } catch (error) {
      console.log("Bank account save error:", error);

      Alert.alert(
        "Unable to Save",
        "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // First-time bank setup or change of an existing account.
  const handleSave = () => {
    if (!currentUser?.accountId) {
      Alert.alert(
        "Account Error",
        "Please log in again."
      );
      return;
    }

    if (!validateBankDetails()) return;

    if (!hasSecurityPasscode) {
      openPasscodeModal("create");
      return;
    }

    if (hasBankAccount && !unlocked) {
      openPasscodeModal("verify");
      return;
    }

    saveBankDetails();
  };

  // Start the bank account change process.
  const handleChangeBank = () => {
    if (failedAttempts >= 5) {
      Alert.alert(
        "Editing Locked",
        "You have reached the maximum number of incorrect attempts. Close and reopen this screen to try again."
      );
      return;
    }

    if (hasSecurityPasscode) {
      openPasscodeModal("verify");
    } else {
      openPasscodeModal("create");
    }
  };

  // Create and confirm a new passcode.
  const handleCreatePasscode = async () => {
    if (!/^\d{6}$/.test(passcode)) {
      setPasscodeError("Enter exactly 6 digits.");
      return;
    }

    setFirstPasscode(passcode);
    setPasscode("");
    setPasscodeMode("confirm");
    setPasscodeError("");
  };

  const handleConfirmPasscode = async () => {
    if (!/^\d{6}$/.test(confirmPasscode)) {
      setPasscodeError("Enter exactly 6 digits.");
      return;
    }

    if (confirmPasscode !== firstPasscode) {
      setPasscodeError("The passcodes do not match.");
      setConfirmPasscode("");
      return;
    }

    try {
      setSaving(true);

      const { salt, hash } = await createPasscodeHash(
        firstPasscode
      );

      const securityData = {
        passcodeSalt: salt,
        passcodeHash: hash,
        createdAt: new Date().toISOString(),
      };

      // First-time bank setup: save both together.
      if (!hasBankAccount) {
        await saveBankDetails(securityData);
      } else {
        // Existing account without a passcode:
        // create its passcode before unlocking changes.
        await updateUser(currentUser.accountId, {
          bankSecurity: securityData,
        });

        setUnlocked(true);
        setPasscodeModal(false);
        setPasscode("");
        setConfirmPasscode("");

        Alert.alert(
          "Passcode Created",
          "Your bank account is now protected by your new passcode. You can update your bank details."
        );
      }
    } catch (error) {
      console.log("Passcode creation error:", error);

      Alert.alert(
        "Unable to Create Passcode",
        "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Verify the existing passcode before allowing changes.
  const handleVerifyPasscode = async () => {
    if (!/^\d{6}$/.test(passcode)) {
      setPasscodeError("Enter your 6-digit passcode.");
      return;
    }

    try {
      setSaving(true);

      const salt = currentUser?.bankSecurity?.passcodeSalt;
      const savedHash = currentUser?.bankSecurity?.passcodeHash;

      const enteredHash = await hashExistingPasscode(
        passcode,
        salt
      );

      if (enteredHash !== savedHash) {
        const nextAttempts = failedAttempts + 1;

        setFailedAttempts(nextAttempts);
        setPasscode("");
        setPasscodeError(
          nextAttempts >= 5
            ? "Maximum attempts reached. Editing is locked."
            : `Incorrect passcode. ${5 - nextAttempts} attempt(s) remaining.`
        );

        return;
      }

      setUnlocked(true);
      setFailedAttempts(0);
      setPasscodeModal(false);
      setPasscode("");
      setPasscodeError("");

      Alert.alert(
        "Passcode Verified",
        "You can now update your bank account details."
      );
    } catch (error) {
      console.log("Passcode verification error:", error);

      setPasscodeError("Unable to verify passcode. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasscodeContinue = () => {
    if (passcodeMode === "create") {
      handleCreatePasscode();
    } else if (passcodeMode === "confirm") {
      handleConfirmPasscode();
    } else if (passcodeMode === "verify") {
      handleVerifyPasscode();
    }
  };

  const closePasscodeModal = () => {
    if (saving) return;

    setPasscodeModal(false);
    setPasscode("");
    setConfirmPasscode("");
    setFirstPasscode("");
    setPasscodeError("");
  };

  const passcodeTitle =
    passcodeMode === "create"
      ? "Create Security Passcode"
      : passcodeMode === "confirm"
      ? "Confirm Your Passcode"
      : "Verify Your Passcode";

  const passcodeDescription =
    passcodeMode === "create"
      ? "Create a 6-digit passcode to protect your seller bank account."
      : passcodeMode === "confirm"
      ? "Enter the same 6-digit passcode again."
      : "Enter your existing passcode to unlock bank account changes.";

  const displayedPasscode =
    passcodeMode === "confirm" ? confirmPasscode : passcode;

  const updatePasscodeInput = (value) => {
    const digits = value.replace(/[^0-9]/g, "").slice(0, 6);

    if (passcodeMode === "confirm") {
      setConfirmPasscode(digits);
    } else {
      setPasscode(digits);
    }

    setPasscodeError("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={23} color={DARK} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Bank Account Settings
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons
              name="wallet-outline"
              size={30}
              color={PURPLE}
            />
          </View>

          <Text style={styles.introTitle}>
            Seller Payout Account
          </Text>

          <Text style={styles.introText}>
            Add the bank account where CampusMart plans to
            send your earnings after an order has been
            delivered and confirmed.
          </Text>
        </View>

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color="#9A6500"
          />

          <Text style={styles.noticeText}>
            Demo mode: Bank details are saved locally on this
            device. Account name verification and real payouts
            are not connected. Do not use real bank details
            until secure backend storage is available.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Bank Information
            </Text>

            {hasBankAccount && (
              <View style={styles.lockBadge}>
                <Ionicons
                  name={unlocked ? "lock-open-outline" : "lock-closed-outline"}
                  size={13}
                  color={unlocked ? "#15803D" : PURPLE}
                />
                <Text style={styles.lockBadgeText}>
                  {unlocked ? "Unlocked" : "Protected"}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.inputLabel}>Bank Name</Text>

          <TextInput
            style={[
              styles.input,
              hasBankAccount && !unlocked && styles.lockedInput,
            ]}
            placeholder="e.g. Access Bank"
            placeholderTextColor="#A49CB5"
            value={bankName}
            onChangeText={setBankName}
            autoCapitalize="words"
            editable={!hasBankAccount || unlocked}
          />

          <Text style={styles.inputLabel}>Account Number</Text>

          <TextInput
            style={[
              styles.input,
              hasBankAccount && !unlocked && styles.lockedInput,
            ]}
            placeholder="Enter 10-digit account number"
            placeholderTextColor="#A49CB5"
            value={accountNumber}
            onChangeText={(value) =>
              setAccountNumber(
                value.replace(/[^0-9]/g, "").slice(0, 10)
              )
            }
            keyboardType="number-pad"
            maxLength={10}
            editable={!hasBankAccount || unlocked}
          />

          <Text style={styles.inputLabel}>
            Account Holder Name
          </Text>

          <TextInput
            style={[
              styles.input,
              hasBankAccount && !unlocked && styles.lockedInput,
            ]}
            placeholder="Enter account holder's name"
            placeholderTextColor="#A49CB5"
            value={accountName}
            onChangeText={setAccountName}
            autoCapitalize="words"
            editable={!hasBankAccount || unlocked}
          />

          {hasBankAccount && !unlocked ? (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleChangeBank}
              activeOpacity={0.85}
              disabled={failedAttempts >= 5}
            >
              <Ionicons
                name="lock-open-outline"
                size={19}
                color="#FFFFFF"
              />

              <Text style={styles.saveButtonText}>
                {failedAttempts >= 5
                  ? "Editing Locked"
                  : "Change Bank Details"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.saveButton,
                saving && styles.disabledButton,
              ]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="save-outline"
                    size={19}
                    color="#FFFFFF"
                  />

                  <Text style={styles.saveButtonText}>
                    Save Bank Details
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.securityCard}>
          <Ionicons
            name="shield-checkmark-outline"
            size={23}
            color={PURPLE}
          />

          <View style={styles.payoutTextContainer}>
            <Text style={styles.payoutTitle}>
              Bank Account Security
            </Text>

            <Text style={styles.payoutDescription}>
              Your 6-digit passcode is required before
              changing an existing bank account. Never share
              your passcode with anyone.
            </Text>
          </View>
        </View>

        <View style={styles.payoutCard}>
          <Ionicons
            name="wallet-outline"
            size={23}
            color={PURPLE}
          />

          <View style={styles.payoutTextContainer}>
            <Text style={styles.payoutTitle}>
              How Seller Payouts Work
            </Text>

            <Text style={styles.payoutDescription}>
              Under the planned arrangement, CampusMart
              deducts its 10% sales commission and pays the
              seller after delivery confirmation. Actual
              payouts are not active yet.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* SECURITY PASSCODE MODAL */}
      <Modal
        visible={passcodeModal}
        transparent
        animationType="fade"
        onRequestClose={closePasscodeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={30}
                color={PURPLE}
              />
            </View>

            <Text style={styles.modalTitle}>
              {passcodeTitle}
            </Text>

            <Text style={styles.modalDescription}>
              {passcodeDescription}
            </Text>

            <Text style={styles.passcodeLabel}>
              {passcodeMode === "confirm"
                ? "Confirm passcode"
                : "6-digit passcode"}
            </Text>

            <TextInput
              style={[
                styles.passcodeInput,
                passcodeError && styles.passcodeInputError,
              ]}
              value={displayedPasscode}
              onChangeText={updatePasscodeInput}
              placeholder="••••••"
              placeholderTextColor="#B8B1C4"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              autoFocus
            />

            {!!passcodeError && (
              <Text style={styles.passcodeError}>
                {passcodeError}
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.modalContinueButton,
                saving && styles.disabledButton,
              ]}
              onPress={handlePasscodeContinue}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalContinueText}>
                  Continue
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={closePasscodeModal}
              disabled={saving}
            >
              <Text style={styles.modalCancelText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F2ECFF",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: DARK,
  },

  headerSpacer: {
    width: 42,
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 35,
  },

  introCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 15,
  },

  introIcon: {
    width: 65,
    height: 65,
    borderRadius: 20,
    backgroundColor: "#F0E9FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },

  introTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: DARK,
    marginBottom: 8,
  },

  introText: {
    fontSize: 13,
    color: "#777087",
    textAlign: "center",
    lineHeight: 21,
  },

  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF5DD",
    borderRadius: 14,
    padding: 14,
    marginBottom: 17,
    gap: 9,
  },

  noticeText: {
    flex: 1,
    fontSize: 12,
    color: "#795600",
    lineHeight: 19,
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 17,
  },

  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: DARK,
  },

  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F0E9FF",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  lockBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: PURPLE,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: DARK,
    marginBottom: 8,
  },

  input: {
    height: 53,
    borderWidth: 1,
    borderColor: "#E9E2F3",
    borderRadius: 13,
    paddingHorizontal: 14,
    fontSize: 14,
    color: DARK,
    backgroundColor: "#FCFAFF",
    marginBottom: 18,
  },

  lockedInput: {
    backgroundColor: "#F1EEF5",
    color: "#777087",
  },

  saveButton: {
    height: 54,
    backgroundColor: PURPLE,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    marginTop: 5,
  },

  disabledButton: {
    opacity: 0.65,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  securityCard: {
    backgroundColor: "#F0E9FF",
    borderRadius: 17,
    padding: 17,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },

  payoutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 17,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  payoutTextContainer: {
    flex: 1,
  },

  payoutTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: DARK,
    marginBottom: 7,
  },

  payoutDescription: {
    fontSize: 12,
    color: "#777087",
    lineHeight: 19,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(27, 21, 59, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
  },

  modalCard: {
    width: "100%",
    maxWidth: 390,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },

  modalIcon: {
    width: 65,
    height: 65,
    borderRadius: 21,
    backgroundColor: "#F0E9FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 17,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: DARK,
    textAlign: "center",
  },

  modalDescription: {
    fontSize: 13,
    color: "#777087",
    lineHeight: 20,
    textAlign: "center",
    marginTop: 9,
    marginBottom: 22,
  },

  passcodeLabel: {
    alignSelf: "flex-start",
    fontSize: 13,
    fontWeight: "700",
    color: DARK,
    marginBottom: 9,
  },

  passcodeInput: {
    width: "100%",
    height: 57,
    borderWidth: 1.5,
    borderColor: "#DCD2EC",
    borderRadius: 14,
    textAlign: "center",
    fontSize: 23,
    letterSpacing: 12,
    color: DARK,
    backgroundColor: "#FCFAFF",
  },

  passcodeInputError: {
    borderColor: "#EF4444",
  },

  passcodeError: {
    alignSelf: "flex-start",
    fontSize: 12,
    color: "#DC2626",
    marginTop: 8,
  },

  modalContinueButton: {
    width: "100%",
    height: 52,
    backgroundColor: PURPLE,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  modalContinueText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  modalCancelButton: {
    padding: 13,
    marginTop: 5,
  },

  modalCancelText: {
    color: "#777087",
    fontSize: 14,
    fontWeight: "700",
  },
});
