/******************************************************************************
 * Home Screen Component
 *
 * Where users can view their splits. Currently displays a placeholder.
 *
 * TO::DO - Integrate with backend to fetch real splits data and display them.
 *******************************************************************************/

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function HomeScreen() {
  // Splits state to hold the list of splits fetched from the backend, and loading state to manage loading indicator
  // setSplits is used to update the splits state after fetching data from the backend, and setLoading is used to toggle the loading state while data is being fetched.
  const [splits, setSplits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /****
     * Name: loadSplits
     * Description: Fetches splits data for the authenticated user
     * from Supabase and sets it in state.
     */
    const loadSplits = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        // if theres an authentication error or not a user
        console.error("Error fetching user:", authError);
        setLoading(false);
        return;
      }
      // query supabase for splits that the user is a member of, and get the split details
      // store in data variable. The query uses a join to get the split details from the splits table based on the split_id in the split_members table, and filters by the current user's profile_id.
      const { data, error } = await supabase
        .from("split_members")
        .select(`split_id, splits(id, title, total_amount, created_at)`)
        .eq("profile_id", user.id);

      // if theres an error fetching the splits, log it. Otherwise, format the data to extract the splits and set it in state
      if (error) {
        console.error("Error fetching splits:", error);
        setLoading(false);
        return;
      } else {
        // .map is used to iterate over the data array and extract the splits from each item, creating a new CLEAN array of splits that is then set in state.
        // This allows the component to render the list of splits for the user.
        const formatted = data.map((item: any) => item.splits);
        setSplits(formatted); // replace splits state with the formatted splits data from the backend
      }
      setSplits(data);
      setLoading(false);
    };
    loadSplits();
  }, []);
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Your Splits</Text>

        {/* Placeholder when no splits exist */}
        {!loading && splits.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No splits yet. Tap the + button to create one!
            </Text>
          </View>
        )}

        {/*Render splits from state. Currently just shows title, date, 
        and total amount owed for each split. Can be expanded to show more details and actions.*/}
        {splits.map((split) => (
          <Pressable key={split.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{split.title}</Text>
                <Text style={styles.cardDate}>
                  {new Date(split.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View style={styles.cardBalances}>
              <View style={styles.balanceBlock}>
                <Text style={styles.balanceLabel}>Total Owed</Text>
                <Text style={styles.balanceValue}>
                  ${Number(split.total_amount).toFixed(2)}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles for Home Screen
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 24,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  cardDate: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  cardBalances: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
  },
  balanceBlock: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardFriends: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
  },
  friendsLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 4,
  },
  friendList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  friendBadge: {
    backgroundColor: "#dbeafe",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  friendBadgeExtra: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  friendText: {
    fontSize: 10,
    color: "#8b16a3ff",
  },
});
