/******************************************************************************
 * Add Screen — Premium Redesign
 * Cinematic entrance animations, animated progress ring, glassmorphism cards,
 * pulse feedback, and a floating orb background — all via React Native's
 * built-in Animated API (no extra deps needed).
 *****************************************************************************/
import { createSplit } from "@/lib/split";
import { AppBackground } from "@/lib/app-background";
import { THEME_PALETTES, useAppTheme } from "@/lib/app-theme";
import { supabase } from "@/lib/supabaseClient";
import * as Haptics from "expo-haptics";
import { useIsFocused } from "@react-navigation/native";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Percent,
  Plus,
  Sparkles,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Palette ──────────────────────────────────────────────────────────────────
let C = {
  ...THEME_PALETTES.dark,
  accentGlow: "#a855f750",
};
let styles = createStyles(C);

type SplitMode = "equal" | "custom" | "percent";

const SPLIT_METHODS: { id: SplitMode; title: string; subtitle: string }[] = [
  { id: "equal", title: "Equal", subtitle: "Everyone pays the same" },
  { id: "custom", title: "Custom", subtitle: "Set dollar amounts" },
  { id: "percent", title: "Percent", subtitle: "Split by percentage" },
];

const cleanNumberInput = (value: string) => value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
const formatClampedNumber = (value: number, decimals = 2) => {
  const fixed = value.toFixed(decimals);
  return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
};

// ── Animated entrance hook ───────────────────────────────────────────────────
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

// ── Pulsing orb background ────────────────────────────────────────────────────
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
  return (
    <Animated.View
      style={[style, { opacity, transform: [{ scale }] }]}
      pointerEvents="none"
    />
  );
}

// ── Animated number display ───────────────────────────────────────────────────
function AnimatedAmount({ value }: { value: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.08, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [scale, value]);
  return (
    <Animated.Text style={[styles.amountPreview, { transform: [{ scale }] }]}>
      ${parseFloat(value || "0").toFixed(2)}
    </Animated.Text>
  );
}

// ── Progress arc (simplified bar with glow) ───────────────────────────────────
function GlowBar({ pct, color }: { pct: number; color: string }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(width, {
      toValue: pct, tension: 60, friction: 10,
      useNativeDriver: false,
    }).start();
  }, [pct, width]);
  return (
    <View style={styles.glowTrack}>
      <Animated.View
        style={[
          styles.glowFill,
          {
            width: width.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
            backgroundColor: color,
            shadowColor: color,
          },
        ]}
      />
    </View>
  );
}

// ── Friend chip (animated in) ─────────────────────────────────────────────────
function FriendChip({
  friend,
  splitMode,
  computedShare,
  onRemove,
  onAmountChange,
  onPercentChange,
}: {
  friend: any;
  splitMode: SplitMode;
  computedShare: number;
  onRemove: () => void;
  onAmountChange: (val: string) => void;
  onPercentChange: (val: string) => void;
}) {
  const anim = useFadeSlide(0);
  const initials = friend.full_name?.[0]?.toUpperCase() ?? "?";
  return (
    <Animated.View style={anim}>
      <View style={styles.chipCard}>
        <View style={styles.chipAvatar}>
          {friend.avatar_url ? (
            <Image source={{ uri: friend.avatar_url }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={styles.chipAvatarText}>{initials}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chipName}>{friend.full_name}</Text>
          <Text style={styles.chipHandle}>@{friend.username}</Text>
        </View>
        {splitMode === "equal" ? (
          <View style={styles.chipStaticAmount}>
            <Text style={styles.chipStaticLabel}>Equal</Text>
            <Text style={styles.chipStaticValue}>${computedShare.toFixed(2)}</Text>
          </View>
        ) : splitMode === "percent" ? (
          <View style={styles.chipPercentBlock}>
            <View style={styles.chipAmount}>
              <TextInput
                style={styles.chipInput}
                keyboardType="decimal-pad"
                value={friend.sharePercentInput ?? "0"}
                onChangeText={onPercentChange}
                placeholder="0"
                placeholderTextColor={C.textMuted}
              />
              <Text style={styles.chipPrefix}>%</Text>
            </View>
            <Text style={styles.chipComputedText}>${computedShare.toFixed(2)}</Text>
          </View>
        ) : (
          <View style={styles.chipAmount}>
            <Text style={styles.chipPrefix}>$</Text>
            <TextInput
              style={styles.chipInput}
              keyboardType="decimal-pad"
              value={friend.shareAmountInput}
              onChangeText={onAmountChange}
              placeholderTextColor={C.textMuted}
            />
          </View>
        )}
        <Pressable hitSlop={10} onPress={onRemove} style={styles.chipRemoveButton}>
          <X size={14} color={C.red} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AddScreen({
  onSplitCreated,
}: {
  onSplitCreated?: () => void;
}) {
  const { palette, backgroundMode } = useAppTheme();
  C = { ...palette, accentGlow: `${palette.accent}50` };
  styles = createStyles(C);
  const isFocused = useIsFocused();
  const [occasionName, setOccasionName] = useState("");
  const [total, setTotal] = useState("");
  const [user, setUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [showFriends, setShowFriends] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // entrance animations
  const headerAnim = useFadeSlide(60, isFocused);
  const card1Anim = useFadeSlide(140, isFocused);
  const card2Anim = useFadeSlide(210, isFocused);
  const card3Anim = useFadeSlide(280, isFocused);
  const btnAnim = useFadeSlide(350, isFocused);

  // button press scale
  const btnScale = useRef(new Animated.Value(1)).current;
  const pressBtnIn = () =>
    Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, tension: 300 }).start();
  const pressBtnOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 300 }).start();

  const loadUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return;
    setUser(user);
    const { data } = await supabase
      .from("friends")
      .select("id, user_id, friend_id, profiles:friend_id ( id, full_name, username, avatar_url )")
      .eq("user_id", user.id);
    if (data) setFriends(data);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const refreshFriends = async () => {
    setRefreshing(true);
    try {
      await loadUser();
    } finally {
      setRefreshing(false);
    }
  };

  const totalAmount = parseFloat(total || "0");
  const participantCount = selectedFriends.length + 1;
  const evenShare = totalAmount > 0 ? totalAmount / participantCount : 0;
  const getFriendShare = (friend: any) => {
    if (splitMode === "equal") return evenShare;
    if (splitMode === "percent") return totalAmount * ((parseFloat(friend.sharePercentInput ?? "0") || 0) / 100);
    return parseFloat(friend.shareAmountInput) || 0;
  };
  const friendShares = selectedFriends.map(getFriendShare);
  const allocated = friendShares.reduce((s, amount) => s + amount, 0);
  const creatorShare = totalAmount > 0
    ? splitMode === "equal"
      ? evenShare
      : Math.max(0, totalAmount - allocated)
    : 0;
  const progressPct = totalAmount > 0 ? Math.min((allocated / totalAmount) * 100, 100) : 0;
  const isOverAllocated = totalAmount > 0 && allocated - totalAmount > 0.01;
  const isComplete = totalAmount > 0 && !isOverAllocated;
  const creatorPercent = totalAmount > 0 ? (creatorShare / totalAmount) * 100 : 0;

  const selectSplitMode = (mode: SplitMode) => {
    if (mode === "custom") {
      setSelectedFriends((prev) =>
        prev.map((friend, index) => ({
          ...friend,
          shareAmountInput: (friendShares[index] ?? 0).toFixed(2),
        }))
      );
    }

    if (mode === "percent") {
      setSelectedFriends((prev) =>
        prev.map((friend, index) => {
          const share = friendShares[index] ?? 0;
          const percent = totalAmount > 0 ? (share / totalAmount) * 100 : parseFloat(friend.sharePercentInput ?? "0") || 0;
          return { ...friend, sharePercentInput: percent.toFixed(percent % 1 === 0 ? 0 : 1) };
        })
      );
    }

    setSplitMode(mode);
    Haptics.selectionAsync();
  };

  const updateCustomShare = (friendId: string, value: string) => {
    const cleaned = cleanNumberInput(value);
    if (cleaned === "" || cleaned === ".") {
      setSelectedFriends((prev) =>
        prev.map((friend) => (friend.id === friendId ? { ...friend, shareAmountInput: cleaned } : friend))
      );
      return;
    }

    const requestedAmount = parseFloat(cleaned) || 0;
    const usedByOthers = selectedFriends.reduce((sum, friend) => {
      if (friend.id === friendId) return sum;
      return sum + (parseFloat(friend.shareAmountInput) || 0);
    }, 0);
    const maxAmount = Math.max(0, totalAmount - usedByOthers);
    const nextAmount = Math.min(requestedAmount, maxAmount);
    const nextInput = requestedAmount > maxAmount ? formatClampedNumber(nextAmount) : cleaned;

    setSelectedFriends((prev) =>
      prev.map((friend) => (friend.id === friendId ? { ...friend, shareAmountInput: nextInput } : friend))
    );
  };

  const updatePercentShare = (friendId: string, value: string) => {
    const cleaned = cleanNumberInput(value);
    if (cleaned === "" || cleaned === ".") {
      setSelectedFriends((prev) =>
        prev.map((friend) => (friend.id === friendId ? { ...friend, sharePercentInput: cleaned } : friend))
      );
      return;
    }

    const requestedPercent = parseFloat(cleaned) || 0;
    const usedByOthers = selectedFriends.reduce((sum, friend) => {
      if (friend.id === friendId) return sum;
      return sum + (parseFloat(friend.sharePercentInput ?? "0") || 0);
    }, 0);
    const maxPercent = Math.max(0, 100 - usedByOthers);
    const nextPercent = Math.min(requestedPercent, maxPercent);
    const nextInput = requestedPercent > maxPercent ? formatClampedNumber(nextPercent, 1) : cleaned;

    setSelectedFriends((prev) =>
      prev.map((friend) => (friend.id === friendId ? { ...friend, sharePercentInput: nextInput } : friend))
    );
  };

  async function handleCreateSplit() {
    const trimmedTitle = occasionName.trim();
    const amount = parseFloat(total.trim());
    if (!trimmedTitle || !total.trim() || !user) {
      Alert.alert("Missing Info", "Please fill in the occasion name and amount.");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Enter a valid total amount.");
      return;
    }
    if (isOverAllocated) {
      Alert.alert("Too Much Assigned", "The friend shares are more than the total bill. Lower one of the amounts or percentages.");
      return;
    }
    setCreating(true);
    try {
      await createSplit({
        title: trimmedTitle,
        totalAmount: amount,
        members: [
          {
            profileId: user.id,
            sharePercentage: (creatorShare / amount) * 100,
            shareAmount: creatorShare,
          },
          ...selectedFriends.map((f, index) => ({
            profileId: f.id,
            sharePercentage: ((friendShares[index] ?? 0) / amount) * 100,
            shareAmount: -(friendShares[index] ?? 0),
          })),
        ],
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("🎉 Split Created!", "Your split has been saved.");
      if (onSplitCreated) onSplitCreated();
      setOccasionName("");
      setTotal("");
      setSelectedFriends([]);
      setSplitMode("equal");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err instanceof Error ? err.message : "Could not create split.");
    } finally {
      setCreating(false);
    }
  }

  return (
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
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
              onRefresh={refreshFriends}
              tintColor={C.accentBright}
              colors={[C.accent]}
            />
          }
        >
          {/* ── HEADER ── */}
          <Animated.View style={[styles.header, headerAnim]}>
            <View style={styles.headerLeft}>
              <View style={styles.sparkleWrap}>
                <Plus size={18} color={C.accent} />
              </View>
              <View>
                <Text style={styles.headerEyebrow}>New</Text>
                <Text style={styles.headerTitle}>Create Split</Text>
              </View>
            </View>
            <View style={styles.participantPills}>
              {[...Array(Math.min(selectedFriends.length + 1, 4))].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.participantDot,
                    { marginLeft: i === 0 ? 0 : -6, zIndex: 10 - i },
                  ]}
                />
              ))}
              {selectedFriends.length + 1 > 0 && (
                <Text style={styles.participantCount}>
                  {selectedFriends.length + 1}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* ── AMOUNT HERO ── */}
          <Animated.View style={[styles.amountHero, card1Anim]}>
            <View style={styles.amountHeroInner}>
              <Text style={styles.amountHeroLabel}>Total Bill</Text>
              <AnimatedAmount value={total} />
              <View style={styles.amountInputRow}>
                <Text style={styles.amountSign}>$</Text>
                <TextInput
                  placeholder="Enter amount…"
                  placeholderTextColor={C.textMuted}
                  keyboardType="numeric"
                  style={styles.amountHeroInput}
                  value={total}
                  onChangeText={setTotal}
                />
              </View>
            </View>
            {/* shimmer line */}
            <View style={styles.heroShimmer} />
          </Animated.View>

          {/* ── OCCASION ── */}
          <Animated.View style={[styles.glassCard, card2Anim]}>
            <Text style={styles.cardLabel}>Occasion</Text>
            <TextInput
              placeholder="e.g. Tokyo Trip, Team Lunch…"
              placeholderTextColor={C.textMuted}
              style={styles.occasionInput}
              value={occasionName}
              onChangeText={setOccasionName}
            />
          </Animated.View>

          {/* ── PARTICIPANTS ── */}
          <Animated.View style={[styles.glassCard, card3Anim]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardLabel}>Participants</Text>
              <View style={styles.peopleBadge}>
                <Text style={styles.peopleBadgeText}>{participantCount} people</Text>
              </View>
            </View>

            <View style={styles.methodPanel}>
              <Text style={styles.methodEyebrow}>Split Method</Text>
              <View style={styles.methodGrid}>
                {SPLIT_METHODS.map((method) => {
                  const active = splitMode === method.id;
                  const Icon = method.id === "percent" ? Percent : method.id === "custom" ? Sparkles : CheckCircle;

                  return (
                    <Pressable
                      key={method.id}
                      style={[styles.methodCard, active && styles.methodCardActive]}
                      onPress={() => selectSplitMode(method.id)}
                    >
                      <View style={[styles.methodIcon, active && styles.methodIconActive]}>
                        <Icon size={14} color={active ? "#fff" : C.accentBright} />
                      </View>
                      <Text style={[styles.methodTitle, active && styles.methodTitleActive]}>{method.title}</Text>
                      <Text style={[styles.methodSubtitle, active && styles.methodSubtitleActive]}>{method.subtitle}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* You row */}
            <View style={styles.youRow}>
              <View style={styles.youAvatar}>
                <Text style={styles.youAvatarText}>Y</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.youName}>You</Text>
                <Text style={styles.youSub}>organizer</Text>
              </View>
              <View style={styles.youShare}>
                <Text style={styles.youShareLabel}>{creatorPercent.toFixed(0)}%</Text>
                <Text style={styles.youShareAmt}>${creatorShare.toFixed(2)}</Text>
              </View>
            </View>

            {/* Friends */}
            {selectedFriends.map((friend, index) => (
              <FriendChip
                key={friend.id}
                friend={friend}
                splitMode={splitMode}
                computedShare={friendShares[index] ?? 0}
                onRemove={() =>
                  setSelectedFriends((p) => p.filter((f) => f.id !== friend.id))
                }
                onAmountChange={(val) =>
                  updateCustomShare(friend.id, val)
                }
                onPercentChange={(val) =>
                  updatePercentShare(friend.id, val)
                }
              />
            ))}

            {/* Progress */}
            {totalAmount > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressText}>
                    ${allocated.toFixed(2)} assigned to friends
                  </Text>
                  {isComplete && (
                    <View style={styles.completeBadge}>
                      <CheckCircle size={11} color={C.green} />
                      <Text style={styles.completeBadgeText}>Ready</Text>
                    </View>
                  )}
                  {isOverAllocated && (
                    <View style={styles.overBadge}>
                      <Text style={styles.overBadgeText}>Over total</Text>
                    </View>
                  )}
                </View>
                <GlowBar
                  pct={progressPct}
                  color={isOverAllocated ? C.red : isComplete ? C.green : C.accent}
                />
                <Text style={styles.creatorRemainderText}>
                  Your share is the remaining ${creatorShare.toFixed(2)}.
                </Text>
              </View>
            )}

            {/* Add friend toggle */}
            <Pressable
              style={styles.addFriendRow}
              onPress={() => {
                setShowFriends((v) => !v);
                Haptics.selectionAsync();
              }}
            >
              <View style={styles.addFriendIcon}>
                <Plus size={14} color={C.accent} />
              </View>
              <Text style={styles.addFriendLabel}>Add Friend</Text>
              {showFriends ? (
                <ChevronUp size={14} color={C.textSecondary} />
              ) : (
                <ChevronDown size={14} color={C.textSecondary} />
              )}
            </Pressable>

            {/* Friend picker */}
            {showFriends && (
              <View style={styles.picker}>
                {friends.length === 0 ? (
                  <Text style={styles.pickerEmpty}>
                    No friends yet — add some from your profile!
                  </Text>
                ) : (
                  friends.map((f) => {
                    const fp = f.profiles;
                    const added = selectedFriends.find((sf) => sf.id === fp.id);
                    return (
                      <Pressable
                        key={f.id}
                        style={[styles.pickerRow, added && { opacity: 0.35 }]}
                        onPress={() => {
                          if (added) return;
                          setSelectedFriends((p) => [
                            ...p,
                            { ...fp, shareAmount: 0, shareAmountInput: "0.00", sharePercentInput: "0" },
                          ]);
                          Haptics.selectionAsync();
                        }}
                      >
                        <View style={styles.pickerAvatar}>
                          {fp.avatar_url ? (
                            <Image source={{ uri: fp.avatar_url }} style={styles.avatarImage} resizeMode="cover" />
                          ) : (
                            <Text style={styles.pickerAvatarText}>
                              {fp.full_name?.[0]?.toUpperCase() ?? "?"}
                            </Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pickerName}>{fp.full_name}</Text>
                          <Text style={styles.pickerHandle}>@{fp.username}</Text>
                        </View>
                        {added ? (
                          <CheckCircle size={16} color={C.green} />
                        ) : (
                          <View style={styles.pickerAddBtn}>
                            <Plus size={12} color={C.accent} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })
                )}
              </View>
            )}
          </Animated.View>

          {/* ── CREATE BUTTON ── */}
          <Animated.View style={[btnAnim, { transform: [...(btnAnim.transform ?? []), { scale: btnScale }] }]}>
            <Pressable
              style={[styles.createBtn, creating && { opacity: 0.7 }]}
              onPress={handleCreateSplit}
              onPressIn={pressBtnIn}
              onPressOut={pressBtnOut}
              disabled={creating}
            >
              <View style={styles.createBtnGlow} />
              <Sparkles size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.createBtnText}>
                {creating ? "Creating…" : "Create Split"}
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
  );
}

function createStyles(C: typeof THEME_PALETTES.dark & { accentGlow: string }) {
return StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 140 },

  // background orbs
  orb1: {
    position: "absolute", width: 280, height: 280, borderRadius: 140,
    backgroundColor: C.orbPrimary,
    top: -80, right: -80,
  },
  orb2: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: C.orbSecondary,
    bottom: 120, left: -60,
  },

  // header
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 24,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  sparkleWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.accentDim,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: C.accent + "55",
  },
  headerEyebrow: { fontSize: 11, color: C.textSecondary, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1.2 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.8, marginTop: -2 },
  participantPills: { flexDirection: "row", alignItems: "center", gap: 6 },
  participantDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.accentDim, borderWidth: 2, borderColor: C.bg,
  },
  participantCount: { fontSize: 12, color: C.textSecondary, fontWeight: "700" },

  // amount hero card
  amountHero: {
    borderRadius: 24, marginBottom: 14, overflow: "hidden",
    backgroundColor: C.card,
    borderWidth: 1, borderColor: C.borderBright,
  },
  amountHeroInner: { padding: 24, alignItems: "center" },
  amountHeroLabel: {
    fontSize: 11, fontWeight: "700", color: C.textSecondary,
    textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8,
  },
  amountPreview: {
    fontSize: 52, fontWeight: "800", color: C.textPrimary,
    letterSpacing: -2, marginBottom: 12,
  },
  amountInputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: C.border,
    width: "100%",
  },
  amountSign: { fontSize: 18, color: C.textSecondary, marginRight: 6 },
  amountHeroInput: {
    flex: 1, paddingVertical: 13,
    fontSize: 18, fontWeight: "700", color: C.textPrimary,
  },
  heroShimmer: {
    height: 1,
    backgroundColor: C.accent,
    opacity: 0.25,
  },

  // glass cards
  glassCard: {
    backgroundColor: C.card,
    borderRadius: 22, borderWidth: 1, borderColor: C.border,
    padding: 18, marginBottom: 14,
  },
  cardLabel: {
    fontSize: 11, fontWeight: "700", color: C.textSecondary,
    textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14,
  },
  peopleBadge: {
    backgroundColor: C.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  peopleBadgeText: { color: C.textSecondary, fontSize: 11, fontWeight: "800" },
  occasionInput: {
    fontSize: 16, color: C.textPrimary,
    backgroundColor: C.surface, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: C.border,
  },

  // split method
  methodPanel: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
    marginBottom: 12,
  },
  methodEyebrow: {
    color: C.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 9,
    paddingHorizontal: 2,
  },
  methodGrid: { flexDirection: "row", gap: 8 },
  methodCard: {
    flex: 1,
    minHeight: 92,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    padding: 10,
  },
  methodCardActive: {
    backgroundColor: C.accent,
    borderColor: C.accentBright,
  },
  methodIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: C.accentDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  methodIconActive: { backgroundColor: "rgba(255,255,255,0.2)" },
  methodTitle: { color: C.textPrimary, fontSize: 13, fontWeight: "900" },
  methodTitleActive: { color: "#fff" },
  methodSubtitle: { color: C.textSecondary, fontSize: 10, fontWeight: "700", lineHeight: 13, marginTop: 3 },
  methodSubtitleActive: { color: "rgba(255,255,255,0.82)" },
  splitEvenBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.accentDim, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: C.accent + "44",
  },
  splitEvenText: { fontSize: 11, color: C.accent, fontWeight: "700" },

  // you row
  youRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.accentDim,
    borderRadius: 14, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: C.accent + "30",
  },
  youAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.accent + "33",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1.5, borderColor: C.accent,
  },
  youAvatarText: { color: C.accentBright, fontWeight: "800", fontSize: 16 },
  youName: { fontSize: 14, fontWeight: "700", color: C.textPrimary },
  youSub: { fontSize: 11, color: C.accent, fontWeight: "600", marginTop: 1 },
  youShare: { alignItems: "flex-end" },
  youShareLabel: { fontSize: 10, color: C.textSecondary },
  youShareAmt: { fontSize: 16, fontWeight: "800", color: C.accentBright },

  // friend chip
  chipCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.surface, borderRadius: 14,
    padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  chipAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.accentDim,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: C.accent + "55",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  chipAvatarText: { color: C.accentBright, fontWeight: "700", fontSize: 14 },
  chipName: { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  chipHandle: { fontSize: 11, color: C.textSecondary, marginTop: 1 },
  chipAmount: { flexDirection: "row", alignItems: "center", gap: 2 },
  chipPrefix: { fontSize: 13, color: C.textSecondary },
  chipInput: {
    fontSize: 16, fontWeight: "700", color: C.accentBright,
    minWidth: 64, textAlign: "right",
  },
  chipStaticAmount: { alignItems: "flex-end" },
  chipStaticLabel: { color: C.textMuted, fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 },
  chipStaticValue: { color: C.accentBright, fontSize: 16, fontWeight: "900", marginTop: 2 },
  chipPercentBlock: { alignItems: "flex-end" },
  chipComputedText: { color: C.textSecondary, fontSize: 10, fontWeight: "800", marginTop: 1 },

  chipRemoveButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: C.redDim,
    borderWidth: 1,
    borderColor: C.red + "44",
    alignItems: "center",
    justifyContent: "center",
  },

  // progress
  progressSection: { marginTop: 8, marginBottom: 4 },
  progressLabelRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 8,
  },
  progressText: { flex: 1, fontSize: 11, color: C.textSecondary },
  completeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.greenDim, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, borderColor: C.green + "44",
  },
  completeBadgeText: { fontSize: 10, color: C.green, fontWeight: "700" },
  overBadge: {
    backgroundColor: C.redDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.red + "44",
  },
  overBadgeText: { fontSize: 10, color: C.red, fontWeight: "800" },
  creatorRemainderText: { color: C.textMuted, fontSize: 10, marginTop: 7, fontWeight: "600" },
  glowTrack: {
    height: 5, backgroundColor: C.surface,
    borderRadius: 3, overflow: "hidden",
  },
  glowFill: {
    height: "100%", borderRadius: 3,
    shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },

  // add friend row
  addFriendRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderColor: C.border,
  },
  addFriendIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.accentDim,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: C.accent + "44",
  },
  addFriendLabel: { flex: 1, fontSize: 14, color: C.accent, fontWeight: "600" },

  // picker
  picker: {
    marginTop: 12, backgroundColor: C.surface,
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    overflow: "hidden",
  },
  pickerRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 13, borderBottomWidth: 1, borderColor: C.border,
  },
  pickerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.accentDim,
    justifyContent: "center", alignItems: "center",
    overflow: "hidden",
  },
  pickerAvatarText: { color: C.accentBright, fontWeight: "700" },
  pickerName: { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  pickerHandle: { fontSize: 11, color: C.textSecondary },
  pickerAddBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.accentDim, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: C.accent + "55",
  },
  pickerEmpty: {
    padding: 20, textAlign: "center",
    fontSize: 13, color: C.textMuted,
  },

  // create button
  createBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: C.accent, borderRadius: 18,
    paddingVertical: 17, marginTop: 6,
    overflow: "hidden",
    shadowColor: C.accent, shadowOpacity: 0.5,
    shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  createBtnGlow: {
    position: "absolute", top: 0, left: "10%", right: "10%",
    height: 1, backgroundColor: "#fff", opacity: 0.3,
  },
  createBtnText: {
    color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: 0.2,
  },
});
}
