import { AppBackground } from "@/lib/app-background";
import { useAppTheme } from "@/lib/app-theme";
import { supabase } from "@/lib/supabaseClient";
import { useIsFocused } from "@react-navigation/native";
import { Bell, Check, DollarSign, Inbox, UserPlus, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type InboxSection = "friends" | "money";
type FriendRequestTab = "incoming" | "sent";

// ─── Section spring entrance ────────────────────────────────────────────────

function useSpringEntrance(delay = 0, trigger = true) {
  const scale = useRef(new Animated.Value(0.82)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (!trigger) {
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
  }, [trigger, delay, scale, opacity, translateY]);

  return { scale, opacity, translateY };
}

// ─── FloatingOrb (unchanged) ────────────────────────────────────────────────

function FloatingOrb({ style }: { style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.18)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.18, duration: 3200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.28, duration: 3200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 3200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.18, duration: 3200, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, scale]);

  return <Animated.View pointerEvents="none" style={[style, { opacity, transform: [{ scale }] }]} />;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function InboxScreen() {
  const isFocused = useIsFocused();
  const { palette: C, backgroundMode } = useAppTheme();
  const styles = createStyles(C);

  const [activeSection, setActiveSection] = useState<InboxSection>("friends");
  const [activeFriendTab, setActiveFriendTab] = useState<FriendRequestTab>("incoming");
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [sentFriendRequests, setSentFriendRequests] = useState<any[]>([]);
  const [moneyRequests, setMoneyRequests] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Spring entrances — re-trigger on every focus
  const headerSpring = useSpringEntrance(60, isFocused);
  const heroSpring = useSpringEntrance(140, isFocused);
  const optionsSpring = useSpringEntrance(210, isFocused);
  const listSpring = useSpringEntrance(280, isFocused);

  const sectionOpacity = useRef(new Animated.Value(1)).current;
  const sectionTranslate = useRef(new Animated.Value(0)).current;

  const loadFriendRequests = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from("friend_requests")
      .select(`id, requester_id, requester:profiles!requester_id ( full_name, username )`)
      .eq("addressee_id", currentUserId)
      .eq("status", "pending");

    if (error) { console.error("Error loading friend requests:", error); return; }

    setFriendRequests(
      data?.map((r: any) => ({
        id: r.id,
        name: r.requester?.full_name || "Unknown User",
        username: r.requester?.username || "unknown",
      })) ?? []
    );
  }, []);

  const loadSentFriendRequests = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from("friend_requests")
      .select(`id, addressee_id, addressee:profiles!addressee_id ( full_name, username )`)
      .eq("requester_id", currentUserId)
      .eq("status", "pending");

    if (error) { console.error("Error loading sent friend requests:", error); return; }

    setSentFriendRequests(
      data?.map((r: any) => ({
        id: r.id,
        name: r.addressee?.full_name || "Unknown User",
        username: r.addressee?.username || "unknown",
      })) ?? []
    );
  }, []);

  const loadMoneyRequests = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from("money_requests")
      .select(`id, split_id, requester_id, amount, status, requester:profiles!requester_id ( full_name, username )`)
      .eq("owner_id", currentUserId)
      .eq("status", "pending");

    if (error) { console.error("Error loading money requests:", error); return; }

    setMoneyRequests(
      data?.map((r: any) => ({
        id: r.id,
        splitId: r.split_id,
        requesterId: r.requester_id,
        amount: Number(r.amount),
        name: r.requester?.full_name || "Unknown User",
        username: r.requester?.username || "unknown",
      })) ?? []
    );
  }, []);

  const refreshInbox = useCallback(async () => {
    setRefreshing(true);
    try { await Promise.all([loadFriendRequests(), loadSentFriendRequests(), loadMoneyRequests()]); }
    finally { setRefreshing(false); }
  }, [loadFriendRequests, loadMoneyRequests, loadSentFriendRequests]);

  useEffect(() => {
    if (!isFocused) return;
    refreshInbox();
  }, [isFocused, refreshInbox]);

  useEffect(() => {
    sectionOpacity.setValue(0);
    Animated.timing(sectionOpacity, {
      toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [activeSection, activeFriendTab, sectionOpacity]);

  useEffect(() => {
    if (!isFocused) return;
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (!active || !uid) return;

      channel = supabase
        .channel(`inbox-${uid}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "friend_requests", filter: `addressee_id=eq.${uid}` }, loadFriendRequests)
        .on("postgres_changes", { event: "*", schema: "public", table: "friend_requests", filter: `requester_id=eq.${uid}` }, loadSentFriendRequests)
        .on("postgres_changes", { event: "*", schema: "public", table: "money_requests", filter: `owner_id=eq.${uid}` }, loadMoneyRequests)
        .subscribe();
    });

    return () => { active = false; if (channel) supabase.removeChannel(channel); };
  }, [isFocused, loadFriendRequests, loadMoneyRequests, loadSentFriendRequests]);

  const handleAcceptFriendRequest = async (requestId: string) => {
    const { data: request, error: fetchError } = await supabase.from("friend_requests").select("*").eq("id", requestId).single();
    if (fetchError) return console.error(fetchError);
    const { error: updateError } = await supabase.from("friend_requests").update({ status: "accepted" }).eq("id", requestId);
    if (updateError) return console.error(updateError);
    const { error: friendError } = await supabase.from("friends").insert([
      { user_id: request.requester_id, friend_id: request.addressee_id },
      { user_id: request.addressee_id, friend_id: request.requester_id },
    ]);
    if (friendError) return console.error(friendError);
    await Promise.all([loadFriendRequests(), loadSentFriendRequests()]);
  };

  const handleDeclineFriendRequest = async (requestId: string) => {
    const { error } = await supabase.from("friend_requests").update({ status: "declined" }).eq("id", requestId);
    if (error) return console.error(error);
    await loadFriendRequests();
  };

  const handleAcceptMoneyRequest = async (requestId: string) => {
    const { data: request, error: fetchError } = await supabase.from("money_requests").select("*").eq("id", requestId).single();
    if (fetchError) return console.error(fetchError);
    const { split_id, requester_id, amount } = request;
    const { data: memberRow, error: memberError } = await supabase.from("split_members").select("id, share_amount").eq("split_id", split_id).eq("profile_id", requester_id).single();
    if (memberError) return console.error(memberError);
    let newAmount = Number(memberRow.share_amount ?? 0) + Number(amount);
    if (newAmount > 0) newAmount = 0;
    const { error: updateMemberError } = await supabase.from("split_members").update({ share_amount: newAmount }).eq("id", memberRow.id);
    if (updateMemberError) return console.error(updateMemberError);
    const { error: updateRequestError } = await supabase.from("money_requests").update({ status: "accepted" }).eq("id", requestId);
    if (updateRequestError) return console.error(updateRequestError);
    await loadMoneyRequests();
  };

  const handleDeclineMoneyRequest = async (requestId: string) => {
    const { error } = await supabase.from("money_requests").update({ status: "declined" }).eq("id", requestId);
    if (error) return console.error(error);
    await loadMoneyRequests();
  };

  const totalCount = friendRequests.length + moneyRequests.length;
  const friendSectionCount = friendRequests.length + sentFriendRequests.length;
  const activeRequests = activeSection === "friends" ? friendRequests : moneyRequests;
  const activeFriendRequests = activeFriendTab === "incoming" ? friendRequests : sentFriendRequests;

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <AppBackground />

      {backgroundMode === "default" ? (
        <>
          <FloatingOrb style={styles.orb1} />
          <FloatingOrb style={styles.orb2} />
        </>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshInbox} tintColor={C.accentBright} colors={[C.accent]} />
        }
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerSpring.opacity, transform: [{ scale: headerSpring.scale }, { translateY: headerSpring.translateY }] }]}>
          <View style={styles.headerLeft}>
            <View style={styles.bellWrap}>
              <Bell size={19} color={C.accent} />
              {totalCount > 0 ? <View style={styles.bellDot} /> : null}
            </View>
            <View>
              <Text style={styles.headerEyebrow}>Notifications</Text>
              <Text style={styles.headerTitle}>Inbox</Text>
            </View>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalCount} new</Text>
          </View>
        </Animated.View>

        {/* Hero card */}
        <Animated.View style={[styles.heroCard, { opacity: heroSpring.opacity, transform: [{ scale: heroSpring.scale }, { translateY: heroSpring.translateY }] }]}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroEyebrow}>Requests</Text>
          <Text style={styles.heroTitle}>{totalCount > 0 ? "You have things waiting" : "All caught up"}</Text>
          <Text style={styles.heroSubtitle}>
            Friend requests and money requests live here now, away from your profile.
          </Text>
        </Animated.View>

        {/* Option grid */}
        <Animated.View style={[styles.optionGrid, { opacity: optionsSpring.opacity, transform: [{ scale: optionsSpring.scale }, { translateY: optionsSpring.translateY }] }]}>
          <Pressable style={[styles.optionCard, activeSection === "friends" && styles.optionCardActive]} onPress={() => setActiveSection("friends")}>
            <View style={styles.optionTop}>
              <View style={styles.optionIcon}><UserPlus size={18} color={C.accentBright} /></View>
              {friendSectionCount > 0 ? <View style={styles.optionBadge}><Text style={styles.optionBadgeText}>{friendSectionCount}</Text></View> : null}
            </View>
            <Text style={styles.optionTitle}>Friend Requests</Text>
            <Text style={styles.optionSubtitle}>Incoming and sent pending requests</Text>
          </Pressable>

          <Pressable style={[styles.optionCard, activeSection === "money" && styles.optionCardActive]} onPress={() => setActiveSection("money")}>
            <View style={styles.optionTop}>
              <View style={styles.optionIcon}><DollarSign size={18} color={C.green} /></View>
              {moneyRequests.length > 0 ? <View style={[styles.optionBadge, styles.moneyBadge]}><Text style={styles.optionBadgeText}>{moneyRequests.length}</Text></View> : null}
            </View>
            <Text style={styles.optionTitle}>Money Requests</Text>
            <Text style={styles.optionSubtitle}>Payments waiting for review</Text>
          </Pressable>
        </Animated.View>

        {/* List card */}
        <Animated.View style={[styles.glassCard, { opacity: listSpring.opacity, transform: [{ scale: listSpring.scale }, { translateY: listSpring.translateY }] }]}>
          <View style={styles.sectionTop}>
            <View>
              <Text style={styles.sectionEyebrow}>{activeSection === "friends" ? "Friends" : "Money"}</Text>
              <Text style={styles.sectionTitle}>{activeSection === "friends" ? "Friend Requests" : "Money Requests"}</Text>
            </View>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{activeSection === "friends" ? friendSectionCount : activeRequests.length}</Text>
            </View>
          </View>

          {activeSection === "friends" ? (
            <View style={styles.friendRequestSwitch}>
              <Pressable
                style={[styles.friendRequestSwitchButton, activeFriendTab === "incoming" && styles.friendRequestSwitchButtonActive]}
                onPress={() => setActiveFriendTab("incoming")}
              >
                <Text style={[styles.friendRequestSwitchText, activeFriendTab === "incoming" && styles.friendRequestSwitchTextActive]}>
                  Requests
                </Text>
                {friendRequests.length > 0 ? (
                  <View style={styles.friendRequestSwitchBadge}>
                    <Text style={styles.friendRequestSwitchBadgeText}>{friendRequests.length}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                style={[styles.friendRequestSwitchButton, activeFriendTab === "sent" && styles.friendRequestSwitchButtonActive]}
                onPress={() => setActiveFriendTab("sent")}
              >
                <Text style={[styles.friendRequestSwitchText, activeFriendTab === "sent" && styles.friendRequestSwitchTextActive]}>
                  Pending Sent
                </Text>
                {sentFriendRequests.length > 0 ? (
                  <View style={styles.friendRequestSwitchBadge}>
                    <Text style={styles.friendRequestSwitchBadgeText}>{sentFriendRequests.length}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
          ) : null}

          <Animated.View style={{ opacity: sectionOpacity, transform: [{ translateY: sectionTranslate }] }}>
            {activeSection === "friends" && activeFriendRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Inbox size={28} color={C.textMuted} />
                <Text style={styles.emptyTitle}>{activeFriendTab === "incoming" ? "No requests right now" : "No pending sent requests"}</Text>
                <Text style={styles.emptySubtitle}>
                  {activeFriendTab === "incoming" ? "Requests people send to you will show up here." : "Friend requests you send will stay here until they answer."}
                </Text>
              </View>
            ) : activeSection === "money" && activeRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Inbox size={28} color={C.textMuted} />
                <Text style={styles.emptyTitle}>No money requests</Text>
                <Text style={styles.emptySubtitle}>Payment requests will show up here.</Text>
              </View>
            ) : activeSection === "friends" ? (
              <>
                {activeFriendTab === "incoming" ? (
                  friendRequests.map((request) => (
                    <View key={request.id} style={styles.requestCard}>
                      <View style={styles.requestInfo}>
                        <View style={styles.friendAvatar}>
                          <Text style={styles.avatarText}>{request.name ? request.name.charAt(0).toUpperCase() : "?"}</Text>
                        </View>
                        <View style={styles.requestBody}>
                          <Text style={styles.requestName}>{request.name}</Text>
                          <Text style={styles.requestMeta}>@{request.username}</Text>
                        </View>
                      </View>
                      <View style={styles.requestActions}>
                        <Pressable style={styles.acceptButton} onPress={() => handleAcceptFriendRequest(request.id)}>
                          <Check size={15} color="#fff" /><Text style={styles.requestButtonText}>Accept</Text>
                        </Pressable>
                        <Pressable style={styles.declineButton} onPress={() => handleDeclineFriendRequest(request.id)}>
                          <X size={15} color="#fff" /><Text style={styles.requestButtonText}>Decline</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                ) : (
                  sentFriendRequests.map((request) => (
                    <View key={request.id} style={styles.requestCard}>
                      <View style={[styles.requestInfo, styles.pendingSentInfo]}>
                        <View style={styles.friendAvatar}>
                          <Text style={styles.avatarText}>{request.name ? request.name.charAt(0).toUpperCase() : "?"}</Text>
                        </View>
                        <View style={styles.requestBody}>
                          <Text style={styles.requestName}>{request.name}</Text>
                          <Text style={styles.requestMeta}>@{request.username}</Text>
                          <Text style={styles.pendingText}>Waiting for them to accept</Text>
                        </View>
                        <View style={styles.pendingPill}>
                          <Text style={styles.pendingPillText}>Pending</Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </>
            ) : (
              moneyRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestInfo}>
                    <View style={styles.moneyAvatar}>
                      <DollarSign size={17} color={C.green} />
                    </View>
                    <View style={styles.requestBody}>
                      <Text style={styles.requestName}>{request.name}</Text>
                      <Text style={styles.requestMeta}>@{request.username}</Text>
                      <Text style={styles.moneyText}>Wants to pay: ${request.amount.toFixed(2)}</Text>
                    </View>
                  </View>
                  <View style={styles.requestActions}>
                    <Pressable style={styles.acceptButton} onPress={() => handleAcceptMoneyRequest(request.id)}>
                      <Check size={15} color="#fff" /><Text style={styles.requestButtonText}>Accept</Text>
                    </Pressable>
                    <Pressable style={styles.declineButton} onPress={() => handleDeclineMoneyRequest(request.id)}>
                      <X size={15} color="#fff" /><Text style={styles.requestButtonText}>Decline</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (C: ReturnType<typeof useAppTheme>["palette"]) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: C.bg },
    container: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 140 },
    orb1: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: C.orbPrimary, top: -90, right: -80 },
    orb2: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: C.orbSecondary, bottom: 140, left: -70 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    bellWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.accentDim, borderWidth: 1, borderColor: `${C.accent}55`, alignItems: "center", justifyContent: "center", position: "relative" },
    bellDot: { position: "absolute", top: 8, right: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: C.red, borderWidth: 1, borderColor: C.card },
    headerEyebrow: { fontSize: 11, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 1.2 },
    headerTitle: { fontSize: 28, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.8, marginTop: -2 },
    headerBadge: { backgroundColor: C.card, borderRadius: 999, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 8 },
    headerBadgeText: { color: C.textSecondary, fontSize: 11, fontWeight: "700" },
    heroCard: { backgroundColor: C.cardBright, borderRadius: 26, borderWidth: 1, borderColor: C.borderBright, padding: 20, marginBottom: 14, overflow: "hidden" },
    heroGlow: { position: "absolute", top: 0, left: "12%", right: "12%", height: 1, backgroundColor: C.accent, opacity: 0.25 },
    heroEyebrow: { color: C.accentBright, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 10 },
    heroTitle: { color: C.textPrimary, fontSize: 28, fontWeight: "800", letterSpacing: -0.7, marginBottom: 10 },
    heroSubtitle: { color: C.textSecondary, fontSize: 14, lineHeight: 22 },
    optionGrid: { flexDirection: "row", gap: 12, marginBottom: 14 },
    optionCard: { flex: 1, minHeight: 134, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 14 },
    optionCardActive: { borderColor: C.accent, backgroundColor: C.accentDim },
    optionTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
    optionIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
    optionBadge: { minWidth: 25, height: 25, borderRadius: 13, paddingHorizontal: 7, backgroundColor: C.red, alignItems: "center", justifyContent: "center" },
    moneyBadge: { backgroundColor: C.green },
    optionBadgeText: { color: "#fff", fontSize: 11, fontWeight: "900" },
    optionTitle: { color: C.textPrimary, fontSize: 15, fontWeight: "800", marginBottom: 5 },
    optionSubtitle: { color: C.textSecondary, fontSize: 11, lineHeight: 16 },
    glassCard: { backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 14 },
    sectionTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, gap: 12 },
    sectionEyebrow: { fontSize: 11, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 3 },
    sectionTitle: { fontSize: 20, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.4 },
    sectionBadge: { backgroundColor: C.surface, borderRadius: 999, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 6 },
    sectionBadgeText: { color: C.textSecondary, fontSize: 11, fontWeight: "700" },
    friendRequestSwitch: { flexDirection: "row", gap: 8, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 5, marginBottom: 14 },
    friendRequestSwitchButton: { flex: 1, minHeight: 42, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 8 },
    friendRequestSwitchButtonActive: { backgroundColor: C.accent, shadowColor: C.accent, shadowOpacity: 0.26, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
    friendRequestSwitchText: { color: C.textSecondary, fontSize: 12, fontWeight: "800" },
    friendRequestSwitchTextActive: { color: "#fff" },
    friendRequestSwitchBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: C.red, paddingHorizontal: 6 },
    friendRequestSwitchBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
    emptyState: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingVertical: 28, paddingHorizontal: 16, alignItems: "center" },
    emptyTitle: { fontSize: 14, fontWeight: "800", color: C.textPrimary, textAlign: "center", marginTop: 10 },
    emptySubtitle: { fontSize: 12, color: C.textSecondary, textAlign: "center", marginTop: 6, lineHeight: 18 },
    requestCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 10 },
    requestInfo: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 },
    pendingSentInfo: { marginBottom: 0 },
    friendAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.accentDim, borderWidth: 1, borderColor: `${C.accent}44`, alignItems: "center", justifyContent: "center" },
    moneyAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.greenDim, borderWidth: 1, borderColor: `${C.green}44`, alignItems: "center", justifyContent: "center" },
    avatarText: { color: C.accentBright, fontWeight: "800", fontSize: 15 },
    requestBody: { flex: 1 },
    requestName: { fontSize: 14, fontWeight: "800", color: C.textPrimary },
    requestMeta: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
    pendingText: { fontSize: 11, color: C.amber, fontWeight: "700", marginTop: 5 },
    pendingPill: { borderRadius: 999, backgroundColor: C.amberDim, borderWidth: 1, borderColor: `${C.amber}44`, paddingHorizontal: 10, paddingVertical: 6 },
    pendingPillText: { color: C.amber, fontSize: 11, fontWeight: "800" },
    moneyText: { fontSize: 11, color: C.green, fontWeight: "700", marginTop: 5 },
    requestActions: { flexDirection: "row", gap: 8 },
    acceptButton: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", backgroundColor: C.green, borderRadius: 12, paddingVertical: 10 },
    declineButton: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", backgroundColor: C.red, borderRadius: 12, paddingVertical: 10 },
    requestButtonText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  });
