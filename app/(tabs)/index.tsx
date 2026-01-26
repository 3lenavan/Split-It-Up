/******************************************************************************
 * Home Screen Component
 *
 * Where users can view their splits. Currently displays a placeholder.
 *
 * TO::DO - Integrate with backend to fetch real splits data and display them.
 *******************************************************************************/

import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function HomeScreen() {
  // Leave splits empty because no data management is set up yet
  const splits: any[] = [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Your Splits</Text>

        {/* Placeholder when no splits exist */}
        {splits.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No splits yet. Tap the + button to create one!
            </Text>
          </View>
        )}

        {/* Example of a split card (uncomment for test split)   
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Vegas Trip</Text>
              <Text style={styles.cardDate}>Jan 10, 2026</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </View>

          <View style={styles.cardBalances}>
            <View style={styles.balanceBlock}>
              <Text style={styles.balanceLabel}>You're owed</Text>
              <Text style={[styles.balanceValue, { color: '#16a34a' }]}>+$300.00</Text>
            </View>
            <View style={styles.balanceBlock}>
              <Text style={styles.balanceLabel}>You owe</Text>
              <Text style={[styles.balanceValue, { color: '#dc2626' }]}>-$100.00</Text>
            </View>
            <View style={styles.balanceBlock}>
              <Text style={styles.balanceLabel}>Total</Text>
              <Text style={styles.balanceValue}>$1200.00</Text>
            </View>
          </View>

          <View style={styles.cardFriends}>
            <Text style={styles.friendsLabel}>3 friends</Text>
            <View style={styles.friendList}>
              <View style={styles.friendBadge}><Text style={styles.friendText}>Sarah</Text></View>
              <View style={styles.friendBadge}><Text style={styles.friendText}>Mike</Text></View>
              <View style={styles.friendBadge}><Text style={styles.friendText}>Jessica</Text></View>
              <View style={styles.friendBadgeExtra}><Text style={styles.friendText}>+1 more</Text></View>
            </View>
          </View>
        </Pressable>
        */}
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
