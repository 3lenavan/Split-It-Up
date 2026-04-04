/******************************************************************************
 * Add Screen Component
 *
 * Where users can create a new split by entering details.
 *
 * TO::DO - Integrate with backend to save new splits and manage participants.
 *******************************************************************************/
import { supabase } from "@/lib/supabaseClient";
import * as Haptics from "expo-haptics";
import { Percent, Plus } from "lucide-react-native";
import {
  Alert,
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
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddScreen({
  onSplitCreated,
}: {
  onSplitCreated?: () => void;
}) {
  const [occasionName, setOccasionName] = useState("");
  const [total, setTotal] = useState("");
  const [user, setUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const [showFriends, setShowFriends] = useState(false);
  const [userShareAmount, setUserShareAmount] = useState(0);

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

      // Load friends - TODO: replace with actual friends data
      const { data: friendsData, error: friendsError } = await supabase
        .from("friends")
        .select(
          `
          id,
          user_id,
          friend_id,
          profiles:friend_id ( id, full_name, username )
        `,
        )
        .eq("user_id", user?.id || ""); // fallback if user is null

      if (friendsError) {
        console.error("Error fetching friends:", friendsError);
        return;
      }

      setFriends(friendsData);
    }

    loadUser();
  }, []);

  async function handleCreateSplit() {
    try {
      const trimmedTitle = occasionName.trim();
      const trimmedTotal = total.trim();
      const amount = parseFloat(trimmedTotal);
      const totalPeople = selectedFriends.length + 1;
      // Derived value: split per person
      const splitAmount = selectedFriends.length
        ? parseFloat(total || "0") / (selectedFriends.length + 1) // +1 for current user
        : 0;
      const splitPercentage = 100 / totalPeople;

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
            sharePercentage: splitPercentage,
            shareAmount: splitAmount,
          },
          ...selectedFriends.map((f) => ({
            profileId: f.id,
            sharePercentage: splitPercentage,
            shareAmount: splitAmount,
          })),
        ],
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Split Created", "Your split has been created successfully!");

      if (onSplitCreated) onSplitCreated();
      // clear the form after success
      setOccasionName("");
      setTotal("");
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
              <Pressable
                style={styles.splitEvenly}
                onPress={() => {
                  // Calculate each person's share (including the creator)
                  const totalAmount = parseFloat(total || "0");
                  const perPerson =
                    selectedFriends.length > 0
                      ? totalAmount / (selectedFriends.length + 1)
                      : totalAmount;

                  // Update each friend's share amount
                  setSelectedFriends((prev) =>
                    prev.map((f) => ({ ...f, shareAmount: perPerson })),
                  );

                  // Optionally track creator's share
                  setUserShareAmount(perPerson);
                }}
              >
                <Percent size={14} color="#8b16a3ff" />
                <Text style={styles.splitText}>Split Evenly</Text>
              </Pressable>
            </View>
            {/* Selected Friends */}
            {selectedFriends.map((friend) => (
              <Swipeable
                key={friend.id}
                renderRightActions={() => (
                  <Pressable
                    onPress={() =>
                      setSelectedFriends((prev) =>
                        prev.filter((f) => f.id !== friend.id),
                      )
                    }
                    style={{
                      backgroundColor: "#ef4444",
                      justifyContent: "center",
                      alignItems: "center",
                      width: 80,
                      marginVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      Delete
                    </Text>
                  </Pressable>
                )}
              >
                <View style={styles.friendCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.friendName}>{friend.full_name}</Text>
                    <Text style={styles.friendHandle}>@{friend.username}</Text>
                  </View>

                  <View style={styles.friendSplit}>
                    <Text style={styles.amountText}>
                      ${friend.shareAmount?.toFixed(2) || "0.00"}
                    </Text>
                  </View>
                </View>
              </Swipeable>
            ))}
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
          <Pressable
            style={styles.addFriendButton}
            onPress={() => setShowFriends(!showFriends)}
          >
            <Plus size={16} color="#6b7280" />
            <Text style={styles.addFriendText}>Add Friend</Text>
          </Pressable>

          {/* Friend Picker */}
          {showFriends && (
            <>
              {friends.length === 0 ? (
                <View style={{ padding: 12, alignItems: "center" }}>
                  <Text
                    style={{
                      color: "#6b7280",
                      fontSize: 14,
                      textAlign: "center",
                    }}
                  >
                    You have no friends yet. Add some now!
                  </Text>
                </View>
              ) : (
                friends.map((f) => {
                  const friendProfile = f.profiles;

                  return (
                    <Pressable
                      key={f.id}
                      style={styles.friendCard}
                      onPress={() => {
                        if (
                          selectedFriends.find(
                            (sf) => sf.id === friendProfile.id,
                          )
                        )
                          return;
                        setSelectedFriends((prev) => [...prev, friendProfile]);
                      }}
                    >
                      <View>
                        <Text style={styles.friendName}>
                          {friendProfile.full_name}
                        </Text>
                        <Text style={styles.friendHandle}>
                          @{friendProfile.username}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </>
          )}

          {/* Create Button */}
          <Pressable style={styles.createButton} onPress={handleCreateSplit}>
            <Text style={styles.createButtonText}>Create Split</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
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
