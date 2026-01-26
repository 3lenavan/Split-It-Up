/******************************************************************************
 * Profile Screen
 *
 * This screen allows users to view and manage their profile,
 * including viewing friends, adding new friends, and checking
 * pending friend requests.
 *
 * TO::DO - Integrate with backend to fetch real user data
 * and handle friend requests.
 *****************************************************************************/

import { Check, Search, UserPlus } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
// Api that ensures content is within safe area boundaries
import { SafeAreaView } from "react-native-safe-area-context";

// Profile Screen Component
export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>Y</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>Your Name</Text>
            <Text style={styles.username}>@your_username</Text>
            <Text style={styles.email}>you@example.com</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: "#16a34a" }]}>$0</Text>
            <Text style={styles.statLabel}>You're owed</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: "#dc2626" }]}>$0</Text>
            <Text style={styles.statLabel}>You owe</Text>
          </View>
        </View>

        {/* Add Friend Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Friend</Text>
          <View style={styles.searchBox}>
            <Search size={18} color="#9ca3af" style={styles.searchIcon} />
            <View style={styles.searchInputPlaceholder}>
              <Text style={styles.searchPlaceholder}>Search by username</Text>
            </View>
            <Pressable style={styles.searchButton}>
              <Text style={styles.searchButtonText}>Search</Text>
            </Pressable>
          </View>

          {/* Example Search Result */}
          <View style={styles.resultCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultName}>Alex Kim</Text>
              <Text style={styles.resultUsername}>@alex_k</Text>
              <Text style={styles.resultMutual}>3 mutual friends</Text>
            </View>
            <Pressable style={styles.addButton}>
              <UserPlus size={16} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>
        </View>

        {/* Pending Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Requests</Text>
          <View style={styles.pendingCard}>
            <View>
              <Text style={styles.resultName}>Raner Chow</Text>{" "}
              {/* MOCK DATA */}
              <Text style={styles.resultUsername}>@raner_c</Text>
            </View>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Friends List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Friends (0)</Text>
          <View style={styles.friendCard}>
            <View style={styles.friendInfo}>
              <View style={styles.friendAvatar}>
                <Text style={styles.friendAvatarText}>S</Text>
              </View>
              <View>
                <Text style={styles.resultName}>Audrey Saidel</Text>{" "}
                {/* MOCK DATA */}
                <Text style={styles.resultUsername}>@audrey_s</Text>
              </View>
            </View>
            <View style={styles.friendStatus}>
              <Check size={16} color="#8b16a3ff" />
              <Text style={styles.friendStatusText}>Friends</Text>
            </View>
          </View>

          {/* Empty State */}
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No friends yet. Search to add your first friend!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles for Profile Screen
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 },
  profileHeader: {
    flexDirection: "row",
    marginBottom: 24,
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#8b16a3ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  profileInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: "600", color: "#111827" },
  username: { fontSize: 14, color: "#6b7280" },
  email: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
    paddingVertical: 12,
  },
  statBlock: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "600" },
  statLabel: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 8,
  },
  searchIcon: { marginLeft: 4 },
  searchInputPlaceholder: { flex: 1, marginLeft: 8 },
  searchPlaceholder: { color: "#9ca3af" },
  searchButton: {
    backgroundColor: "#8b16a3ff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  searchButtonText: { color: "#fff", fontWeight: "600" },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  resultName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  resultUsername: { fontSize: 12, color: "#6b7280" },
  resultMutual: { fontSize: 10, color: "#8b16a3ff", marginTop: 2 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8b16a3ff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  addButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  pendingCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
  },
  pendingBadge: {
    backgroundColor: "#fde68a",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingText: { fontSize: 10, color: "#92400e", fontWeight: "600" },
  friendCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
    alignItems: "center",
  },
  friendInfo: { flexDirection: "row", alignItems: "center" },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#8b16a3ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  friendAvatarText: { color: "#fff", fontWeight: "700" },
  friendStatus: { flexDirection: "row", alignItems: "center", gap: 4 },
  friendStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8b16a3ff",
    marginLeft: 4,
  },
  emptyContainer: { paddingVertical: 32, alignItems: "center" },
  emptyText: { fontSize: 12, color: "#6b7280" },
});
