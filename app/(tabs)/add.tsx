/******************************************************************************
 * Add Screen Component
 *
 * Where users can create a new split by entering details.
 *
 * TO::DO - Integrate with backend to save new splits and manage participants.
 *******************************************************************************/
import { supabase } from "@/lib/supabaseClient";

import { Percent, Plus } from "lucide-react-native";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
// Api that ensures content is within safe area boundaries
import { createSplit } from "@/lib/split";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddScreen() {
  const [occasionName, setOccasionName] = useState("");
  const [total, setTotal] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error loading user:", error.message);
        return;
      }

      setUser(user);
    }

    loadUser();
  }, []);

  async function handleCreateSplit() {
    try {
      const trimmedTitle = occasionName.trim();
      const trimmedTotal = total.trim();
      const amount = parseFloat(trimmedTotal);

      if (!trimmedTitle || !trimmedTotal || !user) {
        console.log("Missing data");
        return;
      }

      if (isNaN(amount) || amount <= 0) {
        console.log("Invalid amount");
        return;
      }

      await createSplit({
        title: trimmedTitle,
        totalAmount: amount,
        members: [
          {
            profileId: user.id,
            sharePercentage: 100,
            shareAmount: amount,
          },
        ],
      });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Create New Split</Text>

        {/* Occasion Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Occasion Name</Text>
          <TextInput
            placeholder="e.g. Vegas Trip, Dinner"
            style={styles.input}
            value={occasionName}
            onChangeText={setOccasionName}
          />
        </View>

        {/* Total Amount */}
        <View style={styles.section}>
          <Text style={styles.label}>Total Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.amountDollar}>$</Text>
            <TextInput
              placeholder="0.00"
              keyboardType="numeric"
              style={styles.amountInput}
              value={total}
              onChangeText={setTotal}
            />
          </View>
        </View>

        {/* Split With Friends */}
        <View style={styles.section}>
          <View style={styles.splitHeader}>
            <Text style={styles.label}>Split With Friends</Text>
            <View style={styles.splitEvenly}>
              <Percent size={14} color="#8b16a3ff" />
              <Text style={styles.splitText}>Split Evenly</Text>
            </View>
          </View>
          {/* Friend Card TODO */}
        </View>

        {/* Progress Bar */}
        <View style={styles.section}>
          <View style={styles.progressHeader}>
            <Text style={styles.label}>Total</Text>
            <Text style={styles.progressText}>100%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>

        {/* Add Friend Button */}
        <Pressable style={styles.addFriendButton}>
          <Plus size={16} color="#6b7280" />
          <Text style={styles.addFriendText}>Add Friend</Text>
        </Pressable>

        {/* Create Button */}
        <Pressable style={styles.createButton} onPress={handleCreateSplit}>
          <Text style={styles.createButtonText}>Create Split</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles for Add Screen
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40, // give bottom space for scrolling
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  amountDollar: {
    color: "#6b7280",
    marginRight: 4,
    fontSize: 14,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
  },
  splitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  splitEvenly: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  splitText: {
    color: "#8b16a3ff",
    fontSize: 12,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  friendName: {
    fontWeight: "500",
  },
  friendHandle: {
    fontSize: 12,
    color: "#6b7280",
  },
  friendSplit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  percentageBox: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    width: 40,
  },
  percentageText: {
    textAlign: "right",
    fontSize: 12,
  },
  percentageSign: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 2,
  },
  amountText: {
    width: 60,
    textAlign: "right",
    fontWeight: "500",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressText: {
    fontWeight: "600",
    color: "#16a34a",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    width: "100%",
    backgroundColor: "#16a34a",
  },
  addFriendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 24,
    gap: 4,
  },
  addFriendText: {
    color: "#4b5563",
    fontSize: 14,
  },
  createButton: {
    backgroundColor: "#8b16a3ff",
    paddingVertical: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
});
