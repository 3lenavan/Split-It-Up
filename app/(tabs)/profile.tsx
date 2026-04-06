/******************************************************************************
 * Profile Screen
 *
 * This screen allows users to view and manage their profile,
 * including viewing friends, adding new friends, and checking
 * pending friend requests.
 *****************************************************************************/

import { supabase } from "@/lib/supabaseClient";
import { router } from "expo-router";
import { Check, LogOut, Search, UserPlus, X } from "lucide-react-native";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

// Profile Screen Component
export default function ProfileScreen() {

  const [searchText, setSearchText] = useState("");
  
  const [profile, setProfile] = useState({
  name: "",
  username: "",
  email: "",
});

  const [friends, setFriends] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [youreOwed, setYoureOwed] = useState(0);
  
  const [youOwe, setYouOwe] = useState(0);

  const loadProfile = async () => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user) {
    console.log("No user session found");
    return;
  }

  if (sessionError) {
    console.error("Error getting session:", sessionError);
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, username, email")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error loading profile:", error);
    return;
  }

  if (data) {
    setProfile({
      name: data.full_name || "",
      username: data.username || "",
      email: data.email || "",
    });
  }
};

const loadPendingRequests = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const currentUserId = session?.user?.id;

  if (!currentUserId) return;

  const { data, error } = await supabase
    .from("friend_requests")
    .select(`
      id,
      requester_id,
      requester:profiles!requester_id (
        full_name,
        username
      )
    `)
    .eq("addressee_id", currentUserId)
    .eq("status", "pending");

  if (error) {
    console.error("Error loading pending requests:", error);
    return;
  }

  const formatted =
    data?.map((request: any) => ({
      id: request.id,
      name: request.requester?.full_name || "",
      username: request.requester?.username || "",
    })) ?? [];

  setPendingRequests(formatted);
};

const loadSentRequests = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const currentUserId = session?.user?.id;

  if (!currentUserId) return;

  const { data, error } = await supabase
    .from("friend_requests")
    .select("addressee_id")
    .eq("requester_id", currentUserId)
    .eq("status", "pending");

  if (error) {
    console.error("Error loading sent requests:", error);
    return;
  }

  const sentIds = data?.map((item: any) => item.addressee_id) ?? [];
  setSentRequests(sentIds);
};

const loadFriends = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const currentUserId = session?.user?.id;

  if (!currentUserId) return;

  const { data, error } = await supabase
    .from("friends")
    .select(`
      friend_id,
      friend:profiles!friend_id (
        id,
        full_name,
        username
      )
    `)
    .eq("user_id", currentUserId);

  if (error) {
    console.error("Error loading friends:", error);
    return;
  }

  const formatted =
    data?.map((item: any) => ({
      id: item.friend?.id,
      name: item.friend?.full_name || "",
      username: item.friend?.username || "",
    })) ?? [];

  setFriends(formatted);
};

const loadBalances = async () => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const currentUserId = session?.user?.id;

  if (!currentUserId) return;

  if (sessionError) {
    console.error("Error getting session for balances:", sessionError);
    return;
  }

  const { data, error } = await supabase
    .from("splits")
    .select(`
      id,
      my_membership:split_members!inner(
        profile_id,
        share_amount
      )
    `)
    .eq("my_membership.profile_id", currentUserId);

  if (error) {
    console.error("Error loading balances:", error);
    return;
  }

  let owedTotal = 0;
  let oweTotal = 0;

  (data ?? []).forEach((split: any) => {
    const myRow = Array.isArray(split.my_membership)
      ? split.my_membership[0]
      : split.my_membership;

    const myBalance = Number(myRow?.share_amount ?? 0);

    if (myBalance > 0) {
      owedTotal += myBalance;
    } else if (myBalance < 0) {
      oweTotal += Math.abs(myBalance);
    }
  });

  setYoureOwed(owedTotal);
  setYouOwe(oweTotal);
};

useEffect(() => {
  loadProfile();
  loadPendingRequests();
  loadSentRequests();
  loadFriends();
  loadBalances();
}, []);

  const handleSearch = async () => {
  console.log("Search button pressed");

  if (!searchText.trim()) {
    console.log("Search text is empty");
    return;
  }

  console.log("Searching for:", searchText);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Session error:", sessionError);
    return;
  }

  const currentUserId = session?.user?.id;
  console.log("Current user id:", currentUserId);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .ilike("username", `%${searchText}%`);

  if (error) {
    console.error("Search error:", error);
    return;
  }

  console.log("Raw search data:", data);

  const formatted =
    data
      ?.filter((user) => user.id !== currentUserId)
      .map((user) => ({
        id: user.id,
        name: user.full_name,
        username: user.username,
        mutualFriends: 0,
        isPending: sentRequests.includes(user.id),
        isFriend: friends.some((friend) => friend.id === user.id),
      }))
      .filter((user) => !user.isFriend) ?? [];

  console.log("Formatted search results:", formatted);

  setSearchResults(formatted);
};

const handleAddFriend = async (addresseeId: string) => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Session error:", sessionError);
    return;
  }

  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    console.log("No logged in user found");
    return;
  }

  if (currentUserId === addresseeId) {
    console.log("User cannot add themselves");
    return;
  }

  const { error } = await supabase.from("friend_requests").insert([
    {
      requester_id: currentUserId,
      addressee_id: addresseeId,
      status: "pending",
    },
  ]);

  if (error) {
    if (error.code === "23505") {
      console.log("Friend request already exists");
      await loadSentRequests();

      setSearchResults((prev) =>
        prev.map((user) =>
          user.id === addresseeId
            ? { ...user, isPending: true }
            : user
        )
      );
      return;
    }

    console.error("Error sending friend request:", error);
    return;
  }

  console.log("Friend request sent successfully");

  await loadSentRequests();

  setSearchResults((prev) =>
    prev.map((user) =>
      user.id === addresseeId
        ? { ...user, isPending: true }
        : user
    )
  );
};

const handleAcceptRequest = async (requestId: string) => {
  const { data: request, error: fetchError } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (fetchError) {
    console.error("Error fetching request:", fetchError);
    return;
  }

  const requesterId = request.requester_id;
  const addresseeId = request.addressee_id;

  const { error: updateError } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);

  if (updateError) {
    console.error("Error accepting request:", updateError);
    return;
  }

  const { error: friendError } = await supabase.from("friends").insert([
    { user_id: requesterId, friend_id: addresseeId },
    { user_id: addresseeId, friend_id: requesterId },
  ]);

  if (friendError) {
    console.error("Error adding friendship:", friendError);
    return;
  }

  console.log("Friend request accepted");

await loadPendingRequests();
await loadFriends();
};

const handleDeclineRequest = async (requestId: string) => {
  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "declined" })
    .eq("id", requestId);

  if (error) {
    console.error("Error declining request:", error);
    return;
  }

  console.log("Friend request declined");

  await loadPendingRequests();
};

const handleLogout = async () => {
  Alert.alert(
    "Log Out",
    "Are you sure you want to log out?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/auth");
        },
      },
    ]
  );
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
          <Text style={styles.avatarText}>
    {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
          </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            <Text style={styles.email}>{profile.email}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{friends.length}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: "#16a34a" }]}>
              ${youreOwed.toFixed(2)}
            </Text>
<Text style={styles.statLabel}>You're owed</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: "#dc2626" }]}>
         ${youOwe.toFixed(2)}
        </Text>
<Text style={styles.statLabel}>You owe</Text>
          </View>
        </View>

        {/* Add Friend Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Friend</Text>
          <View style={styles.searchBox}>
  <Search size={18} color="#9ca3af" style={styles.searchIcon} />

  <TextInput
    style={styles.searchInput}
    placeholder="Search by username"
    placeholderTextColor="#9ca3af"
    value={searchText}
    onChangeText={(text) => {
      setSearchText(text);

      if (text.trim() === "") {
        setSearchResults([]);
      }
    }}
  />

  {searchText.length > 0 && (
    <Pressable
      style={styles.clearButton}
      onPress={() => {
        setSearchText("");
        setSearchResults([]);
      }}
    >
      <X size={16} color="#9ca3af" />
    </Pressable>
  )}

  <Pressable style={styles.searchButton} onPress={handleSearch}>
    <Text style={styles.searchButtonText}>Search</Text>
  </Pressable>
</View>

          {/* Search Results */}
<Text>Results found: {searchResults.length}</Text>

{searchText.trim() !== '' && searchResults.length === 0 && (
  <Text style={{ color: 'gray', textAlign: 'center', marginTop: 10 }}>
    No users found
  </Text>
)}

{searchResults.map((user) => (
  <View key={user.id} style={styles.resultCard}>
    <View style={{ flex: 1 }}>
      <Text style={styles.resultName}>{user.name}</Text>
      <Text style={styles.resultUsername}>@{user.username}</Text>
      <Text style={styles.resultMutual}>
        {user.mutualFriends} mutual friends
      </Text>
    </View>
    <Pressable
  style={[styles.addButton, user.isPending && styles.pendingButton]}
  
  onPress={() => !user.isPending && handleAddFriend(user.id)}
  disabled={user.isPending}
>
  {user.isPending ? (
    <Text style={styles.addButtonText}>Pending</Text>
  ) : (
    <>
      <UserPlus size={16} color="#fff" />
      <Text style={styles.addButtonText}>Add</Text>
    </>
  )}
</Pressable>
  </View>
))}
        </View>

        {/* Pending Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Requests</Text>
        {pendingRequests.map((request) => (
  <View key={request.id} style={styles.pendingCard}>
    <View>
      <Text style={styles.resultName}>{request.name}</Text>
      <Text style={styles.resultUsername}>@{request.username}</Text>
    </View>
    <View style={styles.requestActions}>
  <Pressable
    style={styles.acceptButton}
    onPress={() => handleAcceptRequest(request.id)}
  >
    <Text style={styles.requestButtonText}>Accept</Text>
  </Pressable>

  <Pressable
    style={styles.declineButton}
    onPress={() => handleDeclineRequest(request.id)}
  >
    <Text style={styles.requestButtonText}>Decline</Text>
  </Pressable>
</View>
  </View>
))}
        </View>

        {/* Friends List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Friends ({friends.length})</Text>
          {friends.map((friend) => (
  <View key={friend.id} style={styles.friendCard}>
    <View style={styles.friendInfo}>
      <View style={styles.friendAvatar}>
        <Text style={styles.friendAvatarText}>
          {friend.name ? friend.name.charAt(0).toUpperCase() : "?"}
        </Text>
      </View>
      <View>
        <Text style={styles.resultName}>{friend.name}</Text>
        <Text style={styles.resultUsername}>@{friend.username}</Text>
      </View>
    </View>
    <View style={styles.friendStatus}>
      <Check size={16} color="#8b16a3ff" />
      <Text style={styles.friendStatusText}>Friends</Text>
    </View>
  </View>
))}

          {/* Empty State */}
        {friends.length === 0 && (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>
      No friends yet. Search to add your first friend!
    </Text>
  </View>
)}
        </View>

        {/* ── Logout Button ── */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={18} color="#dc2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

// Styles for Profile Screen
const styles = StyleSheet.create({
  requestActions: {
  flexDirection: "row",
},

clearButton: {
  padding: 6,
  marginLeft: 4,
  borderRadius: 20,
  backgroundColor: "#f3f4f6",
},

acceptButton: {
  backgroundColor: "#16a34a",
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 6,
},

pendingButton: {
    backgroundColor: "#9ca3af",
  },

declineButton: {
  backgroundColor: "#dc2626",
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 6,
},

requestButtonText: {
  color: "#fff",
  fontSize: 12,
  fontWeight: "600",
},

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
  searchInput: {
  flex: 1,
  marginLeft: 8,
  fontSize: 14,
  color: "#111827",
},
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
  friendStatus: { flexDirection: "row", alignItems: "center"},
  friendStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8b16a3ff",
    marginLeft: 4,
  },
  emptyContainer: { paddingVertical: 32, alignItems: "center" },
  emptyText: { fontSize: 12, color: "#6b7280" },

  // Logout button styles
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff5f5",
  },
  logoutText: {
    color: "#dc2626",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8
  },
});