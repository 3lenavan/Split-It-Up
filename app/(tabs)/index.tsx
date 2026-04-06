/******************************************************************************
 * Home Screen Component
 *
 * Where users can view their splits. Currently displays a placeholder.
 *
 * TO::DO - Integrate with backend to fetch real splits data and display them.
 *******************************************************************************/
import { supabase } from "@/lib/supabaseClient";
import { useIsFocused } from "@react-navigation/native";
import { Edit2, Trash2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

type Friend = {
  id: string;
  name: string;
  balance: number;
};
type Split = {
  id: string;
  title: string;
  total_amount: number;
  created_at: string;
  creator_id: string;
  myBalance: number;
  friends: Friend[];
};
type EditableMember = {
  id: string;
  full_name: string;
  username: string;
  shareAmount: number;
  shareAmountInput: string;
};

type AvailableFriend = {
  id: string;
  full_name: string;
  username: string;
};

type SplitCardProps = {
  split: Split;
  onMenuOpen: (split: Split, position: { x: number; y: number }) => void;
  onDelete: (split: Split) => void;
};

function SplitCard({ split, onMenuOpen, onDelete }: SplitCardProps) {
  // useRef here gives each card its own stable ref — this is what was broken before
  const menuButtonRef = useRef<View>(null);

  const MAX_BADGES = 3;
  const owedToYou = split.myBalance > 0 ? split.myBalance : 0;
  const youOwe = split.myBalance < 0 ? Math.abs(split.myBalance) : 0;
  const hasFriends = split.friends.length > 0;

  const handleMenuPress = () => {
    menuButtonRef.current?.measureInWindow((x, y, width, height) => {
      onMenuOpen(split, {
        x: x + width - 160, // 160 = menu width
        y: y + height + 8, // small gap below button
      });
    });
  };

  const renderRightActions = () => (
    <Pressable
      style={styles.swipeDeleteAction}
      // FIX: pass split directly — no longer depends on selectedSplit state
      onPress={() => onDelete(split)}
    >
      <Trash2 size={18} color="#fff" />
      <Text style={styles.swipeDeleteText}>Delete</Text>
    </Pressable>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{split.title}</Text>
            <Text style={styles.cardDate}>
              {new Date(split.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>

          <Pressable
            ref={menuButtonRef}
            hitSlop={10}
            style={styles.menuTrigger}
            onPress={handleMenuPress}
          >
            <Text style={styles.chevron}>⋯</Text>
          </Pressable>
        </View>

        <View style={styles.cardBalances}>
          <View style={styles.balanceBlock}>
            <Text style={styles.balanceLabel}>Status</Text>
            <Text
              style={[
                styles.balanceValue,
                owedToYou > 0
                  ? styles.positive
                  : youOwe > 0
                    ? styles.negative
                    : undefined,
              ]}
            >
              {!hasFriends
                ? "Just you"
                : owedToYou > 0
                  ? "Owed back"
                  : youOwe > 0
                    ? "You owe"
                    : "Settled"}
            </Text>
          </View>

          <View style={styles.balanceBlock}>
            <Text style={styles.balanceLabel}>Your Share</Text>
            <Text style={styles.balanceValue}>
              ${Math.abs(split.myBalance).toFixed(2)}
            </Text>
          </View>

          <View style={styles.balanceBlock}>
            <Text style={styles.balanceLabel}>Total</Text>
            <Text style={styles.balanceValue}>
              ${Number(split.total_amount).toFixed(2)}
            </Text>
          </View>
        </View>

        {hasFriends && (
          <View style={styles.cardFriends}>
            <Text style={styles.friendsLabel}>
              {split.friends.length}{" "}
              {split.friends.length === 1 ? "friend" : "friends"}
            </Text>
            <View style={styles.friendList}>
              {split.friends.slice(0, MAX_BADGES).map((friend) => (
                <View key={friend.id} style={styles.friendBadge}>
                  <Text style={styles.friendText}>{friend.name}</Text>
                </View>
              ))}
              {split.friends.length > MAX_BADGES && (
                <View style={styles.friendBadgeExtra}>
                  <Text style={styles.friendTextExtra}>
                    +{split.friends.length - MAX_BADGES} more
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </Swipeable>
  );
}
// ── HomeScreen ─────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  // Define the Split type to match the structure of the splits data from the backend

  const [splits, setSplits] = useState<Split[]>([]);
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [selectedSplit, setSelectedSplit] = useState<Split | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [editMembers, setEditMembers] = useState<EditableMember[]>([]);
  const [availableFriends, setAvailableFriends] = useState<AvailableFriend[]>(
    [],
  );
  const [loadingEditData, setLoadingEditData] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  /****
   * Name: loadSplits
   * Description: Fetches splits data for the authenticated user
   * from Supabase and sets it in state.
   */
  const loadSplits = async () => {
    setLoading(true);
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      console.log("No user session yet");
      setLoading(false);
      return;
    }
    if (authError) {
      // if theres an authentication error or not a user
      console.error("Error fetching user:", authError);
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    // query supabase for splits that the user is a member of, and get the split details
    // store in data variable. The query uses a join to get the split details from the splits table based on the split_id in the split_members table, and filters by the current user's profile_id.
    const { data, error } = await supabase
      .from("splits")
      .select(
        `
    id,
    title,
    total_amount,
    created_at,
    creator_id,
    my_membership:split_members!inner(
      profile_id,
      share_amount
    ),
    all_members:split_members(
      profile_id,
      share_amount,
      profiles(
        id,
        full_name
      )
    )
  `,
      )
      .eq("my_membership.profile_id", user.id);
    console.log("SPLITS DATA:", JSON.stringify(data, null, 2));
    console.log("SESSION USER:", user?.id);
    // if theres an error fetching the splits, log it. Otherwise, format the data to extract the splits and set it in state
    if (error) {
      console.error("Error fetching splits:", error);
      setLoading(false);
      return;
    }

    const formatted: Split[] = (data ?? []).map((split: any) => {
      const myRow = Array.isArray(split.my_membership)
        ? split.my_membership[0]
        : split.my_membership;

      const myShareAmount = myRow?.share_amount ?? 0;

      const friends: Friend[] = (split.all_members ?? [])
        .filter((m: any) => m.profile_id !== user.id)
        .map((m: any) => ({
          id: m.profile_id,
          name: m.profiles?.full_name ?? "Unknown",
          balance: m.share_amount ?? 0,
        }));
      return {
        id: split.id,
        title: split.title,
        total_amount: split.total_amount,
        created_at: split.created_at,
        creator_id: split.creator_id,
        myBalance: myShareAmount,
        friends,
      };
    });
    console.log("FORMATTED SPLITS:", formatted);
    setSplits(formatted);
    setLoading(false);
  };

  useEffect(() => {
    if (!isFocused) return;
    loadSplits();
  }, [isFocused]);

  const openActionMenu = (split: Split, position: { x: number; y: number }) => {
    setSelectedSplit(split);
    setMenuPosition(position);
    setActionMenuVisible(true);
  };

  const closeActionMenu = () => {
    setActionMenuVisible(false);
  };

  const openEditModal = async () => {
    if (!selectedSplit) return;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      Alert.alert("Error", "Could not load user.");
      return;
    }

    if (selectedSplit.creator_id !== user.id) {
      Alert.alert(
        "Can't edit",
        "Only the person who created this split can edit it.",
      );
      return;
    }

    setEditTitle(selectedSplit.title);
    setEditTotal(String(selectedSplit.total_amount));
    setEditMembers([]);
    setAvailableFriends([]);
    setLoadingEditData(true);
    setActionMenuVisible(false);
    setEditModalVisible(true);

    try {
      const { data: memberRows, error: memberError } = await supabase
        .from("split_members")
        .select(`profile_id, share_amount, profiles (id, full_name, username)`)
        .eq("split_id", selectedSplit.id);
      console.log("EDIT MEMBER ROWS:", JSON.stringify(memberRows, null, 2));

      if (memberError)
        console.error("Error fetching split members:", memberError);

      const { data: friendRows, error: friendError } = await supabase
        .from("friends")
        .select(
          `id, user_id, friend_id, profiles:friend_id (id, full_name, username)`,
        )
        .eq("user_id", user.id);

      if (friendError) console.error("Error fetching friends:", friendError);

      const prefilledMembers: EditableMember[] = (memberRows ?? [])
        .filter((m: any) => m.profile_id !== user.id)
        .map((m: any) => {
          const profile = m.profiles as any;
          const amount = m.share_amount ?? 0;
          return {
            id: profile?.id ?? m.profile_id,
            full_name: profile?.full_name ?? "Unknown",
            username: profile?.username ?? "",
            shareAmount: amount,
            shareAmountInput: amount.toFixed(2),
          };
        });

      const friends: AvailableFriend[] = (friendRows ?? [])
        .map((f: any) => {
          const fp = f.profiles as any;
          return {
            id: fp?.id ?? f.friend_id,
            full_name: fp?.full_name ?? "Unknown",
            username: fp?.username ?? "",
          };
        })
        .filter((f) => !prefilledMembers.some((m) => m.id === f.id));

      setEditMembers(prefilledMembers);
      setAvailableFriends(friends);
    } finally {
      setLoadingEditData(false);
    }
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditTitle("");
    setEditTotal("");
    setEditMembers([]);
    setAvailableFriends([]);
  };
  const saveSplitEdits = async () => {
    if (!selectedSplit || !currentUserId) return;
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert("Error", "Could not verify user.");
      return;
    }

    if (selectedSplit.creator_id !== user.id) {
      Alert.alert(
        "Can't edit",
        "Only the person who created this split can edit it.",
      );
      return;
    }

    const parsedTotal = Number(editTotal);
    if (!editTitle.trim() || Number.isNaN(parsedTotal) || parsedTotal <= 0) {
      Alert.alert("Invalid input", "Please enter a valid name and amount.");
      return;
    }
    // FIX: disable button while saving
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("splits")
        .update({
          title: editTitle.trim(),
          total_amount: parsedTotal,
        })
        .eq("id", selectedSplit.id);

      if (error) {
        console.error("Error updating split:", error);
        Alert.alert("Error", "Could not save changes. Please try again.");
        return;
      }
      const memberRows = [
        {
          split_id: selectedSplit.id,
          profile_id: currentUserId,
          share_percentage:
            parsedTotal > 0 ? (creatorShare / parsedTotal) * 100 : 0,
          share_amount: creatorShare,
        },
        ...editMembers.map((m) => ({
          split_id: selectedSplit.id,
          profile_id: m.id,
          share_percentage:
            parsedTotal > 0
              ? ((parseFloat(m.shareAmountInput) || 0) / parsedTotal) * 100
              : 0,
          share_amount: parseFloat(m.shareAmountInput) || 0,
        })),
      ];
      const { error: memberError } = await supabase
        .from("split_members")
        .upsert(memberRows, { onConflict: "split_id,profile_id" });

      if (memberError) {
        console.error("Error upserting split members:", memberError);
        Alert.alert(
          "Partial save",
          "Split details saved but members could not be updated.",
        );
      }

      await loadSplits();
      closeEditModal();
      setSelectedSplit(null);
    } finally {
      setIsSaving(false);
    }
  };
  const addMemberToEdit = (friend: AvailableFriend) => {
    setEditMembers((prev) => [
      ...prev,
      {
        id: friend.id,
        full_name: friend.full_name,
        username: friend.username,
        shareAmount: 0,
        shareAmountInput: "0.00",
      },
    ]);
    setAvailableFriends((prev) => prev.filter((f) => f.id !== friend.id));
  };

  const removeMemberFromEdit = (memberId: string) => {
    const removing = editMembers.find((m) => m.id === memberId);
    setEditMembers((prev) => prev.filter((m) => m.id !== memberId));
    if (removing) {
      setAvailableFriends((prev) => [
        ...prev,
        {
          id: removing.id,
          full_name: removing.full_name,
          username: removing.username,
        },
      ]);
    }
  };

  const updateMemberShare = (memberId: string, value: string) => {
    setEditMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              shareAmountInput: value,
              shareAmount: parseFloat(value) || 0,
            }
          : m,
      ),
    );
  };

  const totalAmount = parseFloat(editTotal) || 0;
  const allocated = editMembers.reduce(
    (sum, m) => sum + (parseFloat(m.shareAmountInput) || 0),
    0,
  );
  const creatorShare = Math.max(0, totalAmount - allocated);
  const totalPeople = editMembers.length + 1;
  const progressPct =
    totalAmount > 0 ? Math.min(allocated / totalAmount, 1) : 0;
  const isComplete =
    totalAmount > 0 && Math.abs(allocated - totalAmount) < 0.01;

  const deleteSplit = async (splitToDelete?: Split) => {
    const targetSplit = splitToDelete ?? selectedSplit;
    if (!targetSplit) return;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("User not authenticated:", userError);
      return;
    }

    console.log("CURRENT USER:", user.id);
    console.log("SELECTED SPLIT:", targetSplit);

    // only creator can delete the whole split
    if (targetSplit.creator_id !== user.id) {
      Alert.alert(
        "Can't delete",
        "Only the person who created this split can delete it.",
        [{ text: "OK" }],
      );
      return;
    }

    // then delete the split itself
    const { data, error } = await supabase
      .from("splits")
      .delete()
      .eq("id", targetSplit.id)
      .select("id");

    console.log("DELETE ERROR:", error);
    console.log("DELETE TARGET ID:", targetSplit.id);
    console.log("DELETE RESULT:", data);

    if (error) {
      console.error("Error deleting split:", error);
      Alert.alert("Error", "Could not delete split. Please try again.");
      return;
    }
    if (!data || data.length === 0) {
      console.log("No split row was actually deleted.");
      return;
    }

    setSplits((prev) => prev.filter((split) => split.id !== targetSplit.id));
    setActionMenuVisible(false);
    setSelectedSplit(null);
  };

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

        {/* FIX: uses SplitCard component — each card owns its own ref */}
        {splits.map((split) => (
          <SplitCard
            key={split.id}
            split={split}
            onMenuOpen={openActionMenu}
            onDelete={deleteSplit}
          />
        ))}
      </ScrollView>
      <Modal
        visible={actionMenuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeActionMenu}
      >
        <Pressable style={styles.popoverOverlay} onPress={closeActionMenu}>
          <Pressable
            style={[
              styles.popoverMenu,
              { top: menuPosition.y, left: menuPosition.x },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Pressable
              style={styles.popoverItem}
              onPress={() => {
                openEditModal();
              }}
            >
              <Edit2 size={16} color="#111827" />
              <Text style={styles.popoverItemText}>Edit</Text>
            </Pressable>

            <Pressable
              style={styles.popoverItem}
              onPress={() => {
                deleteSplit();
                closeActionMenu();
              }}
            >
              <Trash2 size={16} color="#dc2626" />
              <Text style={styles.popoverDeleteText}>Delete</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Split</Text>

            <Text style={styles.inputLabel}>Split Name</Text>
            <TextInput
              style={styles.input}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Enter split name"
            />
            {totalAmount > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                  Allocated ${allocated.toFixed(2)} of ${totalAmount.toFixed(2)}
                </Text>
                <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  Your share: ${creatorShare.toFixed(2)}
                </Text>
              </View>
            )}

            {loadingEditData ? (
              <Text style={{ marginTop: 16, color: "#6b7280" }}>
                Loading members...
              </Text>
            ) : (
              <>
                {editMembers.length > 0 && (
                  <>
                    <Text style={styles.inputLabel}>Members</Text>
                    {editMembers.map((member) => (
                      <View
                        key={member.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: "500" }}>
                            {member.full_name}
                          </Text>
                          {!!member.username && (
                            <Text style={{ fontSize: 12, color: "#6b7280" }}>
                              @{member.username}
                            </Text>
                          )}
                        </View>

                        <TextInput
                          style={[
                            styles.input,
                            { width: 90, paddingVertical: 8 },
                          ]}
                          value={member.shareAmountInput}
                          onChangeText={(val) =>
                            updateMemberShare(member.id, val)
                          }
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                        />

                        <Pressable
                          onPress={() => removeMemberFromEdit(member.id)}
                        >
                          <Text style={{ color: "#dc2626", fontWeight: "600" }}>
                            Remove
                          </Text>
                        </Pressable>
                      </View>
                    ))}
                  </>
                )}

                {availableFriends.length > 0 && (
                  <>
                    <Text style={styles.inputLabel}>Add Friends</Text>
                    <View
                      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                    >
                      {availableFriends.map((friend) => (
                        <Pressable
                          key={friend.id}
                          onPress={() => addMemberToEdit(friend)}
                          style={{
                            backgroundColor: "#f3f4f6",
                            borderRadius: 16,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                          }}
                        >
                          <Text>{friend.full_name} +</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}

                {availableFriends.length === 0 && editMembers.length === 0 && (
                  <Text style={{ marginTop: 16, color: "#6b7280" }}>
                    Add friends from the Profile tab to split with them.
                  </Text>
                )}
              </>
            )}

            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={closeEditModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
                onPress={saveSplitEdits}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? "Saving…" : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 12,
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
  positive: {
    color: "#16a34a",
  },

  negative: {
    color: "#dc2626",
  },

  chevron: {
    fontSize: 22,
    color: "#9ca3af",
    lineHeight: 22,
  },

  friendTextExtra: {
    fontSize: 11,
    color: "#6b7280",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  menuContainer: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },

  menuTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 14,
    color: "#111827",
  },

  menuButton: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  menuButtonText: {
    fontSize: 16,
    color: "#111827",
  },

  deleteButtonText: {
    fontSize: 16,
    color: "#dc2626",
  },

  menuCancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
  },

  menuCancelText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#111827",
  },

  inputLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fff",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    gap: 10,
  },

  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },

  cancelButtonText: {
    color: "#374151",
    fontWeight: "500",
  },

  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#111827",
  },

  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  menuTrigger: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  popoverOverlay: {
    flex: 1,
  },

  popoverMenu: {
    position: "absolute",
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  popoverItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  popoverItemText: {
    fontSize: 14,
    color: "#111827",
  },

  popoverDeleteText: {
    fontSize: 14,
    color: "#dc2626",
  },

  swipeDeleteAction: {
    width: 92,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  swipeDeleteText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  editOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  editSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    minHeight: "55%",
  },

  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  editTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
  },

  editContent: {
    padding: 20,
    paddingBottom: 32,
  },

  inputGroup: {
    marginBottom: 18,
  },

  amountInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
  },

  amountPrefix: {
    fontSize: 16,
    color: "#6b7280",
    marginRight: 6,
  },

  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },

  readOnlyField: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },

  readOnlyText: {
    fontSize: 15,
    color: "#6b7280",
  },

  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },

  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },

  primaryButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
