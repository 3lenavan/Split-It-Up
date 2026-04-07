import { supabase } from "@/lib/supabaseClient";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Check, ChevronDown, ChevronUp, LogOut, Search, Sparkles, UserPlus, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  bg: "#07070f",
  surface: "#0f0f1a",
  card: "#141420",
  cardBright: "#1c1c2e",
  border: "#252538",
  borderBright: "#353550",
  accent: "#a855f7",
  accentDim: "#a855f730",
  accentBright: "#d8b4fe",
  accentDeep: "#7c3aed",
  green: "#22d3a5",
  greenDim: "#22d3a518",
  red: "#f43f5e",
  redDim: "#f43f5e18",
  amber: "#fbbf24",
  amberDim: "#fbbf2418",
  textPrimary: "#f0eeff",
  textSecondary: "#9b99ba",
  textMuted: "#6b6884",
};

function useFadeSlide(delay = 0, isActive = true) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    if (!isActive) {
      opacity.setValue(0);
      translateY.setValue(22);
      return;
    }

    opacity.setValue(0);
    translateY.setValue(22);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 480, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  }, [delay, isActive, opacity, translateY]);

  return { opacity, transform: [{ translateY }] };
}

function FloatingOrb({ style }: { style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.18)).current;
  useEffect(() => {
    Animated.loop(
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
    ).start();
  }, [opacity, scale]);
  return <Animated.View pointerEvents="none" style={[style, { opacity, transform: [{ scale }] }]} />;
}

function MetricCard({
  label,
  value,
  tone = "accent",
  onPress,
}: {
  label: string;
  value: string;
  tone?: "accent" | "green" | "red";
  onPress?: () => void;
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
        minimumFontScale={0.82}
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

function SectionHeader({ eyebrow, title, badge }: { eyebrow: string; title: string; badge?: string }) {
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

export default function ProfileScreen() {
  const isFocused = useIsFocused();
  const logoutTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const friendsSectionY = useRef(0);
  const [searchText, setSearchText] = useState("");
  const [profile, setProfile] = useState({ name: "", username: "", email: "" });
  const [friends, setFriends] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [youreOwed, setYoureOwed] = useState(0);
  const [youOwe, setYouOwe] = useState(0);
  const [friendsExpanded, setFriendsExpanded] = useState(true);
  const [logoutPhase, setLogoutPhase] = useState<"idle" | "farewell">("idle");

  const headerAnim = useFadeSlide(0, isFocused);
  const heroAnim = useFadeSlide(80, isFocused);
  const searchAnim = useFadeSlide(160, isFocused);
  const pendingAnim = useFadeSlide(240, isFocused);
  const friendsAnim = useFadeSlide(320, isFocused);
  const logoutAnim = useFadeSlide(400, isFocused);
  const logoutScale = useRef(new Animated.Value(1)).current;
  const farewellOpacity = useRef(new Animated.Value(0)).current;
  const farewellScale = useRef(new Animated.Value(0.94)).current;
  const farewellSlide = useRef(new Animated.Value(20)).current;
  const farewellGlow = useRef(new Animated.Value(1)).current;
  const farewellProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      logoutTimers.current.forEach(clearTimeout);
      logoutTimers.current = [];
    };
  }, []);

  const pressLogoutIn = () => Animated.spring(logoutScale, { toValue: 0.97, tension: 280, friction: 10, useNativeDriver: true }).start();
  const pressLogoutOut = () => Animated.spring(logoutScale, { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }).start();

  const loadProfile = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return console.log("No user session found");
    if (sessionError) return console.error("Error getting session:", sessionError);
    const { data, error } = await supabase.from("profiles").select("full_name, username, email").eq("id", user.id).single();
    if (error) return console.error("Error loading profile:", error);
    if (data) setProfile({ name: data.full_name || "", username: data.username || "", email: data.email || "" });
  };

  const loadPendingRequests = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return;
    const { data, error } = await supabase
      .from("friend_requests")
      .select(`id, requester_id, requester:profiles!requester_id ( full_name, username )`)
      .eq("addressee_id", currentUserId)
      .eq("status", "pending");
    if (error) return console.error("Error loading pending requests:", error);
    setPendingRequests(data?.map((request: any) => ({
      id: request.id,
      name: request.requester?.full_name || "",
      username: request.requester?.username || "",
    })) ?? []);
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
      .select(`friend_id, friend:profiles!friend_id ( id, full_name, username )`)
      .eq("user_id", currentUserId);
    if (error) return console.error("Error loading friends:", error);
    setFriends(data?.map((item: any) => ({
      id: item.friend?.id,
      name: item.friend?.full_name || "",
      username: item.friend?.username || "",
    })) ?? []);
  };

  const loadBalances = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return;
    if (sessionError) return console.error("Error getting session for balances:", sessionError);
    const { data, error } = await supabase
      .from("splits")
      .select(`id, my_membership:split_members!inner( profile_id, share_amount )`)
      .eq("my_membership.profile_id", currentUserId);
    if (error) return console.error("Error loading balances:", error);
    let owedTotal = 0;
    let oweTotal = 0;
    (data ?? []).forEach((split: any) => {
      const myRow = Array.isArray(split.my_membership) ? split.my_membership[0] : split.my_membership;
      const myBalance = Number(myRow?.share_amount ?? 0);
      if (myBalance > 0) owedTotal += myBalance;
      else if (myBalance < 0) oweTotal += Math.abs(myBalance);
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
    if (!searchText.trim()) return console.log("Search text is empty");
    console.log("Searching for:", searchText);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) return console.error("Session error:", sessionError);
    const currentUserId = session?.user?.id;
    console.log("Current user id:", currentUserId);
    const { data, error } = await supabase.from("profiles").select("id, full_name, username").ilike("username", `%${searchText}%`);
    if (error) return console.error("Search error:", error);
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
        return;
      }
      return console.error("Error sending friend request:", error);
    }
    console.log("Friend request sent successfully");
    await loadSentRequests();
    setSearchResults((prev) => prev.map((user) => user.id === addresseeId ? { ...user, isPending: true } : user));
  };

  const handleAcceptRequest = async (requestId: string) => {
    const { data: request, error: fetchError } = await supabase.from("friend_requests").select("*").eq("id", requestId).single();
    if (fetchError) return console.error("Error fetching request:", fetchError);
    const requesterId = request.requester_id;
    const addresseeId = request.addressee_id;
    const { error: updateError } = await supabase.from("friend_requests").update({ status: "accepted" }).eq("id", requestId);
    if (updateError) return console.error("Error accepting request:", updateError);
    const { error: friendError } = await supabase.from("friends").insert([
      { user_id: requesterId, friend_id: addresseeId },
      { user_id: addresseeId, friend_id: requesterId },
    ]);
    if (friendError) return console.error("Error adding friendship:", friendError);
    console.log("Friend request accepted");
    await loadPendingRequests();
    await loadFriends();
  };

  const handleDeclineRequest = async (requestId: string) => {
    const { error } = await supabase.from("friend_requests").update({ status: "declined" }).eq("id", requestId);
    if (error) return console.error("Error declining request:", error);
    console.log("Friend request declined");
    await loadPendingRequests();
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          farewellOpacity.setValue(0);
          farewellScale.setValue(0.94);
          farewellSlide.setValue(20);
          farewellGlow.setValue(1);
          farewellProgress.setValue(0);
          setLogoutPhase("farewell");

          Animated.parallel([
            Animated.timing(farewellOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
            Animated.spring(farewellScale, { toValue: 1, tension: 85, friction: 12, useNativeDriver: true }),
            Animated.spring(farewellSlide, { toValue: 0, tension: 85, friction: 12, useNativeDriver: true }),
            Animated.timing(farewellProgress, { toValue: 1, duration: 1550, useNativeDriver: false }),
            Animated.loop(
              Animated.sequence([
                Animated.timing(farewellGlow, { toValue: 1.08, duration: 800, useNativeDriver: true }),
                Animated.timing(farewellGlow, { toValue: 1, duration: 800, useNativeDriver: true }),
              ])
            ),
          ]).start();

          logoutTimers.current.push(
            setTimeout(async () => {
              await supabase.auth.signOut();
              router.replace("/auth");
            }, 1650),
            setTimeout(() => {
              setLogoutPhase("idle");
            }, 1850)
          );
        },
      },
    ]);
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

  const profileInitial = profile.name ? profile.name.charAt(0).toUpperCase() : "?";

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <FloatingOrb style={styles.orb1} />
      <FloatingOrb style={styles.orb2} />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.header, headerAnim]}>
          <View style={styles.headerLeft}>
            <View style={styles.sparkleWrap}><Sparkles size={18} color={C.accent} /></View>
            <View>
              <Text style={styles.headerEyebrow}>Account</Text>
              <Text style={styles.headerTitle}>Profile</Text>
            </View>
          </View>
          <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{friends.length} connected</Text></View>
        </Animated.View>

        <Animated.View style={[styles.heroCard, heroAnim]}>
          <View style={styles.heroGlow} />
          <View style={styles.profileHeader}>
            <View style={styles.avatarHalo}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{profileInitial}</Text></View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{profile.name || " "}</Text>
              <Text style={styles.username}>@{profile.username || ""}</Text>
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
              />
            </View>
            <View style={styles.metricSlot}>
              <MetricCard
                label="You're owed"
                value={`$${youreOwed.toFixed(2)}`}
                tone="green"
              />
            </View>
            <View style={styles.metricSlot}>
              <MetricCard
                label="You owe"
                value={`$${youOwe.toFixed(2)}`}
                tone="red"
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.glassCard, searchAnim]}>
          <SectionHeader eyebrow="Discover" title="Add New Friend" badge={`${searchResults.length} found`} />
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
          <Text style={styles.sectionMeta}>Results found: {searchResults.length}</Text>
          {searchText.trim() !== "" && searchResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptySubtitle}>Try another username and search again.</Text>
            </View>
          ) : searchResults.map((user) => (
            <View key={user.id} style={styles.resultCard}>
              <View style={styles.resultAvatar}><Text style={styles.resultAvatarText}>{user.name ? user.name.charAt(0).toUpperCase() : "?"}</Text></View>
              <View style={styles.resultBody}>
                <Text style={styles.resultName}>{user.name}</Text>
                <Text style={styles.resultUsername}>@{user.username}</Text>
                <Text style={styles.resultMutual}>{user.mutualFriends} mutual friends</Text>
              </View>
              <Pressable style={[styles.addButton, user.isPending && styles.pendingButton]} onPress={() => !user.isPending && handleAddFriend(user.id)} disabled={user.isPending}>
                {user.isPending ? <Text style={styles.addButtonText}>Pending</Text> : <><UserPlus size={15} color="#fff" /><Text style={styles.addButtonText}>Add</Text></>}
              </Pressable>
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[styles.glassCard, pendingAnim]}>
          <SectionHeader eyebrow="Inbox" title="Pending Requests" badge={`${pendingRequests.length}`} />
          {pendingRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No pending requests</Text>
              <Text style={styles.emptySubtitle}>New friend requests will show up here.</Text>
            </View>
          ) : pendingRequests.map((request) => (
            <View key={request.id} style={styles.pendingCard}>
              <View style={styles.pendingInfo}>
                <View style={styles.pendingAvatar}><Text style={styles.pendingAvatarText}>{request.name ? request.name.charAt(0).toUpperCase() : "?"}</Text></View>
                <View>
                  <Text style={styles.resultName}>{request.name}</Text>
                  <Text style={styles.resultUsername}>@{request.username}</Text>
                </View>
              </View>
              <View style={styles.requestActions}>
                <Pressable style={styles.acceptButton} onPress={() => handleAcceptRequest(request.id)}><Text style={styles.requestButtonText}>Accept</Text></Pressable>
                <Pressable style={styles.declineButton} onPress={() => handleDeclineRequest(request.id)}><Text style={styles.requestButtonText}>Decline</Text></Pressable>
              </View>
            </View>
          ))}
        </Animated.View>

        <Animated.View
          style={[styles.glassCard, friendsAnim]}
          onLayout={(event) => {
            friendsSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.friendsSectionTop}>
            <SectionHeader eyebrow="Circle" title={`Your Friends (${friends.length})`} badge="Synced" />
            <Pressable
              style={styles.collapseToggle}
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
                <View key={friend.id} style={styles.friendCard}>
                  <View style={styles.friendInfo}>
                    <View style={styles.friendAvatar}><Text style={styles.friendAvatarText}>{friend.name ? friend.name.charAt(0).toUpperCase() : "?"}</Text></View>
                    <View>
                      <Text style={styles.resultName}>{friend.name}</Text>
                      <Text style={styles.resultUsername}>@{friend.username}</Text>
                    </View>
                  </View>
                  <View style={styles.friendStatus}>
                    <Check size={15} color={C.green} />
                    <Text style={styles.friendStatusText}>Friends</Text>
                  </View>
                </View>
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

        <Animated.View style={logoutAnim}>
          <Animated.View style={{ transform: [{ scale: logoutScale }] }}>
            <Pressable style={styles.logoutButton} onPress={handleLogout} onPressIn={pressLogoutIn} onPressOut={pressLogoutOut}>
              <View style={styles.logoutGlow} />
              <LogOut size={18} color="#fff" />
              <Text style={styles.logoutText}>Log Out</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {logoutPhase !== "idle" ? (
        <Animated.View pointerEvents="auto" style={[styles.logoutOverlay, { opacity: farewellOpacity }]}>
          <Animated.View style={[styles.logoutBackdropGlow, { transform: [{ scale: farewellGlow }] }]} />
          <View style={styles.logoutBackdropGlowSecondary} />
          <Animated.View style={[styles.logoutFarewellCard, { transform: [{ scale: farewellScale }, { translateY: farewellSlide }] }]}>
            <LinearGradient
              colors={["#f97316", "#fb7185", "#a855f7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoutFarewellBadge}
            >
              <Text style={styles.logoutFarewellBadgeText}>
                {(profile.name || profile.username || "S").charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <Text style={styles.logoutFarewellEyebrow}>Signed out</Text>
            <Text style={styles.logoutFarewellTitle}>
              See you soon, {profile.name || profile.username || "friend"}
            </Text>
            <Text style={styles.logoutFarewellSubtitle}>
              We will keep things ready for your next split.
            </Text>
            <View style={styles.logoutFarewellTrack}>
              <Animated.View
                style={[
                  styles.logoutFarewellFill,
                  {
                    width: farewellProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
          </Animated.View>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  container: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 140 },
  orb1: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "#7c3aed", top: -90, right: -80 },
  orb2: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "#4f46e5", bottom: 140, left: -70 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  sparkleWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.accentDim, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: `${C.accent}55` },
  headerEyebrow: { fontSize: 11, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 1.2 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.8, marginTop: -2 },
  headerBadge: { backgroundColor: C.card, borderRadius: 999, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 8 },
  headerBadgeText: { color: C.textSecondary, fontSize: 11, fontWeight: "700" },
  heroCard: { backgroundColor: C.cardBright, borderRadius: 26, borderWidth: 1, borderColor: C.borderBright, padding: 20, marginBottom: 14, overflow: "hidden" },
  heroGlow: { position: "absolute", top: 0, left: "12%", right: "12%", height: 1, backgroundColor: C.accent, opacity: 0.25 },
  profileHeader: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  avatarHalo: { width: 84, height: 84, borderRadius: 42, justifyContent: "center", alignItems: "center", backgroundColor: C.accentDim, borderWidth: 1, borderColor: `${C.accent}33`, marginRight: 16 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: C.accentDeep, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  profileInfo: { flex: 1 },
  name: { fontSize: 23, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.5 },
  username: { fontSize: 14, color: C.accentBright, fontWeight: "600", marginTop: 4 },
  email: { fontSize: 13, color: C.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10 },
  metricSlot: { flex: 1 },
  metricCard: {
    width: "100%",
    borderRadius: 18,
    paddingHorizontal: 12,
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
    lineHeight: 20,
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
  resultAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.accentDim, borderWidth: 1, borderColor: `${C.accent}33`, justifyContent: "center", alignItems: "center", marginRight: 12 },
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
  friendCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 10 },
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
  friendInfo: { flexDirection: "row", alignItems: "center" },
  friendAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#4f46e522", borderWidth: 1, borderColor: "#4f46e555", justifyContent: "center", alignItems: "center", marginRight: 12 },
  friendAvatarText: { color: "#a5b4fc", fontSize: 15, fontWeight: "700" },
  friendStatus: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.greenDim, borderRadius: 999, borderWidth: 1, borderColor: `${C.green}33`, paddingHorizontal: 10, paddingVertical: 6 },
  friendStatusText: { color: C.green, fontSize: 11, fontWeight: "800" },
  emptyState: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingVertical: 22, paddingHorizontal: 16, alignItems: "center" },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: C.textPrimary, textAlign: "center" },
  emptySubtitle: { fontSize: 12, color: C.textSecondary, textAlign: "center", marginTop: 6, lineHeight: 18 },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.red, borderRadius: 18, paddingVertical: 16, marginTop: 6, overflow: "hidden", shadowColor: C.red, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  logoutGlow: { position: "absolute", top: 0, left: "12%", right: "12%", height: 1, backgroundColor: "#fff", opacity: 0.25 },
  logoutText: { color: "#fff", fontSize: 15, fontWeight: "800", marginLeft: 8 },
  logoutOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(7, 7, 15, 0.76)", paddingHorizontal: 24 },
  logoutBackdropGlow: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "rgba(248, 113, 113, 0.18)" },
  logoutBackdropGlowSecondary: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(168, 85, 247, 0.14)", bottom: "35%" },
  logoutFarewellCard: { width: "100%", maxWidth: 332, borderRadius: 30, paddingHorizontal: 24, paddingVertical: 30, backgroundColor: "rgba(15, 14, 36, 0.96)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", alignItems: "center" },
  logoutFarewellBadge: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  logoutFarewellBadgeText: { color: "#fff", fontSize: 30, fontWeight: "900" },
  logoutFarewellEyebrow: { color: "rgba(251, 113, 133, 0.82)", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 10 },
  logoutFarewellTitle: { color: "#fff", fontSize: 28, fontWeight: "800", letterSpacing: -0.8, textAlign: "center", marginBottom: 8 },
  logoutFarewellSubtitle: { color: "rgba(255,255,255,0.62)", fontSize: 14, lineHeight: 20, textAlign: "center", marginBottom: 20 },
  logoutFarewellTrack: { width: "100%", height: 7, borderRadius: 999, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)" },
  logoutFarewellFill: { height: "100%", backgroundColor: "#fb7185" },
});
