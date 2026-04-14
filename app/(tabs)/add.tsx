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
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Palette ──────────────────────────────────────────────────────────────────
let C = {
  ...THEME_PALETTES.dark,
  accentGlow: "#a855f750",
};
let styles = createStyles(C);

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
  }, []);
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
  }, [value]);
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
  }, [pct]);
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
  onRemove,
  onAmountChange,
}: {
  friend: any;
  onRemove: () => void;
  onAmountChange: (val: string) => void;
}) {
  const anim = useFadeSlide(0);
  const initials = friend.full_name?.[0]?.toUpperCase() ?? "?";
  return (
    <Animated.View style={anim}>
      <View style={styles.chipCard}>
        <View style={styles.chipAvatar}>
          <Text style={styles.chipAvatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chipName}>{friend.full_name}</Text>
          <Text style={styles.chipHandle}>@{friend.username}</Text>
        </View>
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
      .select("id, user_id, friend_id, profiles:friend_id ( id, full_name, username )")
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
  const allocated = selectedFriends.reduce(
    (s, f) => s + (parseFloat(f.shareAmountInput) || 0), 0
  );
  const creatorShare = Math.max(0, totalAmount - allocated);
  const progressPct = totalAmount > 0 ? Math.min((allocated / totalAmount) * 100, 100) : 0;
  const isComplete = totalAmount > 0 && Math.abs(creatorShare + allocated - totalAmount) < 0.01;

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
          ...selectedFriends.map((f) => ({
            profileId: f.id,
            sharePercentage: ((parseFloat(f.shareAmountInput) || 0) / amount) * 100,
            shareAmount: -(parseFloat(f.shareAmountInput) || 0),
          })),
        ],
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("🎉 Split Created!", "Your split has been saved.");
      if (onSplitCreated) onSplitCreated();
      setOccasionName("");
      setTotal("");
      setSelectedFriends([]);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err instanceof Error ? err.message : "Could not create split.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
              <Pressable
                style={styles.splitEvenBtn}
                onPress={() => {
                  const per = totalAmount / (selectedFriends.length + 1);
                  setSelectedFriends((p) =>
                    p.map((f) => ({ ...f, shareAmount: per, shareAmountInput: per.toFixed(2) }))
                  );
                  Haptics.selectionAsync();
                }}
              >
                <Percent size={11} color={C.accent} />
                <Text style={styles.splitEvenText}>Even Split</Text>
              </Pressable>
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
                <Text style={styles.youShareLabel}>owes</Text>
                <Text style={styles.youShareAmt}>${creatorShare.toFixed(2)}</Text>
              </View>
            </View>

            {/* Friends */}
            {selectedFriends.map((friend) => (
              <FriendChip
                key={friend.id}
                friend={friend}
                onRemove={() =>
                  setSelectedFriends((p) => p.filter((f) => f.id !== friend.id))
                }
                onAmountChange={(val) =>
                  setSelectedFriends((p) =>
                    p.map((f) => (f.id === friend.id ? { ...f, shareAmountInput: val } : f))
                  )
                }
              />
            ))}

            {/* Progress */}
            {totalAmount > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressText}>
                    ${allocated.toFixed(2)} split across friends
                  </Text>
                  {isComplete && (
                    <View style={styles.completeBadge}>
                      <CheckCircle size={11} color={C.green} />
                      <Text style={styles.completeBadgeText}>Balanced</Text>
                    </View>
                  )}
                </View>
                <GlowBar
                  pct={progressPct}
                  color={isComplete ? C.green : C.accent}
                />
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
                            { ...fp, shareAmount: 0, shareAmountInput: "0.00" },
                          ]);
                          Haptics.selectionAsync();
                        }}
                      >
                        <View style={styles.pickerAvatar}>
                          <Text style={styles.pickerAvatarText}>
                            {fp.full_name?.[0]?.toUpperCase() ?? "?"}
                          </Text>
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
    </TouchableWithoutFeedback>
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
  occasionInput: {
    fontSize: 16, color: C.textPrimary,
    backgroundColor: C.surface, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: C.border,
  },

  // split evenly
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
  },
  chipAvatarText: { color: C.accentBright, fontWeight: "700", fontSize: 14 },
  chipName: { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  chipHandle: { fontSize: 11, color: C.textSecondary, marginTop: 1 },
  chipAmount: { flexDirection: "row", alignItems: "center", gap: 2 },
  chipPrefix: { fontSize: 13, color: C.textSecondary },
  chipInput: {
    fontSize: 16, fontWeight: "700", color: C.accentBright,
    minWidth: 64, textAlign: "right",
  },

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
  progressText: { fontSize: 11, color: C.textSecondary },
  completeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.greenDim, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, borderColor: C.green + "44",
  },
  completeBadgeText: { fontSize: 10, color: C.green, fontWeight: "700" },
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
