/******************************************************************************
 * Home Screen — Premium Redesign
 * Dark theme matching add/profile screens. All features preserved.
 * Smooth entrance animations, glowing cards, animated balance summary.
 *****************************************************************************/
import { supabase } from "@/lib/supabaseClient";
import { AppBackground } from "@/lib/app-background";
import { THEME_PALETTES, useAppTheme } from "@/lib/app-theme";
import { useIsFocused } from "@react-navigation/native";
import { ChevronDown, Edit2, House, Receipt, SlidersHorizontal, Trash2, TrendingUp, Users } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Palette ───────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────
type Friend = { id: string; name: string; balance: number };
type Split = {
  id: string;
  title: string;
  total_amount: number;
  created_at: string;
  creator_id: string;
  creatorUsername: string;
  creatorName: string;
  myBalance: number;
  friends: Friend[];
  paymentRequested?: boolean;
};
type EditableMember = { id: string; full_name: string; username: string; shareAmount: number; shareAmountInput: string };
type AvailableFriend = { id: string; full_name: string; username: string };
type SplitFilter = "all" | "owe" | "owed" | "settled";
type HomePalette = typeof THEME_PALETTES.dark;
type HomeStyles = ReturnType<typeof createStyles>;

const BALANCE_EPSILON = 0.005;
const FILTER_OPTIONS: { id: SplitFilter; label: string; hint: string }[] = [
  { id: "all", label: "All", hint: "Every split" },
  { id: "owe", label: "I owe", hint: "Still to pay" },
  { id: "owed", label: "Owed to me", hint: "Money back" },
  { id: "settled", label: "Settled", hint: "All clear" },
];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value?: string | null) => !!value && UUID_RE.test(value);
const cleanNumberInput = (value: string) => value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
const formatClampedNumber = (value: number) => {
  const fixed = value.toFixed(2);
  return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
};
const splitDeleteAnimation = {
  duration: 280,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.scaleY,
  },
};

// ── Animated entrance hook ────────────────────────────────────────────────────
function useFadeSlide(delay = 0, isActive = true) {
  const scale = useRef(new Animated.Value(0.82)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (!isActive) {
      scale.setValue(0.82);
      opacity.setValue(0);
      translateY.setValue(24);
      return;
    }

    scale.setValue(0.82);
    opacity.setValue(0);
    translateY.setValue(24);

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          damping: 14,
          stiffness: 160,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 14,
          stiffness: 160,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay, isActive, scale, opacity, translateY]);

  return { opacity, transform: [{ scale }, { translateY }] };
}

// ── Floating orb ──────────────────────────────────────────────────────────────
function FloatingOrb({ style }: { style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.15)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.2, duration: 3500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.25, duration: 3500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 3500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.15, duration: 3500, useNativeDriver: true }),
      ]),
    ]));

    loop.start();
    return () => loop.stop();
  }, [opacity, scale]);
  return <Animated.View style={[style, { opacity, transform: [{ scale }] }]} pointerEvents="none" />;
}

// ── Split Card ────────────────────────────────────────────────────────────────
type SplitCardProps = {
  split: Split;
  currentUserId: string | null;
  entryDelay: number;
  isFocused: boolean;
  onMenuOpen: (split: Split, position: { x: number; y: number }) => void;
  onDelete: (split: Split) => void;
  onRequestPayment: (split: Split) => void;
  palette: HomePalette;
  styles: HomeStyles;
};

function SplitCard({ split, currentUserId, entryDelay, isFocused, onMenuOpen, onDelete, onRequestPayment, palette: C, styles }: SplitCardProps) {
  const menuButtonRef = useRef<View>(null);
  const entryAnim = useFadeSlide(entryDelay, isFocused);

  const owedToYou = split.myBalance > 0 ? split.myBalance : 0;
  const youOwe = split.myBalance < 0 ? Math.abs(split.myBalance) : 0;
  const hasFriends = split.friends.length > 0;
  const MAX_BADGES = 3;
  const isOwner = currentUserId === split.creator_id;
  const canRequestPayment = !isOwner && split.myBalance < -0.005;
  const ownerHandle = split.creatorUsername ? `@${split.creatorUsername}` : split.creatorName || "Unknown";
  const ownerLabel = isOwner ? `${ownerHandle} (you)` : ownerHandle;

  const statusColor = owedToYou > 0 ? C.green : youOwe > 0 ? C.red : C.textSecondary;
  const statusBg = owedToYou > 0 ? C.greenDim : youOwe > 0 ? C.redDim : C.accentDim;
  const statusLabel = !hasFriends ? "Solo" : owedToYou > 0 ? "Owed back" : youOwe > 0 ? "You owe" : "Settled";

  const handleMenuPress = () => {
    menuButtonRef.current?.measureInWindow((x, y, width, height) => {
      onMenuOpen(split, { x: x + width - 160, y: y + height + 8 });
    });
  };

  const renderRightActions = () => (
    <Pressable style={styles.swipeDelete} onPress={() => onDelete(split)}>
      <Trash2 size={16} color="#fff" />
      <Text style={styles.swipeDeleteText}>Delete</Text>
    </Pressable>
  );

  return (
    <Animated.View style={entryAnim}>
      <Swipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
        activeOffsetX={[-40, 40]}
        failOffsetY={[-6, 6]}
        dragOffsetFromRightEdge={24}
      >
        <View style={styles.card}>
          {/* top accent line */}
          <View style={[styles.cardAccentLine, { backgroundColor: statusColor }]} />

          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Receipt size={16} color={C.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{split.title}</Text>
              <Text style={styles.cardDate}>
                {new Date(split.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </Text>
              <Text style={styles.cardOwner} numberOfLines={1}>Owner: {ownerLabel}</Text>
            </View>
            <Pressable ref={menuButtonRef} hitSlop={10} style={styles.menuTrigger} onPress={handleMenuPress}>
              <Text style={styles.menuDots}>⋯</Text>
            </Pressable>
          </View>

          <View style={styles.cardBalances}>
            <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: statusColor + "44" }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>

            <View style={styles.balanceGroup}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>My share</Text>
                <Text style={[styles.balanceValue, { color: owedToYou > 0 ? C.green : youOwe > 0 ? C.red : C.textPrimary }]}>
                  ${Math.abs(split.myBalance).toFixed(2)}
                </Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Total</Text>
                <Text style={styles.balanceValue}>${Number(split.total_amount).toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {canRequestPayment && (
            <View style={styles.paymentActionWrap}>
              <Pressable
                style={[styles.paymentActionButton, split.paymentRequested && styles.paymentActionButtonSent]}
                onPress={() => onRequestPayment(split)}
                disabled={split.paymentRequested}
              >
                <Text style={[styles.paymentActionText, split.paymentRequested && styles.paymentActionTextSent]}>
                  {split.paymentRequested ? "Request sent" : `I Paid $${Math.abs(split.myBalance).toFixed(2)}`}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Friends */}
          {hasFriends && (
            <View style={styles.cardFriends}>
              <Users size={11} color={C.textMuted} />
              <Text style={styles.friendsLabel}>{split.friends.length} {split.friends.length === 1 ? "friend" : "friends"}</Text>
              <View style={styles.friendPills}>
                {split.friends.slice(0, MAX_BADGES).map((friend) => (
                  <View key={friend.id} style={styles.friendPill}>
                    <Text style={styles.friendPillText}>{friend.name}</Text>
                  </View>
                ))}
                {split.friends.length > MAX_BADGES && (
                  <View style={styles.friendPillExtra}>
                    <Text style={styles.friendPillExtraText}>+{split.friends.length - MAX_BADGES}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </Swipeable>
    </Animated.View>
  );
}

// ── HomeScreen ────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { palette, backgroundMode } = useAppTheme();
  const C = palette;
  const styles = createStyles(C);
  const [splits, setSplits] = useState<Split[]>([]);
  const [activeFilter, setActiveFilter] = useState<SplitFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
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
  const [editOriginalMemberIds, setEditOriginalMemberIds] = useState<string[]>([]);
  const [availableFriends, setAvailableFriends] = useState<AvailableFriend[]>([]);
  const [loadingEditData, setLoadingEditData] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // header anim
  const headerAnim = useFadeSlide(60, isFocused);
  const owedSummaryAnim = useFadeSlide(140, isFocused);
  const oweSummaryAnim = useFadeSlide(180, isFocused);
  const splitsSummaryAnim = useFadeSlide(220, isFocused);
  const contentAnim = useFadeSlide(260, isFocused);
  const filterAnim = useFadeSlide(260, isFocused);
  const filterReveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    Animated.timing(filterReveal, {
      toValue: filterOpen ? 1 : 0,
      duration: filterOpen ? 260 : 210,
      easing: filterOpen ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [filterOpen, filterReveal]);

  const loadSplits = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) { setLoading(false); return; }
    if (authError) { console.error("Error fetching user:", authError); setLoading(false); return; }
    setCurrentUserId(user.id);

    const { data, error } = await supabase
      .from("splits")
      .select(`id, title, total_amount, created_at, creator_id,
        my_membership:split_members!inner( profile_id, share_amount ),
        all_members:split_members( profile_id, share_amount, profiles( id, full_name ) )`)
      .eq("my_membership.profile_id", user.id);

    if (error) { console.error("Error fetching splits:", error); setLoading(false); return; }

    const splitIds = (data ?? []).map((split: any) => split.id);
    const creatorIds = Array.from(new Set((data ?? []).map((split: any) => split.creator_id).filter(isUuid)));
    const { data: creatorProfiles, error: creatorProfilesError } = creatorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, username")
          .in("id", creatorIds)
      : { data: [], error: null };

    if (creatorProfilesError) console.error("Error fetching split owners:", creatorProfilesError);
    const creatorProfilesById = new Map(
      (creatorProfiles ?? []).map((profile: any) => [profile.id, profile])
    );

    const { data: pendingRequests, error: pendingRequestsError } = splitIds.length > 0
      ? await supabase
          .from("money_requests")
          .select("split_id")
          .eq("requester_id", user.id)
          .eq("status", "pending")
          .in("split_id", splitIds)
      : { data: [], error: null };

    if (pendingRequestsError) console.error("Error fetching payment requests:", pendingRequestsError);
    const requestedSplitIds = new Set((pendingRequests ?? []).map((request: any) => request.split_id));

    const formatted: Split[] = (data ?? []).map((split: any) => {
      const myRow = Array.isArray(split.my_membership) ? split.my_membership[0] : split.my_membership;
      const creatorProfile = creatorProfilesById.get(split.creator_id);
      const friends: Friend[] = (split.all_members ?? [])
        .filter((m: any) => m.profile_id !== user.id)
        .map((m: any) => ({ id: m.profile_id, name: m.profiles?.full_name ?? "Unknown", balance: m.share_amount ?? 0 }));
      const rawBalance = Number(myRow?.share_amount ?? 0);
      const myBalance = split.creator_id === user.id
        ? friends.reduce((sum, friend) => sum + Math.abs(Number(friend.balance ?? 0)), 0)
        : rawBalance === 0
          ? 0
          : -Math.abs(rawBalance);

      return {
        id: split.id,
        title: split.title,
        total_amount: split.total_amount,
        created_at: split.created_at,
        creator_id: split.creator_id,
        creatorUsername: creatorProfile?.username ?? "",
        creatorName: creatorProfile?.full_name ?? "",
        myBalance,
        friends,
        paymentRequested: requestedSplitIds.has(split.id),
      };
    });
    setSplits(formatted);
    setLoading(false);
  };

  const refreshSplits = async () => {
    setRefreshing(true);
    try {
      await loadSplits(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { if (!isFocused) return; loadSplits(); }, [isFocused]);

  useEffect(() => {
    if (!isFocused) return;

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") loadSplits();
    });

    return () => subscription.remove();
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused || !currentUserId) return;

    const channel = supabase
      .channel(`home-splits-${currentUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "split_members", filter: `profile_id=eq.${currentUserId}` }, () => loadSplits(false))
      .on("postgres_changes", { event: "*", schema: "public", table: "money_requests", filter: `requester_id=eq.${currentUserId}` }, () => loadSplits(false))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, isFocused]);

  // summary numbers
  const totalOwed = splits.reduce((s, sp) => s + (sp.myBalance > BALANCE_EPSILON ? sp.myBalance : 0), 0);
  const totalOwe = splits.reduce((s, sp) => s + (sp.myBalance < -BALANCE_EPSILON ? Math.abs(sp.myBalance) : 0), 0);
  const filterCounts: Record<SplitFilter, number> = {
    all: splits.length,
    owe: splits.filter((split) => split.myBalance < -BALANCE_EPSILON).length,
    owed: splits.filter((split) => split.myBalance > BALANCE_EPSILON).length,
    settled: splits.filter((split) => Math.abs(split.myBalance) <= BALANCE_EPSILON).length,
  };
  const filteredSplits = splits.filter((split) => {
    if (activeFilter === "owe") return split.myBalance < -BALANCE_EPSILON;
    if (activeFilter === "owed") return split.myBalance > BALANCE_EPSILON;
    if (activeFilter === "settled") return Math.abs(split.myBalance) <= BALANCE_EPSILON;
    return true;
  });
  const activeFilterOption = FILTER_OPTIONS.find((option) => option.id === activeFilter) ?? FILTER_OPTIONS[0];
  const filterOptionsAnim = {
    maxHeight: filterReveal.interpolate({ inputRange: [0, 1], outputRange: [0, 84] }),
    marginTop: filterReveal.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }),
    opacity: filterReveal,
    transform: [
      { translateY: filterReveal.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
      { scale: filterReveal.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
    ],
  };
  const filterChevronAnim = {
    transform: [
      { rotate: filterReveal.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) },
    ],
  };

  const openActionMenu = (split: Split, position: { x: number; y: number }) => {
    setSelectedSplit(split); setMenuPosition(position); setActionMenuVisible(true);
  };
  const closeActionMenu = () => setActionMenuVisible(false);

  const openEditModal = async () => {
    if (!selectedSplit) return;
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { Alert.alert("Error", "Could not load user."); return; }
    if (selectedSplit.creator_id !== user.id) { Alert.alert("Can't edit", "Only the creator can edit this split."); return; }

    setEditTitle(selectedSplit.title);
    setEditTotal(String(selectedSplit.total_amount));
    setEditMembers([]); setAvailableFriends([]);
    setEditOriginalMemberIds([]);
    setLoadingEditData(true); setActionMenuVisible(false); setEditModalVisible(true);

    try {
      const { data: memberRows, error: memberError } = await supabase
        .from("split_members").select(`profile_id, share_amount, profiles (id, full_name, username)`).eq("split_id", selectedSplit.id);
      if (memberError) console.error("Error fetching split members:", memberError);

      const { data: friendRows, error: friendError } = await supabase
        .from("friends").select(`id, user_id, friend_id, profiles:friend_id (id, full_name, username)`).eq("user_id", user.id);
      if (friendError) console.error("Error fetching friends:", friendError);

      const prefilledMembers: EditableMember[] = (memberRows ?? [])
        .filter((m: any) => m.profile_id !== user.id)
        .map((m: any) => {
          const profile = m.profiles as any;
          const amount = Math.abs(Number(m.share_amount ?? 0));
          return { id: profile?.id ?? m.profile_id, full_name: profile?.full_name ?? "Unknown", username: profile?.username ?? "", shareAmount: amount, shareAmountInput: amount.toFixed(2) };
        });

      const friends: AvailableFriend[] = (friendRows ?? [])
        .map((f: any) => { const fp = f.profiles as any; return { id: fp?.id ?? f.friend_id, full_name: fp?.full_name ?? "Unknown", username: fp?.username ?? "" }; })
        .filter((f) => !prefilledMembers.some((m) => m.id === f.id));

      setEditMembers(prefilledMembers);
      setEditOriginalMemberIds(prefilledMembers.map((member) => member.id));
      setAvailableFriends(friends);
    } finally { setLoadingEditData(false); }
  };

  const resetEditModal = () => {
    setEditModalVisible(false);
    setEditTitle("");
    setEditTotal("");
    setEditMembers([]);
    setEditOriginalMemberIds([]);
    setAvailableFriends([]);
  };

  const closeEditModal = () => {
    Keyboard.dismiss();
    resetEditModal();
  };

  const totalAmount = parseFloat(editTotal) || 0;
  const allocated = editMembers.reduce((sum, m) => sum + (parseFloat(m.shareAmountInput) || 0), 0);
  const creatorShare = Math.max(0, totalAmount - allocated);
  const editOverAllocated = totalAmount > 0 && allocated - totalAmount > BALANCE_EPSILON;

  const saveSplitEdits = async () => {
    if (!selectedSplit || !currentUserId) return;
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { Alert.alert("Error", "Could not verify user."); return; }
    if (selectedSplit.creator_id !== user.id) { Alert.alert("Can't edit", "Only the creator can edit this split."); return; }
    const parsedTotal = Number(editTotal);
    if (!editTitle.trim() || Number.isNaN(parsedTotal) || parsedTotal <= 0) { Alert.alert("Invalid input", "Please enter a valid name and amount."); return; }
    if (allocated - parsedTotal > BALANCE_EPSILON) {
      Alert.alert("Too Much Assigned", "Member shares are more than the total bill. Lower one of the amounts first.");
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from("splits").update({ title: editTitle.trim(), total_amount: parsedTotal }).eq("id", selectedSplit.id);
      if (error) { Alert.alert("Error", "Could not save changes. Please try again."); return; }
      const savedMemberIds = new Set(editMembers.map((member) => member.id));
      const removedMemberIds = editOriginalMemberIds.filter((memberId) => !savedMemberIds.has(memberId));

      if (removedMemberIds.length > 0) {
        const { error: deleteMemberError } = await supabase
          .from("split_members")
          .delete()
          .eq("split_id", selectedSplit.id)
          .in("profile_id", removedMemberIds);

        if (deleteMemberError) {
          Alert.alert("Error", "Could not remove old members from this split.");
          return;
        }
      }

      const memberRows = [
        { split_id: selectedSplit.id, profile_id: currentUserId, share_percentage: parsedTotal > 0 ? (creatorShare / parsedTotal) * 100 : 0, share_amount: creatorShare },
        ...editMembers.map((m) => {
          const shareAmount = parseFloat(m.shareAmountInput) || 0;

          return {
            split_id: selectedSplit.id,
            profile_id: m.id,
            share_percentage: parsedTotal > 0 ? (shareAmount / parsedTotal) * 100 : 0,
            share_amount: -shareAmount,
          };
        }),
      ];
      const { error: memberError } = await supabase.from("split_members").upsert(memberRows, { onConflict: "split_id,profile_id" });
      if (memberError) { Alert.alert("Error", "Split members could not be saved."); return; }
      await loadSplits(); closeEditModal(); setSelectedSplit(null);
    } finally { setIsSaving(false); }
  };

  const addMemberToEdit = (friend: AvailableFriend) => {
    setEditMembers((prev) => [...prev, { id: friend.id, full_name: friend.full_name, username: friend.username, shareAmount: 0, shareAmountInput: "0.00" }]);
    setAvailableFriends((prev) => prev.filter((f) => f.id !== friend.id));
  };

  const removeMemberFromEdit = (memberId: string) => {
    const removing = editMembers.find((m) => m.id === memberId);
    setEditMembers((prev) => prev.filter((m) => m.id !== memberId));
    if (removing) setAvailableFriends((prev) => [...prev, { id: removing.id, full_name: removing.full_name, username: removing.username }]);
  };

  const updateMemberShare = (memberId: string, value: string) => {
    const cleaned = cleanNumberInput(value);

    setEditMembers((prev) => {
      if (cleaned === "" || cleaned === ".") {
        return prev.map((m) => m.id === memberId ? { ...m, shareAmountInput: cleaned, shareAmount: 0 } : m);
      }

      const usedByOthers = prev.reduce((sum, member) => {
        if (member.id === memberId) return sum;
        return sum + (parseFloat(member.shareAmountInput) || 0);
      }, 0);
      const requestedAmount = parseFloat(cleaned) || 0;
      const maxAmount = totalAmount > 0 ? Math.max(0, totalAmount - usedByOthers) : requestedAmount;
      const nextAmount = Math.min(requestedAmount, maxAmount);
      const nextInput = requestedAmount > maxAmount ? formatClampedNumber(nextAmount) : cleaned;

      return prev.map((m) => m.id === memberId ? { ...m, shareAmountInput: nextInput, shareAmount: nextAmount } : m);
    });
  };

  const deleteSplit = async (splitToDelete?: Split) => {
    const targetSplit = splitToDelete ?? selectedSplit;
    if (!targetSplit) return;
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return;
    if (targetSplit.creator_id !== user.id) { Alert.alert("Can't delete", "Only the creator can delete this split."); return; }
    const { data, error } = await supabase.from("splits").delete().eq("id", targetSplit.id).select("id");
    if (error) { Alert.alert("Error", "Could not delete split."); return; }
    if (!data || data.length === 0) return;
    LayoutAnimation.configureNext(splitDeleteAnimation);
    setSplits((prev) => prev.filter((s) => s.id !== targetSplit.id));
    setActionMenuVisible(false); setSelectedSplit(null);
  };

  const handleRequestPayment = async (split: Split) => {
  const requesterId = isUuid(currentUserId)
    ? currentUserId
    : (await supabase.auth.getUser()).data.user?.id ?? null;

  if (!isUuid(requesterId)) {
    Alert.alert("Error", "Could not load your account. Please sign in again.");
    return;
  }

  if (!isUuid(split.id)) {
    Alert.alert("Error", "Could not send request for this split.");
    return;
  }

  let ownerId = split.creator_id;

  if (!isUuid(ownerId)) {
    const { data: splitOwner, error: ownerError } = await supabase
      .from("splits")
      .select("creator_id")
      .eq("id", split.id)
      .single();

    if (ownerError) {
      console.error("Error loading split owner:", ownerError);
    }

    ownerId = splitOwner?.creator_id;
  }

  if (!isUuid(ownerId)) {
    Alert.alert("Error", "Could not find the split owner.");
    return;
  }

  if (ownerId === requesterId) {
    Alert.alert("No request needed", "You created this split.");
    return;
  }

  const amount = Math.abs(split.myBalance);

  if (amount <= 0.005) {
    Alert.alert("No request needed", "This split is already settled.");
    return;
  }

  const { data: existingRequests, error: existingRequestError } = await supabase
    .from("money_requests")
    .select("id")
    .eq("split_id", split.id)
    .eq("requester_id", requesterId)
    .eq("owner_id", ownerId)
    .eq("status", "pending")
    .limit(1);

  if (existingRequestError) {
    console.error("Error checking request:", existingRequestError);
  } else if ((existingRequests ?? []).length > 0) {
    setSplits((prev) => prev.map((item) => item.id === split.id ? { ...item, paymentRequested: true } : item));
    Alert.alert("Already sent", "Your payment request is already waiting for the split owner.");
    return;
  }

  const { error } = await supabase.from("money_requests").insert([
    {
      split_id: split.id,
      requester_id: requesterId,
      owner_id: ownerId,
      amount: amount,
      status: "pending",
    },
  ]);

  if (error) {
    console.error("Error creating request:", error);
    Alert.alert("Error", error.message || "Could not send payment request.");
  } else {
    setSplits((prev) => prev.map((item) => item.id === split.id ? { ...item, paymentRequested: true } : item));
    Alert.alert(
      "Request successfully sent",
      "Waiting for the split owner to confirm your payment."
    );
  }
};

  const confirmDeleteSplit = (splitToDelete?: Split) => {
    const targetSplit = splitToDelete ?? selectedSplit;
    if (!targetSplit) return;

    Alert.alert(
      "Delete Split",
      `Are you sure you want to delete "${targetSplit.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteSplit(targetSplit),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppBackground />
      {backgroundMode === "default" ? (
        <>
          <FloatingOrb style={styles.orb1} />
          <FloatingOrb style={styles.orb2} />
        </>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={Keyboard.dismiss}
        keyboardShouldPersistTaps="never"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshSplits}
            tintColor={C.accentBright}
            colors={[C.accent]}
          />
        }
      >

        {/* ── HEADER ── */}
        <Animated.View style={[styles.header, headerAnim]}>
          <View style={styles.headerLeft}>
            <View style={styles.sparkleWrap}>
              <House size={18} color={C.accent} />
            </View>
            <View>
              <Text style={styles.headerEyebrow}>Overview</Text>
              <Text style={styles.headerTitle}>Your Splits</Text>
            </View>
          </View>
          <View style={styles.splitCount}>
            <Text style={styles.splitCountText}>{splits.length}</Text>
          </View>
        </Animated.View>

        {/* ── SUMMARY CARDS ── */}
        <View style={styles.summaryRow}>
          <Animated.View style={[styles.summaryCard, { borderColor: C.green + "44" }, owedSummaryAnim]}>
            <TrendingUp size={14} color={C.green} />
            <Text style={styles.summaryLabel}>You are owed</Text>
            <Text style={[styles.summaryValue, { color: C.green }]}>${totalOwed.toFixed(2)}</Text>
          </Animated.View>
          <Animated.View style={[styles.summaryCard, { borderColor: C.red + "44" }, oweSummaryAnim]}>
            <TrendingUp size={14} color={C.red} style={{ transform: [{ rotate: "180deg" }] }} />
            <Text style={styles.summaryLabel}>You owe</Text>
            <Text style={[styles.summaryValue, { color: C.red }]}>${totalOwe.toFixed(2)}</Text>
          </Animated.View>
          <Animated.View style={[styles.summaryCard, { borderColor: C.accent + "44" }, splitsSummaryAnim]}>
            <Receipt size={14} color={C.accent} />
            <Text style={styles.summaryLabel}>Splits</Text>
            <Text style={[styles.summaryValue, { color: C.accent }]}>{splits.length}</Text>
          </Animated.View>
        </View>

        {/* ── FILTERS ── */}
        <Animated.View style={[styles.filterPanel, filterAnim]}>
          <Pressable style={styles.filterButton} onPress={() => setFilterOpen((open) => !open)}>
            <View style={styles.filterTitleRow}>
              <View style={styles.filterIconWrap}>
                <SlidersHorizontal size={15} color={C.accentBright} />
              </View>
              <View>
                <Text style={styles.filterEyebrow}>Filter</Text>
                <Text style={styles.filterTitle}>Show: {activeFilterOption.label}</Text>
              </View>
            </View>
            <View style={styles.filterButtonRight}>
              <Text style={styles.filterCount}>{filteredSplits.length}/{splits.length}</Text>
              <Animated.View style={[styles.filterChevron, filterChevronAnim]}>
                <ChevronDown size={16} color={C.accentBright} />
              </Animated.View>
            </View>
          </Pressable>

          <Animated.View style={[styles.filterOptionsWrap, filterOptionsAnim]} pointerEvents={filterOpen ? "auto" : "none"}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
              {FILTER_OPTIONS.map((option) => {
                const isActive = activeFilter === option.id;
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.filterPill, isActive && styles.filterPillActive]}
                    onPress={() => {
                      setActiveFilter(option.id);
                      setFilterOpen(false);
                    }}
                  >
                    <Text style={[styles.filterPillLabel, isActive && styles.filterPillLabelActive]}>{option.label}</Text>
                    <Text style={[styles.filterPillMeta, isActive && styles.filterPillMetaActive]}>
                      {filterCounts[option.id]} - {option.hint}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </Animated.View>

        {/* ── SPLITS LIST ── */}
        {loading && (
          <Animated.View style={[styles.loadingState, contentAnim]}>
            <Text style={styles.loadingText}>Loading your splits…</Text>
          </Animated.View>
        )}

        {!loading && splits.length === 0 && (
          <Animated.View style={[styles.emptyState, contentAnim]}>
            <View style={styles.emptyIcon}>
              <Receipt size={28} color={C.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No splits yet</Text>
            <Text style={styles.emptySubtitle}>Tap the + tab below to create your first split</Text>
          </Animated.View>
        )}

        {!loading && splits.length > 0 && filteredSplits.length === 0 && (
          <Animated.View style={[styles.emptyState, contentAnim]}>
            <View style={styles.emptyIcon}>
              <SlidersHorizontal size={28} color={C.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySubtitle}>
              No splits match {activeFilterOption.label}. Try All to see everything.
            </Text>
          </Animated.View>
        )}

        <View>
          {filteredSplits.map((split, index) => (
            <SplitCard
              key={`${activeFilter}-${split.id}`}
              split={split}
              currentUserId={currentUserId}
              entryDelay={280 + Math.min(index, 6) * 45}
              isFocused={isFocused}
              onMenuOpen={openActionMenu}
              onDelete={confirmDeleteSplit}
              onRequestPayment={handleRequestPayment}
              palette={C}
              styles={styles}
            />
          ))}
        </View>
      </ScrollView>

      {/* ── ACTION POPOVER ── */}
      <Modal visible={actionMenuVisible} animationType="fade" transparent onRequestClose={closeActionMenu}>
        <Pressable style={styles.popoverOverlay} onPress={closeActionMenu}>
          <Pressable style={[styles.popoverMenu, { top: menuPosition.y, left: menuPosition.x }]} onPress={(e) => e.stopPropagation()}>
            <Pressable style={styles.popoverItem} onPress={openEditModal}>
              <Edit2 size={15} color={C.textPrimary} />
              <Text style={styles.popoverItemText}>Edit</Text>
            </Pressable>
            <View style={styles.popoverDivider} />
            <Pressable style={styles.popoverItem} onPress={() => { confirmDeleteSplit(); closeActionMenu(); }}>
              <Trash2 size={15} color={C.red} />
              <Text style={styles.popoverDeleteText}>Delete</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal visible={editModalVisible} animationType="fade" transparent onRequestClose={closeEditModal}>
        <Pressable style={styles.modalOverlay} onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalKeyboardWrap}
          >
          <Animated.View style={styles.modalSheet}>
          <Pressable style={styles.modalSheetContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Edit Split</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="never"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            >
              <Text style={styles.modalLabel}>Split Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Enter split name"
                placeholderTextColor={C.textMuted}
              />

              <Text style={styles.modalLabel}>Total Amount</Text>
              <View style={styles.modalAmountRow}>
                <Text style={styles.modalAmountSign}>$</Text>
                <TextInput
                  style={[styles.modalInput, { flex: 1, borderWidth: 0 }]}
                  value={editTotal}
                  onChangeText={(value) => setEditTotal(cleanNumberInput(value))}
                  placeholder="0.00"
                  placeholderTextColor={C.textMuted}
                  keyboardType="numeric"
                />
              </View>

              {totalAmount > 0 && (
                <View style={styles.allocationRow}>
                  <Text style={styles.allocationText}>Your share: <Text style={{ color: C.accentBright }}>${creatorShare.toFixed(2)}</Text></Text>
                  <Text style={styles.allocationText}>Allocated: <Text style={{ color: editOverAllocated ? C.red : C.green }}>${allocated.toFixed(2)}</Text> / ${totalAmount.toFixed(2)}</Text>
                </View>
              )}

              {loadingEditData ? (
                <Text style={styles.loadingText}>Loading members…</Text>
              ) : (
                <>
                  {editMembers.length > 0 && (
                    <>
                      <Text style={styles.modalLabel}>Members</Text>
                      {editMembers.map((member) => (
                        <View key={member.id} style={styles.memberRow}>
                          <View style={styles.memberAvatar}>
                            <Text style={styles.memberAvatarText}>{member.full_name?.charAt(0)?.toUpperCase()}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.memberName}>{member.full_name}</Text>
                            {!!member.username && <Text style={styles.memberHandle}>@{member.username}</Text>}
                          </View>
                          <View style={styles.memberAmountBox}>
                            <Text style={styles.memberAmountSign}>$</Text>
                            <TextInput
                              style={styles.memberAmountInput}
                              value={member.shareAmountInput}
                              onChangeText={(val) => updateMemberShare(member.id, val)}
                              keyboardType="decimal-pad"
                              placeholder="0.00"
                              placeholderTextColor={C.textMuted}
                            />
                          </View>
                          <Pressable style={styles.removeBtn} onPress={() => removeMemberFromEdit(member.id)}>
                            <Text style={styles.removeBtnText}>✕</Text>
                          </Pressable>
                        </View>
                      ))}
                    </>
                  )}

                  {availableFriends.length > 0 && (
                    <>
                      <Text style={styles.modalLabel}>Add Friends</Text>
                      <View style={styles.friendChips}>
                        {availableFriends.map((friend) => (
                          <Pressable key={friend.id} style={styles.friendChip} onPress={() => addMemberToEdit(friend)}>
                            <Text style={styles.friendChipText}>{friend.full_name} +</Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}

                  {availableFriends.length === 0 && editMembers.length === 0 && (
                    <Text style={styles.noFriendsText}>Add friends from the Profile tab to split with them.</Text>
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={closeEditModal}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalSaveBtn, isSaving && { opacity: 0.6 }]} onPress={saveSplitEdits} disabled={isSaving}>
                <Text style={styles.modalSaveText}>{isSaving ? "Saving…" : "Save Changes"}</Text>
              </Pressable>
            </View>
          </Pressable>
          </Animated.View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(C: typeof THEME_PALETTES.dark) {
return StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 140 },

  orb1: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: C.orbPrimary, top: -100, right: -80 },
  orb2: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: C.orbSecondary, bottom: 100, left: -70 },

  // header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  sparkleWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.accentDim, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.accent + "55" },
  headerEyebrow: { fontSize: 11, color: C.textSecondary, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1.2 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.8, marginTop: -2 },
  splitCount: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.accentDim, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.accent + "44" },
  splitCountText: { color: C.accentBright, fontWeight: "800", fontSize: 14 },

  // summary
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  summaryCard: { flex: 1, backgroundColor: C.card, borderRadius: 18, padding: 12, alignItems: "center", borderWidth: 1, gap: 4 },
  summaryLabel: { fontSize: 9, color: C.textSecondary, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6, textAlign: "center" },
  summaryValue: { fontSize: 16, fontWeight: "800" },
  filterPanel: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 18,
    overflow: "hidden",
  },
  filterButton: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  filterButtonRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterChevron: { width: 30, height: 30, borderRadius: 10, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent + "33", alignItems: "center", justifyContent: "center" },
  filterTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  filterTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  filterIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent + "44", alignItems: "center", justifyContent: "center" },
  filterEyebrow: { fontSize: 10, color: C.textSecondary, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  filterTitle: { fontSize: 15, color: C.textPrimary, fontWeight: "800", marginTop: 1 },
  filterCount: { color: C.accentBright, fontSize: 12, fontWeight: "800", backgroundColor: C.accentDim, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, overflow: "hidden" },
  filterOptionsWrap: { overflow: "hidden" },
  filterPills: { gap: 8, paddingRight: 4 },
  filterPill: { minWidth: 112, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 10 },
  filterPillActive: { backgroundColor: C.accent, borderColor: C.accentBright },
  filterPillLabel: { color: C.textPrimary, fontSize: 13, fontWeight: "800" },
  filterPillLabelActive: { color: "#fff" },
  filterPillMeta: { color: C.textMuted, fontSize: 10, fontWeight: "700", marginTop: 3 },
  filterPillMetaActive: { color: "rgba(255,255,255,0.82)" },

  // split card
  card: {
    backgroundColor: C.card, borderRadius: 20, marginBottom: 14,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
    shadowColor: C.accent, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  cardAccentLine: { height: 2, width: "100%" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, paddingBottom: 10 },
  cardIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.accentDim, justifyContent: "center", alignItems: "center" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: C.textPrimary },
  cardDate: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  cardOwner: { fontSize: 11, color: C.accentBright, marginTop: 2, fontWeight: "700" },
  menuTrigger: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.surface, justifyContent: "center", alignItems: "center" },
  menuDots: { fontSize: 18, color: C.textSecondary, lineHeight: 20 },

  cardBalances: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 12, gap: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: "700" },
  balanceGroup: { flexDirection: "row", alignItems: "center", gap: 12 },
  balanceItem: { alignItems: "flex-end" },
  balanceLabel: { fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.6 },
  balanceValue: { fontSize: 14, fontWeight: "700", color: C.textPrimary },
  balanceDivider: { width: 1, height: 24, backgroundColor: C.border },
  paymentActionWrap: { paddingHorizontal: 14, paddingBottom: 12 },
  paymentActionButton: { backgroundColor: C.accentDim, borderRadius: 10, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: C.accent + "55" },
  paymentActionButtonSent: { backgroundColor: C.greenDim, borderColor: C.green + "44" },
  paymentActionText: { color: C.accentBright, fontWeight: "700" },
  paymentActionTextSent: { color: C.green },

  cardFriends: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingBottom: 12, flexWrap: "wrap" },
  friendsLabel: { fontSize: 10, color: C.textMuted },
  friendPills: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  friendPill: { backgroundColor: C.accentDim, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: C.accent + "33" },
  friendPillText: { fontSize: 10, color: C.accentBright, fontWeight: "600" },
  friendPillExtra: { backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  friendPillExtraText: { fontSize: 10, color: C.textSecondary },

  // swipe delete
  swipeDelete: { width: 88, marginBottom: 14, borderRadius: 20, backgroundColor: C.red, alignItems: "center", justifyContent: "center", gap: 4 },
  swipeDeleteText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  // empty / loading
  emptyState: { alignItems: "center", paddingVertical: 64 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: C.surface, justifyContent: "center", alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: C.border },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.textPrimary, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: C.textMuted, textAlign: "center" },
  loadingState: { paddingVertical: 48, alignItems: "center" },
  loadingText: { fontSize: 13, color: C.textMuted },

  // action popover
  popoverOverlay: { flex: 1 },
  popoverMenu: { position: "absolute", width: 160, backgroundColor: C.cardBright, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingVertical: 4, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  popoverItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  popoverItemText: { fontSize: 14, color: C.textPrimary, fontWeight: "500" },
  popoverDeleteText: { fontSize: 14, color: C.red, fontWeight: "500" },
  popoverDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 10 },

  // edit modal
  modalOverlay: { flex: 1, backgroundColor: C.mode === "dark" ? `${C.bg}d9` : "rgba(24,24,38,0.24)", justifyContent: "center", paddingHorizontal: 16 },
  modalKeyboardWrap: { flex: 1, justifyContent: "center" },
  modalSheet: { backgroundColor: C.card, borderRadius: 28, padding: 20, paddingBottom: 24, maxHeight: "78%", borderWidth: 1, borderColor: C.border, shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  modalSheetContent: {},
  modalTitle: { fontSize: 20, fontWeight: "800", color: C.textPrimary, marginBottom: 20, letterSpacing: -0.3 },
  modalLabel: { fontSize: 11, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  modalInput: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.textPrimary },
  modalAmountRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14 },
  modalAmountSign: { fontSize: 16, color: C.textSecondary, marginRight: 4 },
  allocationRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingHorizontal: 4 },
  allocationText: { fontSize: 12, color: C.textSecondary },

  // member row
  memberRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.accentDim, justifyContent: "center", alignItems: "center" },
  memberAvatarText: { color: C.accentBright, fontWeight: "700" },
  memberName: { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  memberHandle: { fontSize: 11, color: C.textSecondary },
  memberAmountBox: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 8, paddingHorizontal: 8, borderWidth: 1, borderColor: C.border },
  memberAmountSign: { fontSize: 13, color: C.textSecondary },
  memberAmountInput: { width: 64, paddingVertical: 6, fontSize: 14, fontWeight: "700", color: C.accentBright, textAlign: "right" },
  removeBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.redDim, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.red + "44" },
  removeBtnText: { color: C.red, fontWeight: "700", fontSize: 12 },

  // friend chips
  friendChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  friendChip: { backgroundColor: C.accentDim, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: C.accent + "44" },
  friendChipText: { color: C.accentBright, fontSize: 13, fontWeight: "600" },
  noFriendsText: { marginTop: 16, color: C.textMuted, fontSize: 13, textAlign: "center" },

  // modal actions
  modalActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  modalCancelBtn: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingVertical: 14, alignItems: "center", backgroundColor: C.surface },
  modalCancelText: { fontSize: 15, fontWeight: "600", color: C.textSecondary },
  modalSaveBtn: { flex: 1, borderRadius: 14, backgroundColor: C.accent, paddingVertical: 14, alignItems: "center", shadowColor: C.accent, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  modalSaveText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
}
