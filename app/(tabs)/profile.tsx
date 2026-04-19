import { AppBackground } from "@/lib/app-background";
import { useAppTheme } from "@/lib/app-theme";
import { AvatarDecoration } from "@/lib/avatar-decoration";
import { supabase } from "@/lib/supabaseClient";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { Check, ChevronDown, ChevronUp, Search, Settings2, UserMinus, UserPlus, UserRound, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, Image, Keyboard, LayoutAnimation, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

function MetricCard({
  label,
  value,
  tone = "accent",
  onPress,
  styles,
}: {
  label: string;
  value: string;
  tone?: "accent" | "green" | "red";
  onPress?: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const toneStyles =
    tone === "green"
      ? { card: styles.metricCardGreen, value: styles.metricValueGreen }
      : tone === "red"
        ? { card: styles.metricCardRed, value: styles.metricValueRed }
        : { card: styles.metricCardAccent, value: styles.metricValueAccent };

  const content = (
    <>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.96}
        numberOfLines={1}
        style={[styles.metricValue, toneStyles.value]}
      >
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={[styles.metricCard, toneStyles.card]} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.metricCard, toneStyles.card]}>{content}</View>;
}

function SectionHeader({
  eyebrow,
  title,
  badge,
  styles,
}: {
  eyebrow: string;
  title: string;
  badge?: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {badge ? (
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

async function loadMutualFriendCounts(currentFriendIds: Set<string>, profileIds: string[]) {
  if (currentFriendIds.size === 0 || profileIds.length === 0) return new Map<string, number>();

  const { data, error } = await supabase
    .from("friends")
    .select("user_id, friend_id")
    .in("user_id", profileIds);

  if (error) {
    console.error("Error loading mutual friends:", error);
    return new Map<string, number>();
  }

  const counts = new Map<string, number>();
  data?.forEach((row: any) => {
    if (!currentFriendIds.has(row.friend_id)) return;
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  });

  return counts;
}

export default function ProfileScreen() {
  const isFocused = useIsFocused();
  const { palette: C, backgroundMode } = useAppTheme();
  const styles = createStyles(C);
  const scrollRef = useRef<ScrollView>(null);
  const friendsSectionY = useRef(0);
  const [searchText, setSearchText] = useState("");
  const [profile, setProfile] = useState({ name: "", username: "", email: "", avatarUrl: "", avatarDecoration: "none", pronouns: "" });
  const [friends, setFriends] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friendSuggestions, setFriendSuggestions] = useState<any[]>([]);
  const [youreOwed, setYoureOwed] = useState(0);
  const [youOwe, setYouOwe] = useState(0);
  const [friendsExpanded, setFriendsExpanded] = useState(true);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);
  const [previewUser, setPreviewUser] = useState<any | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const previewAnim = useRef(new Animated.Value(0)).current;

  const headerAnim = useFadeSlide(60, isFocused);
  const heroAnim = useFadeSlide(140, isFocused);
  const searchAnim = useFadeSlide(210, isFocused);
  const friendsAnim = useFadeSlide(280, isFocused);

  const openProfilePreview = (user: any) => {
    setPreviewUser(user);
    setPreviewVisible(true);
    previewAnim.stopAnimation();
    previewAnim.setValue(0);
    Animated.spring(previewAnim, {
      toValue: 1,
      damping: 16,
      stiffness: 190,
      mass: 0.85,
      useNativeDriver: true,
    }).start();
  };

  const closeProfilePreview = () => {
    previewAnim.stopAnimation();
    Animated.timing(previewAnim, {
      toValue: 0,
      duration: 190,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setPreviewVisible(false);
      setPreviewUser(null);
    });
  };

  const previewScale = previewAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });
  const previewTranslateY = previewAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [34, 0],
  });
  const previewGlowScale = previewAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1.08],
  });

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const loadProfile = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return console.log("No user session found");
    if (sessionError) return console.error("Error getting session:", sessionError);
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (error) return console.error("Error loading profile:", error);
    const metadata = user.user_metadata ?? {};
    if (data) {
      setProfile({
        name: data.full_name || metadata.full_name || "",
        username: data.username || metadata.username || "",
        email: data.email || user.email || "",
        avatarUrl: data.avatar_url || metadata.avatar_url || "",
        avatarDecoration: data.avatar_decoration || metadata.avatar_decoration || "none",
        pronouns: data.pronouns || metadata.pronouns || "",
      });
    }
  };

  const loadSentRequests = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return;
    const { data, error } = await supabase.from("friend_requests").select("addressee_id").eq("requester_id", currentUserId).eq("status", "pending");
    if (error) return console.error("Error loading sent requests:", error);
    setSentRequests(data?.map((item: any) => item.addressee_id) ?? []);
  };

  const loadFriends = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return;
    const { data, error } = await supabase
      .from("friends")
      .select(`friend_id, friend:profiles!friend_id ( id, full_name, username, avatar_url, avatar_decoration, pronouns )`)
      .eq("user_id", currentUserId);
    if (error) return console.error("Error loading friends:", error);
    const friendIds = (data ?? []).map((item: any) => item.friend?.id).filter(Boolean);
    const mutualCounts = await loadMutualFriendCounts(new Set(friendIds), friendIds);
    setFriends(data?.map((item: any) => ({
      id: item.friend?.id,
      name: item.friend?.full_name || "",
      username: item.friend?.username || "",
      avatarUrl: item.friend?.avatar_url || "",
      avatarDecoration: item.friend?.avatar_decoration || "none",
      pronouns: item.friend?.pronouns || "",
      mutualFriends: mutualCounts.get(item.friend?.id) ?? 0,
      isPending: false,
      isFriend: true,
    })) ?? []);
  };

  const loadBalances = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return;
    if (sessionError) return console.error("Error getting session for balances:", sessionError);
    const { data, error } = await supabase
      .from("splits")
      .select(`id, creator_id,
        my_membership:split_members!inner( profile_id, share_amount ),
        all_members:split_members( profile_id, share_amount )`)
      .eq("my_membership.profile_id", currentUserId);
    if (error) return console.error("Error loading balances:", error);
    let owedTotal = 0;
    let oweTotal = 0;
    (data ?? []).forEach((split: any) => {
      const myRow = Array.isArray(split.my_membership) ? split.my_membership[0] : split.my_membership;
      const rawBalance = Number(myRow?.share_amount ?? 0);
      const myBalance = split.creator_id === currentUserId
        ? (split.all_members ?? [])
            .filter((member: any) => member.profile_id !== currentUserId)
            .reduce((sum: number, member: any) => sum + Math.abs(Number(member.share_amount ?? 0)), 0)
        : rawBalance === 0
          ? 0
          : -Math.abs(rawBalance);

      if (myBalance > 0) owedTotal += myBalance;
      else if (myBalance < 0) oweTotal += Math.abs(myBalance);
    });
    setYoureOwed(owedTotal);
    setYouOwe(oweTotal);
  };

  const loadFriendSuggestions = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return;
    if (sessionError) return console.error("Session error:", sessionError);

    const [friendRows, pendingRows, profileRows] = await Promise.all([
      supabase
        .from("friends")
        .select("friend_id")
        .eq("user_id", currentUserId),
      supabase
        .from("friend_requests")
        .select("addressee_id")
        .eq("requester_id", currentUserId)
        .eq("status", "pending"),
      supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, avatar_decoration, pronouns")
        .limit(16),
    ]);

    if (friendRows.error) return console.error("Error loading suggestion friends:", friendRows.error);
    if (pendingRows.error) return console.error("Error loading suggestion requests:", pendingRows.error);
    if (profileRows.error) return console.error("Error loading friend suggestions:", profileRows.error);

    const friendIds = new Set((friendRows.data ?? []).map((item: any) => item.friend_id));
    const pendingIds = new Set((pendingRows.data ?? []).map((item: any) => item.addressee_id));
    const suggestedUsers =
      profileRows.data
        ?.filter((user: any) => user.id !== currentUserId)
        .filter((user: any) => !friendIds.has(user.id))
        .filter((user: any) => !pendingIds.has(user.id))
        .slice(0, 4) ?? [];
    const mutualCounts = await loadMutualFriendCounts(friendIds, suggestedUsers.map((user: any) => user.id));
    const formatted = suggestedUsers.map((user: any) => ({
      id: user.id,
      name: user.full_name,
      username: user.username,
      avatarUrl: user.avatar_url || "",
      avatarDecoration: user.avatar_decoration || "none",
      pronouns: user.pronouns || "",
      mutualFriends: mutualCounts.get(user.id) ?? 0,
      isPending: false,
      isFriend: false,
    }));

    setFriendSuggestions(formatted);
  };

  useEffect(() => {
    if (!isFocused) return;

    loadProfile();
    loadSentRequests();
    loadFriends();
    loadFriendSuggestions();
    loadBalances();
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) return;

    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getSession().then(({ data }) => {
      const currentUserId = data.session?.user?.id;
      if (!active || !currentUserId) return;

      channel = supabase
        .channel(`profile-money-requests-${currentUserId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `id=eq.${currentUserId}` }, loadProfile)
        .on("postgres_changes", { event: "*", schema: "public", table: "money_requests", filter: `owner_id=eq.${currentUserId}` }, () => {
          loadBalances();
        })
        .subscribe();
    });

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [isFocused]);

  const handleSearch = async () => {
    console.log("Search button pressed");
    if (!searchText.trim()) return console.log("Search text is empty");
    console.log("Searching for:", searchText);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) return console.error("Session error:", sessionError);
    const currentUserId = session?.user?.id;
    console.log("Current user id:", currentUserId);
    const { data, error } = await supabase.from("profiles").select("id, full_name, username, avatar_url, avatar_decoration, pronouns").ilike("username", `%${searchText}%`);
    if (error) return console.error("Search error:", error);
    console.log("Raw search data:", data);
    const foundUsers = data?.filter((user) => user.id !== currentUserId) ?? [];
    const currentFriendIds = new Set(friends.map((friend) => friend.id).filter(Boolean));
    const mutualCounts = await loadMutualFriendCounts(currentFriendIds, foundUsers.map((user) => user.id));
    const formatted =
      foundUsers
        .map((user) => ({
          id: user.id,
          name: user.full_name,
          username: user.username,
          avatarUrl: user.avatar_url || "",
          avatarDecoration: user.avatar_decoration || "none",
          pronouns: user.pronouns || "",
          mutualFriends: mutualCounts.get(user.id) ?? 0,
          isPending: sentRequests.includes(user.id),
          isFriend: friends.some((friend) => friend.id === user.id),
        }))
        .filter((user) => !user.isFriend);
    console.log("Formatted search results:", formatted);
    setSearchResults(formatted);
  };

  const handleAddFriend = async (addresseeId: string) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) return console.error("Session error:", sessionError);
    const currentUserId = session?.user?.id;
    if (!currentUserId) return console.log("No logged in user found");
    if (currentUserId === addresseeId) return console.log("User cannot add themselves");
    const { error } = await supabase.from("friend_requests").insert([{ requester_id: currentUserId, addressee_id: addresseeId, status: "pending" }]);
    if (error) {
      if (error.code === "23505") {
        console.log("Friend request already exists");
        await loadSentRequests();
        setSearchResults((prev) => prev.map((user) => user.id === addresseeId ? { ...user, isPending: true } : user));
        setFriendSuggestions((prev) => prev.map((user) => user.id === addresseeId ? { ...user, isPending: true } : user));
        setPreviewUser((prev: any | null) => prev?.id === addresseeId ? { ...prev, isPending: true } : prev);
        return;
      }
      return console.error("Error sending friend request:", error);
    }
    console.log("Friend request sent successfully");
    await loadSentRequests();
    setSearchResults((prev) => prev.map((user) => user.id === addresseeId ? { ...user, isPending: true } : user));
    setFriendSuggestions((prev) => prev.map((user) => user.id === addresseeId ? { ...user, isPending: true } : user));
    setPreviewUser((prev: any | null) => prev?.id === addresseeId ? { ...prev, isPending: true } : prev);
  };

  const removeFriend = async (friend: any) => {
    const friendId = friend?.id;
    if (!friendId) return;

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Session error:", sessionError);
      Alert.alert("Could not remove friend", "Please try again in a moment.");
      return;
    }

    const currentUserId = session?.user?.id;
    if (!currentUserId) return;

    setRemovingFriendId(friendId);

    const { error: rpcError } = await supabase.rpc("remove_friendship", {
      target_friend_id: friendId,
    });

    const missingRpc =
      rpcError &&
      (rpcError.code === "PGRST202" ||
        rpcError.code === "42883" ||
        String(rpcError.message ?? "").toLowerCase().includes("function"));

    let myFriendRowError = null;
    let theirFriendRowError = null;
    let requestCleanupError = null;

    if (missingRpc) {
      const myDelete = await supabase
        .from("friends")
        .delete()
        .eq("user_id", currentUserId)
        .eq("friend_id", friendId);

      const theirDelete = await supabase
        .from("friends")
        .delete()
        .eq("user_id", friendId)
        .eq("friend_id", currentUserId);

      const requestDelete = await supabase
        .from("friend_requests")
        .delete()
        .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${currentUserId})`);

      myFriendRowError = myDelete.error;
      theirFriendRowError = theirDelete.error;
      requestCleanupError = requestDelete.error;
    }

    setRemovingFriendId(null);

    if (rpcError && !missingRpc) {
      console.error("Error removing friendship:", rpcError);
      Alert.alert("Could not remove friend", "The friendship could not be removed. Please try again.");
      return;
    }

    if (myFriendRowError) {
      console.error("Error removing friendship:", myFriendRowError);
      Alert.alert("Could not remove friend", "The friendship could not be removed. Please try again.");
      return;
    }

    if (theirFriendRowError) {
      console.log("Friend removed from your list, but the other side needs the Supabase remove_friendship function:", theirFriendRowError);
    }

    if (requestCleanupError) {
      console.log("Friend removed, but old request cleanup failed:", requestCleanupError);
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFriends((prev) => prev.filter((item) => item.id !== friendId));
    setSearchResults((prev) => prev.map((user) => user.id === friendId ? { ...user, isFriend: false, isPending: false } : user));
    if (previewUser?.id === friendId) closeProfilePreview();
    await Promise.all([loadFriends(), loadSentRequests(), loadFriendSuggestions()]);
  };

  const confirmRemoveFriend = (friend: any) => {
    Alert.alert(
      "Remove friend?",
      `Remove ${friend.name || `@${friend.username}` || "this friend"} from your friends list?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => removeFriend(friend) },
      ]
    );
  };

  const scrollToFriendsSection = () => {
    if (!friendsExpanded) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setFriendsExpanded(true);
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: Math.max(friendsSectionY.current - 18, 0),
          animated: true,
        });
      }, 60);
      return;
    }

    scrollRef.current?.scrollTo({
      y: Math.max(friendsSectionY.current - 18, 0),
      animated: true,
    });
  };

  const toggleFriendsExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFriendsExpanded((prev) => !prev);
  };

  const refreshProfile = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadProfile(),
        loadSentRequests(),
        loadFriends(),
        loadFriendSuggestions(),
        loadBalances(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const openSettings = () => {
    router.push("/settings" as any);
  };

  const profileInitial = profile.name ? profile.name.charAt(0).toUpperCase() : "?";
  const discoverUsers = searchText.trim() ? searchResults : friendSuggestions;
  const discoverBadge = searchText.trim() ? `${searchResults.length} found` : `${friendSuggestions.length} people`;
  const discoverMeta = searchText.trim()
    ? `Results found: ${searchResults.length}`
    : "People you may know";

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
        ref={scrollRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={Keyboard.dismiss}
        keyboardShouldPersistTaps="never"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshProfile}
            tintColor={C.accentBright}
            colors={[C.accent]}
          />
        }
      >
        <Animated.View style={[styles.header, headerAnim]}>
          <View style={styles.headerLeft}>
            <View style={styles.sparkleWrap}><UserRound size={18} color={C.accent} /></View>
            <View>
              <Text style={styles.headerEyebrow}>Account</Text>
              <Text style={styles.headerTitle}>Profile</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{friends.length} connected</Text></View>
            <Pressable style={styles.settingsButton} onPress={openSettings}>
              <Settings2 size={17} color={C.textPrimary} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View style={[styles.heroCard, heroAnim]}>
          <View style={styles.heroGlow} />
          <View style={styles.profileHeader}>
            <View style={styles.avatarHalo}>
              <View style={styles.avatar}>
                {profile.avatarUrl ? (
                  <Image
                    source={{ uri: profile.avatarUrl }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    onError={(event) => console.log("Profile image failed to load:", event.nativeEvent.error)}
                  />
                ) : (
                  <Text style={styles.avatarText}>{profileInitial}</Text>
                )}
              </View>
              <AvatarDecoration decorationId={profile.avatarDecoration} size={84} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{profile.name || " "}</Text>
              <View style={styles.profileMetaRow}>
                <Text style={styles.username}>@{profile.username || ""}</Text>
                {profile.pronouns ? (
                  <Text style={styles.pronounsInline}>{profile.pronouns}</Text>
                ) : null}
              </View>
              <Text style={styles.email}>{profile.email || " "}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.metricSlot}>
              <MetricCard
                label="Friends"
                value={`${friends.length}`}
                tone="accent"
                onPress={scrollToFriendsSection}
                styles={styles}
              />
            </View>
            <View style={styles.metricSlot}>
              <MetricCard
                label="You are owed"
                value={`$${youreOwed.toFixed(2)}`}
                tone="green"
                styles={styles}
              />
            </View>
            <View style={styles.metricSlot}>
              <MetricCard
                label="You owe"
                value={`$${youOwe.toFixed(2)}`}
                tone="red"
                styles={styles}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.glassCard, searchAnim]}>
          <SectionHeader eyebrow="Discover" title="Add New Friend" badge={discoverBadge} styles={styles} />
          <View style={styles.searchBox}>
            <Search size={18} color={C.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by username"
              placeholderTextColor={C.textMuted}
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                if (text.trim() === "") setSearchResults([]);
              }}
            />
            {searchText.length > 0 ? (
              <Pressable style={styles.clearButton} onPress={() => { setSearchText(""); setSearchResults([]); }}>
                <X size={15} color={C.textSecondary} />
              </Pressable>
            ) : null}
            <Pressable style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </Pressable>
          </View>
          <Text style={styles.sectionMeta}>{discoverMeta}</Text>
          {searchText.trim() !== "" && searchResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptySubtitle}>Try another username and search again.</Text>
            </View>
          ) : discoverUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No suggestions yet</Text>
              <Text style={styles.emptySubtitle}>Search a username to find someone specific.</Text>
            </View>
          ) : discoverUsers.map((user) => (
            <Pressable key={user.id} style={styles.resultCard} onPress={() => openProfilePreview(user)}>
              <View style={styles.resultAvatar}>
                {user.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.listAvatarImage} resizeMode="cover" />
                ) : (
                  <UserRound size={20} color={C.accentBright} />
                )}
              </View>
              <View style={styles.resultBody}>
                <Text style={styles.resultName}>{user.name}</Text>
                <Text style={styles.resultUsername}>@{user.username}</Text>
                <Text style={styles.resultMutual}>{user.mutualFriends} mutual friends</Text>
              </View>
              <Pressable
                style={[styles.addButton, user.isPending && styles.pendingButton]}
                onPress={(event) => {
                  event.stopPropagation();
                  if (!user.isPending) handleAddFriend(user.id);
                }}
                disabled={user.isPending}
              >
                {user.isPending ? <Text style={styles.addButtonText}>Pending</Text> : <><UserPlus size={15} color="#fff" /><Text style={styles.addButtonText}>Add</Text></>}
              </Pressable>
            </Pressable>
          ))}
        </Animated.View>

        <Animated.View
          style={[styles.glassCard, friendsAnim]}
          onLayout={(event) => {
            friendsSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.friendsSectionTop}>
            <SectionHeader eyebrow="Circle" title={`Your Friends (${friends.length})`} badge="Synced" styles={styles} />
            <Pressable
              onPress={toggleFriendsExpanded}
            >
              <Text style={styles.collapseToggleText}>
                {friendsExpanded ? "Collapse" : "Expand"}
              </Text>
              {friendsExpanded ? (
                <ChevronUp size={16} color={C.textSecondary} />
              ) : (
                <ChevronDown size={16} color={C.textSecondary} />
              )}
            </Pressable>
          </View>

          {friendsExpanded ? (
            <View style={styles.friendsAnimatedWrap}>
              {friends.map((friend) => (
                <Pressable key={friend.id} style={styles.friendCard} onPress={() => openProfilePreview(friend)}>
                  <View style={styles.friendInfo}>
                    <View style={styles.friendAvatar}>
                      {friend.avatarUrl ? (
                        <Image source={{ uri: friend.avatarUrl }} style={styles.listAvatarImage} resizeMode="cover" />
                      ) : (
                        <UserRound size={20} color={C.accentBright} />
                      )}
                    </View>
                    <View style={styles.friendTextBlock}>
                      <Text style={styles.resultName} numberOfLines={1}>{friend.name}</Text>
                      <Text style={styles.resultUsername} numberOfLines={1}>@{friend.username}</Text>
                    </View>
                  </View>
                  <View style={styles.friendActions}>
                    <View style={styles.friendStatus}>
                      <Check size={15} color={C.green} />
                      <Text style={styles.friendStatusText}>Friends</Text>
                    </View>
                    <Pressable
                      style={[styles.removeFriendButton, removingFriendId === friend.id && styles.removeFriendButtonDisabled]}
                      onPress={(event) => {
                        event.stopPropagation();
                        confirmRemoveFriend(friend);
                      }}
                      disabled={removingFriendId === friend.id}
                    >
                      <UserMinus size={14} color={C.red} />
                      <Text style={styles.removeFriendText}>
                        {removingFriendId === friend.id ? "Removing" : "Remove"}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))}
              {friends.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No friends yet</Text>
                  <Text style={styles.emptySubtitle}>Search above to add your first friend.</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>
      <Modal
        visible={previewVisible}
        animationType="none"
        transparent
        onRequestClose={closeProfilePreview}
      >
        <Animated.View style={[styles.previewOverlay, { opacity: previewAnim }]}>
          <Pressable style={styles.previewTapAway} onPress={closeProfilePreview} />
          <Animated.View
            style={[
              styles.previewCardMotion,
              {
                transform: [
                  { translateY: previewTranslateY },
                  { scale: previewScale },
                ],
              },
            ]}
          >
            <Pressable style={styles.previewCard} onPress={(event) => event.stopPropagation()}>
            {previewUser ? (
              <>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.previewAccentGlow,
                    {
                      opacity: previewAnim,
                      transform: [{ scale: previewGlowScale }],
                    },
                  ]}
                />
                <View style={styles.previewHandle} />
                <View style={styles.previewAvatarFrame}>
                  <View style={styles.previewAvatarWrap}>
                    {previewUser.avatarUrl ? (
                      <Image source={{ uri: previewUser.avatarUrl }} style={styles.previewAvatarImage} resizeMode="cover" />
                    ) : (
                      <UserRound size={34} color={C.accentBright} />
                    )}
                  </View>
                  <AvatarDecoration decorationId={previewUser.avatarDecoration} size={112} />
                </View>
                <Text style={styles.previewName}>{previewUser.name || "Unknown user"}</Text>
                <Text style={styles.previewUsername}>@{previewUser.username || "unknown"}</Text>
                {previewUser.pronouns ? (
                  <Text style={styles.previewPronouns}>{previewUser.pronouns}</Text>
                ) : null}

                <View style={styles.previewStats}>
                  <View style={styles.previewStatCard}>
                    <Text style={styles.previewStatValue}>{previewUser.mutualFriends ?? 0}</Text>
                    <Text style={styles.previewStatLabel}>Mutual friends</Text>
                  </View>
                  <View style={styles.previewStatCard}>
                    <Text style={styles.previewStatValue}>
                      {previewUser.isFriend ? "Yes" : previewUser.isPending ? "Pending" : "No"}
                    </Text>
                    <Text style={styles.previewStatLabel}>Friends</Text>
                  </View>
                </View>

                <Text style={styles.previewHint}>
                  {previewUser.isFriend ? "This person is already in your friends list." : "Check their profile before sending a request."}
                </Text>

                <View style={styles.previewActions}>
                  <Pressable style={styles.previewCloseButton} onPress={closeProfilePreview}>
                    <Text style={styles.previewCloseText}>Close</Text>
                  </Pressable>
                  {!previewUser.isFriend ? (
                    <Pressable
                      style={[styles.previewAddButton, previewUser.isPending && styles.pendingButton]}
                      onPress={() => !previewUser.isPending && handleAddFriend(previewUser.id)}
                      disabled={previewUser.isPending}
                    >
                      <Text style={styles.previewAddText}>
                        {previewUser.isPending ? "Pending" : "Add Friend"}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </>
            ) : null}
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (C: ReturnType<typeof useAppTheme>["palette"]) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  container: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 140 },
  orb1: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: C.orbPrimary, top: -90, right: -80 },
  orb2: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: C.orbSecondary, bottom: 140, left: -70 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  sparkleWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.accentDim, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: `${C.accent}55` },
  headerEyebrow: { fontSize: 11, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 1.2 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.8, marginTop: -2 },
  headerBadge: { backgroundColor: C.card, borderRadius: 999, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 8 },
  headerBadgeText: { color: C.textSecondary, fontSize: 11, fontWeight: "700" },
  settingsButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center" },
  heroCard: { backgroundColor: C.cardBright, borderRadius: 26, borderWidth: 1, borderColor: C.borderBright, padding: 20, marginBottom: 14, overflow: "hidden" },
  heroGlow: { position: "absolute", top: 0, left: "12%", right: "12%", height: 1, backgroundColor: C.accent, opacity: 0.25 },
  profileHeader: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  avatarHalo: { width: 84, height: 84, borderRadius: 42, justifyContent: "center", alignItems: "center", backgroundColor: C.accentDim, borderWidth: 1, borderColor: `${C.accent}33`, marginRight: 16, position: "relative" },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: C.accentDeep, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  profileInfo: { flex: 1 },
  name: { fontSize: 23, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.5 },
  profileMetaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 7, marginTop: 4 },
  username: { fontSize: 14, color: C.accentBright, fontWeight: "600" },
  pronounsInline: { fontSize: 14, color: C.textSecondary, fontWeight: "600" },
  email: { fontSize: 13, color: C.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10 },
  metricSlot: { flex: 1 },
  metricCard: {
    width: "100%",
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 14,
    borderWidth: 1,
    minHeight: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  metricCardAccent: { backgroundColor: C.accentDim, borderColor: `${C.accent}33` },
  metricCardGreen: { backgroundColor: C.greenDim, borderColor: `${C.green}33` },
  metricCardRed: { backgroundColor: C.redDim, borderColor: `${C.red}33` },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 5,
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: 21,
    letterSpacing: -0.2,
    fontVariant: ["tabular-nums"],
  },
  metricValueAccent: { color: C.accentBright },
  metricValueGreen: { color: C.green },
  metricValueRed: { color: "#ff8da3" },
  metricLabel: {
    color: C.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  glassCard: { backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, gap: 10 },
  sectionEyebrow: { fontSize: 11, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 3 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.4 },
  sectionBadge: { backgroundColor: C.surface, borderRadius: 999, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 6 },
  sectionBadgeText: { color: C.textSecondary, fontSize: 11, fontWeight: "700" },
  sectionMeta: { color: C.textSecondary, fontSize: 12, marginTop: 12, marginBottom: 10 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 8 },
  searchIcon: { marginLeft: 4 },
  searchInput: { flex: 1, marginLeft: 10, color: C.textPrimary, fontSize: 15, paddingVertical: 8 },
  clearButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.cardBright, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.border, marginLeft: 6 },
  searchButton: { backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginLeft: 8, shadowColor: C.accent, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  searchButtonText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  resultCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 10 },
  resultAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.accentDim, borderWidth: 1, borderColor: `${C.accent}33`, justifyContent: "center", alignItems: "center", marginRight: 12, overflow: "hidden" },
  listAvatarImage: { width: "100%", height: "100%" },
  resultAvatarText: { color: C.accentBright, fontWeight: "700", fontSize: 15 },
  resultBody: { flex: 1 },
  resultName: { fontSize: 14, fontWeight: "700", color: C.textPrimary },
  resultUsername: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  resultMutual: { fontSize: 11, color: C.accent, fontWeight: "600", marginTop: 4 },
  addButton: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  addButtonText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  pendingButton: { backgroundColor: C.textMuted },
  pendingCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 10 },
  pendingInfo: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  pendingAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.amberDim, borderWidth: 1, borderColor: `${C.amber}33`, justifyContent: "center", alignItems: "center", marginRight: 12 },
  pendingAvatarText: { color: C.amber, fontWeight: "700", fontSize: 15 },
  requestActions: { flexDirection: "row", gap: 8 },
  acceptButton: { flex: 1, alignItems: "center", backgroundColor: C.green, borderRadius: 12, paddingVertical: 10 },
  declineButton: { flex: 1, alignItems: "center", backgroundColor: C.red, borderRadius: 12, paddingVertical: 10 },
  requestButtonText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  friendCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 10, gap: 10 },
  friendsSectionTop: { marginBottom: 6 },
  collapseToggle: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
  },
  collapseToggleText: {
    color: C.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  friendsAnimatedWrap: {
    paddingTop: 2,
  },
  friendInfo: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 },
  friendAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.accentDim, borderWidth: 1, borderColor: `${C.accent}55`, justifyContent: "center", alignItems: "center", marginRight: 12, overflow: "hidden" },
  friendAvatarText: { color: C.accentBright, fontSize: 15, fontWeight: "700" },
  friendTextBlock: { flex: 1, minWidth: 0 },
  friendActions: { alignItems: "flex-end", gap: 7 },
  friendStatus: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.greenDim, borderRadius: 999, borderWidth: 1, borderColor: `${C.green}33`, paddingHorizontal: 10, paddingVertical: 6 },
  friendStatusText: { color: C.green, fontSize: 11, fontWeight: "800" },
  removeFriendButton: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.redDim, borderRadius: 999, borderWidth: 1, borderColor: `${C.red}33`, paddingHorizontal: 10, paddingVertical: 7 },
  removeFriendButtonDisabled: { opacity: 0.55 },
  removeFriendText: { color: C.red, fontSize: 11, fontWeight: "800" },
  previewOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 18,
    backgroundColor: C.mode === "dark" ? "rgba(6, 10, 18, 0.78)" : "rgba(15, 23, 42, 0.38)",
  },
  previewTapAway: {
    ...StyleSheet.absoluteFillObject,
  },
  previewCardMotion: {
    width: "100%",
  },
  previewCard: {
    alignItems: "center",
    backgroundColor: C.cardBright,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: C.borderBright,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: C.mode === "dark" ? 0.34 : 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
    overflow: "hidden",
  },
  previewAccentGlow: {
    position: "absolute",
    top: -46,
    width: 170,
    height: 120,
    borderRadius: 85,
    backgroundColor: C.accentDim,
  },
  previewHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: C.borderBright,
    marginBottom: 16,
  },
  previewAvatarFrame: {
    width: 112,
    height: 112,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    position: "relative",
  },
  previewAvatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: C.accentDim,
    borderWidth: 1,
    borderColor: `${C.accent}55`,
  },
  previewAvatarImage: {
    width: "100%",
    height: "100%",
  },
  previewName: {
    color: C.textPrimary,
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  previewUsername: {
    color: C.accentBright,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },
  previewPronouns: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 7,
    textAlign: "center",
  },
  previewStats: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  previewStatCard: {
    flex: 1,
    minHeight: 76,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
  },
  previewStatValue: {
    color: C.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  previewStatLabel: {
    color: C.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 5,
    textAlign: "center",
  },
  previewHint: {
    color: C.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 16,
  },
  previewActions: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  previewCloseButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    paddingVertical: 12,
  },
  previewCloseText: {
    color: C.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  previewAddButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: C.accent,
    paddingVertical: 12,
    shadowColor: C.accent,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  previewAddText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  emptyState: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingVertical: 22, paddingHorizontal: 16, alignItems: "center" },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: C.textPrimary, textAlign: "center" },
  emptySubtitle: { fontSize: 12, color: C.textSecondary, textAlign: "center", marginTop: 6, lineHeight: 18 },
});
