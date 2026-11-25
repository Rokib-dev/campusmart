
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PURPLE = "#8B5CF6";
const DARK = "#24194A";
const BACKGROUND = "#F7F3FF";

export default function AdminPaymentSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={23} color={DARK} />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Payment Settings</Text>
          <Text style={styles.headerSubtitle}>
            Manage CampusMart payments
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.notice}>
          <Ionicons
            name="information-circle"
            size={24}
            color={PURPLE}
          />
          <View style={styles.noticeText}>
            <Text style={styles.noticeTitle}>Demo Mode</Text>
            <Text style={styles.noticeDescription}>
              Real payments and bank transfers are not active yet.
              These settings are currently for planning purposes.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Payment Provider</Text>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.iconBox}>
              <Ionicons name="card-outline" size={25} color={PURPLE} />
            </View>

            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Paystack</Text>
              <Text style={styles.cardDescription}>
                Payment gateway connection
              </Text>
            </View>

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Not connected</Text>
            </View>
          </View>

          <Text style={styles.helperText}>
            Paystack will be connected after CampusMart completes its
            business registration and payment setup.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Business Settlement Account</Text>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.iconBox}>
              <Ionicons name="business-outline" size={25} color={PURPLE} />
            </View>

            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>CampusMart Business Account</Text>
              <Text style={styles.cardDescription}>
                Receives buyer payments
              </Text>
            </View>
          </View>

          <View style={styles.accountBox}>
            <Text style={styles.accountLabel}>Account status</Text>
            <Text style={styles.accountValue}>Not configured</Text>
          </View>

          <Text style={styles.helperText}>
            Business bank details will be added after the official
            business account and approved payment settlement arrangement
            are ready.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>CampusMart Payment Rules</Text>

        <View style={styles.card}>
          <View style={styles.ruleRow}>
            <View style={styles.ruleIcon}>
              <Ionicons name="pricetag-outline" size={21} color={PURPLE} />
            </View>
            <View style={styles.ruleInfo}>
              <Text style={styles.ruleTitle}>Listing Fee</Text>
              <Text style={styles.ruleDescription}>
                Charged for each product listed
              </Text>
            </View>
            <Text style={styles.amount}>₦200</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.ruleRow}>
            <View style={styles.ruleIcon}>
              <Ionicons name="cash-outline" size={21} color={PURPLE} />
            </View>
            <View style={styles.ruleInfo}>
              <Text style={styles.ruleTitle}>Sales Commission</Text>
              <Text style={styles.ruleDescription}>
                Deducted from the seller's product sale
              </Text>
            </View>
            <Text style={styles.amount}>10%</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.ruleRow}>
            <View style={styles.ruleIcon}>
              <Ionicons name="bicycle-outline" size={21} color={PURPLE} />
            </View>
            <View style={styles.ruleInfo}>
              <Text style={styles.ruleTitle}>Delivery Fee</Text>
              <Text style={styles.ruleDescription}>
                Paid by the buyer
              </Text>
            </View>
            <Text style={styles.amount}>₦500</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Seller Payout Arrangement</Text>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.iconBox}>
              <Ionicons
                name="wallet-outline"
                size={25}
                color={PURPLE}
              />
            </View>

            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Admin-managed payouts</Text>
              <Text style={styles.cardDescription}>
                Planned seller payment process
              </Text>
            </View>
          </View>

          <View style={styles.payoutStep}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>
              Buyer makes payment to CampusMart through the approved
              payment provider.
            </Text>
          </View>

          <View style={styles.payoutStep}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>
              CampusMart confirms delivery with the buyer.
            </Text>
          </View>

          <View style={styles.payoutStep}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>
              Admin calculates the seller's earnings after the 10%
              commission.
            </Text>
          </View>

          <View style={styles.payoutStep}>
            <Text style={styles.stepNumber}>4</Text>
            <Text style={styles.stepText}>
              Admin pays the seller using the approved payout process.
            </Text>
          </View>
        </View>

        <View style={styles.warning}>
          <Ionicons name="shield-checkmark-outline" size={23} color="#B7791F" />
          <Text style={styles.warningText}>
            A secure payment provider and an approved settlement
            arrangement are required before CampusMart can receive
            customer funds and pay sellers. This screen does not hold
            or transfer money.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 14,
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: DARK,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#77718C",
    marginTop: 3,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  notice: {
    flexDirection: "row",
    backgroundColor: "#EEE8FF",
    padding: 15,
    borderRadius: 15,
    gap: 11,
    marginBottom: 25,
  },
  noticeText: {
    flex: 1,
  },
  noticeTitle: {
    color: DARK,
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 4,
  },
  noticeDescription: {
    color: "#625B79",
    fontSize: 12,
    lineHeight: 19,
  },
  sectionTitle: {
    color: DARK,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 11,
    marginTop: 5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 16,
    marginBottom: 23,
    borderWidth: 1,
    borderColor: "#EEEAF7",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#F0EBFF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: DARK,
  },
  cardDescription: {
    fontSize: 11,
    color: "#858096",
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: "#FFF4DF",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#A36A12",
  },
  helperText: {
    color: "#77718C",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 14,
  },
  accountBox: {
    backgroundColor: "#F8F6FC",
    padding: 13,
    borderRadius: 11,
    marginTop: 17,
  },
  accountLabel: {
    color: "#858096",
    fontSize: 11,
  },
  accountValue: {
    color: DARK,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 5,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
  },
  ruleIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: "#F0EBFF",
    alignItems: "center",
    justifyContent: "center",
  },
  ruleInfo: {
    flex: 1,
    marginLeft: 11,
  },
  ruleTitle: {
    color: DARK,
    fontSize: 13,
    fontWeight: "700",
  },
  ruleDescription: {
    color: "#858096",
    fontSize: 10,
    marginTop: 3,
  },
  amount: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: "800",
  },
  separator: {
    height: 1,
    backgroundColor: "#F0EDF5",
    marginVertical: 7,
  },
  payoutStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 17,
    gap: 11,
  },
  stepNumber: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#EEE8FF",
    color: PURPLE,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
  },
  stepText: {
    flex: 1,
    color: "#625B79",
    fontSize: 12,
    lineHeight: 19,
  },
  warning: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF8E8",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 15,
  },
  warningText: {
    flex: 1,
    color: "#80612A",
    fontSize: 11,
    lineHeight: 18,
  },
});
