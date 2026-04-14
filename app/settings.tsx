import { APP_BACKGROUND_OPTIONS, THEME_OPTIONS, useAppTheme } from "@/lib/app-theme";
import { AvatarDecoration } from "@/lib/avatar-decoration";
import { AppBackground, AppBackgroundPreview } from "@/lib/app-background";
import { supabase } from "@/lib/supabaseClient";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Check, ChevronRight, LogOut, User } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function SettingsScreen() {
  const isFocused = useIsFocused();
  const { palette: C, mode, setMode, backgroundMode, setBackgroundMode } = useAppTheme();
  const styles = createStyles(C);
  const [profileName, setProfileName] = useState("friend");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [profileAvatarDecoration, setProfileAvatarDecoration] = useState("none");
  const [logoutPhase, setLogoutPhase] = useState<"idle" | "farewell">("idle");
  const logoutTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const farewellOpacity = useRef(new Animated.Value(0)).current;
  const farewellScale = useRef(new Animated.Value(0.94)).current;
  const farewellSlide = useRef(new Animated.Value(20)).current;
  const farewellGlow = useRef(new Animated.Value(1)).current;
  const farewellProgress = useRef(new Animated.Value(0)).current;

  const headerAnim = useFadeSlide(0, isFocused);
  const heroAnim = useFadeSlide(80, isFocused);
  const profileAnim = useFadeSlide(160, isFocused);
  const appearanceAnim = useFadeSlide(240, isFocused);
  const logoutAnim = useFadeSlide(320, isFocused);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const metadata = user.user_metadata ?? {};
      setProfileName(data?.full_name || metadata.full_name || data?.username || metadata.username || "friend");
      setProfileUsername(data?.username || metadata.username || "");
      setProfileAvatarUrl(data?.avatar_url || metadata.avatar_url || "");
      setProfileAvatarDecoration(data?.avatar_decoration || metadata.avatar_decoration || "none");
    };

    loadProfile();

    return () => {
      logoutTimers.current.forEach(clearTimeout);
      logoutTimers.current = [];
    };
  }, []);

  useEffect(() => {
    if (!isFocused) return;

    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const metadata = user.user_metadata ?? {};
      setProfileName(data?.full_name || metadata.full_name || data?.username || metadata.username || "friend");
      setProfileUsername(data?.username || metadata.username || "");
      setProfileAvatarUrl(data?.avatar_url || metadata.avatar_url || "");
      setProfileAvatarDecoration(data?.avatar_decoration || metadata.avatar_decoration || "none");
    };

    loadProfile();
  }, [isFocused]);

  const handleLogout = () => {
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

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <AppBackground />
      {backgroundMode === "default" ? (
        <>
          <FloatingOrb style={styles.orb1} />
          <FloatingOrb style={styles.orb2} />
        </>
      ) : null}

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, headerAnim]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={18} color={C.textPrimary} />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerEyebrow}>Preferences</Text>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.heroCard, heroAnim]}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroEyebrow}>App control</Text>
          <Text style={styles.heroTitle}>Make the app feel more like you</Text>
          <Text style={styles.heroSubtitle}>
            Switch appearance modes and keep account actions tucked away in one cleaner place.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.glassCard, profileAnim]}>
          <View style={styles.sectionTop}>
            <View>
              <Text style={styles.sectionEyebrow}>Profile</Text>
              <Text style={styles.sectionTitle}>Edit your details</Text>
            </View>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>Connected</Text>
            </View>
          </View>

          <Pressable style={styles.actionRow} onPress={() => router.push("/edit-profile" as any)}>
            <View style={styles.actionIconWrap}>
              <View style={styles.actionAvatarBase}>
                {profileAvatarUrl ? (
                  <Image
                    source={{ uri: profileAvatarUrl }}
                    style={styles.actionAvatar}
                    resizeMode="cover"
                    onError={(event) => console.log("Settings image failed to load:", event.nativeEvent.error)}
                  />
                ) : (
                  <User size={18} color={C.accentBright} />
                )}
              </View>
              <AvatarDecoration decorationId={profileAvatarDecoration} size={54} />
            </View>
            <View style={styles.actionBody}>
              <Text style={styles.actionTitle}>{profileName}</Text>
              <Text style={styles.actionSubtitle}>
                {profileUsername ? `@${profileUsername}` : "Update your name and username"}
              </Text>
            </View>
            <ChevronRight size={18} color={C.textSecondary} />
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.glassCard, appearanceAnim]}>
          <View style={styles.sectionTop}>
            <View>
              <Text style={styles.sectionEyebrow}>Appearance</Text>
              <Text style={styles.sectionTitle}>Theme</Text>
            </View>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>More soon</Text>
            </View>
          </View>

          <View style={styles.themeGrid}>
            {THEME_OPTIONS.map((option) => {
              const isActive = mode === option.id;

              return (
                <Pressable
                  key={option.id}
                  style={[styles.themeCard, isActive && styles.themeCardActive]}
                  onPress={() => setMode(option.id)}
                >
                  <View style={styles.themeSwatches}>
                    {option.colors.map((color, index) => (
                      <View
                        key={`${option.id}-${color}`}
                        style={[
                          styles.themeSwatch,
                          {
                            backgroundColor: color,
                            marginLeft: index === 0 ? 0 : -8,
                            borderColor: isActive ? C.accentBright : C.border,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.themeTitle}>{option.name}</Text>
                  <Text style={styles.themeDescription}>{option.description}</Text>
                  {isActive ? (
                    <View style={styles.themeCheck}>
                      <Check size={14} color="#fff" />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.appearanceDivider} />

          <View style={styles.appearanceSubhead}>
            <Text style={styles.appearanceSubheadTitle}>App Background</Text>
            <Text style={styles.appearanceSubheadText}>Choose what sits behind the pages.</Text>
          </View>

          <View style={styles.backgroundGrid}>
            {APP_BACKGROUND_OPTIONS.map((option) => {
              const isActive = backgroundMode === option.id;

              return (
                <Pressable
                  key={option.id}
                  style={[styles.backgroundCard, isActive && styles.backgroundCardActive]}
                  onPress={() => setBackgroundMode(option.id)}
                >
                  <View style={styles.backgroundPreview}>
                    <AppBackgroundPreview mode={option.id} />
                  </View>
                  <Text style={styles.backgroundTitle}>{option.name}</Text>
                  <Text style={styles.backgroundDescription}>{option.description}</Text>
                  {isActive ? (
                    <View style={styles.themeCheck}>
                      <Check size={14} color="#fff" />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View style={[styles.glassCard, logoutAnim]}>
          <View style={styles.sectionTop}>
            <View>
              <Text style={styles.sectionEyebrow}>Account</Text>
              <Text style={styles.sectionTitle}>Sign out</Text>
            </View>
          </View>

          <Text style={styles.logoutCopy}>
            Log out from here to keep the profile screen cleaner and easier to scan.
          </Text>

          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.logoutGlow} />
            <LogOut size={18} color="#fff" />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {logoutPhase !== "idle" ? (
        <Animated.View pointerEvents="auto" style={[styles.logoutOverlay, { opacity: farewellOpacity }]}>
          <Animated.View style={[styles.logoutBackdropGlow, { transform: [{ scale: farewellGlow }] }]} />
          <View style={styles.logoutBackdropGlowSecondary} />
          <Animated.View style={[styles.logoutFarewellCard, { transform: [{ scale: farewellScale }, { translateY: farewellSlide }] }]}>
            <LinearGradient
              colors={[C.amber, C.red, C.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoutFarewellBadge}
            >
              <Text style={styles.logoutFarewellBadgeText}>
                {(profileName || "S").charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <Text style={styles.logoutFarewellEyebrow}>Signed out</Text>
            <Text style={styles.logoutFarewellTitle}>See you soon, {profileName}</Text>
            <Text style={styles.logoutFarewellSubtitle}>
              Your next split session will be ready when you come back.
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

const createStyles = (C: ReturnType<typeof useAppTheme>["palette"]) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  container: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 64 },
  orb1: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: C.orbPrimary, top: -90, right: -80 },
  orb2: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: C.orbSecondary, bottom: 140, left: -70 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 },
  backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  headerTextWrap: { flex: 1 },
  headerEyebrow: { fontSize: 11, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 1.2 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.8, marginTop: -2 },
  heroCard: { backgroundColor: C.cardBright, borderRadius: 26, borderWidth: 1, borderColor: C.borderBright, padding: 20, marginBottom: 14, overflow: "hidden" },
  heroGlow: { position: "absolute", top: 0, left: "12%", right: "12%", height: 1, backgroundColor: C.accent, opacity: 0.25 },
  heroEyebrow: { color: C.accentBright, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 10 },
  heroTitle: { color: C.textPrimary, fontSize: 28, fontWeight: "800", letterSpacing: -0.7, marginBottom: 10 },
  heroSubtitle: { color: C.textSecondary, fontSize: 14, lineHeight: 22 },
  glassCard: { backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 14 },
  sectionTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  sectionEyebrow: { fontSize: 11, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 3 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.4 },
  sectionBadge: { backgroundColor: C.surface, borderRadius: 999, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 6 },
  sectionBadgeText: { color: C.textSecondary, fontSize: 11, fontWeight: "700" },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 14,
  },
  actionIconWrap: {
    width: 54,
    height: 54,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  actionAvatarBase: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.accentDim,
    borderWidth: 1,
    borderColor: `${C.accent}33`,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  actionAvatar: { width: "100%", height: "100%" },
  actionBody: { flex: 1 },
  actionTitle: { color: C.textPrimary, fontSize: 15, fontWeight: "800", marginBottom: 4 },
  actionSubtitle: { color: C.textSecondary, fontSize: 12, lineHeight: 18 },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  themeCard: { position: "relative", width: "47%", minWidth: 142, flexGrow: 1, backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16 },
  themeCardActive: { borderColor: C.accent, backgroundColor: C.accentDim },
  themeSwatches: { flexDirection: "row", alignItems: "center", marginBottom: 12, minHeight: 34 },
  themeSwatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2 },
  themeTitle: { color: C.textPrimary, fontSize: 16, fontWeight: "800", marginBottom: 6 },
  themeDescription: { color: C.textSecondary, fontSize: 12, lineHeight: 18, maxWidth: "92%" },
  themeCheck: { position: "absolute", top: 14, right: 14, width: 24, height: 24, borderRadius: 12, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  appearanceDivider: { height: 1, backgroundColor: C.border, marginVertical: 18 },
  appearanceSubhead: { marginBottom: 12 },
  appearanceSubheadTitle: { color: C.textPrimary, fontSize: 17, fontWeight: "800", marginBottom: 4 },
  appearanceSubheadText: { color: C.textSecondary, fontSize: 12, lineHeight: 18 },
  backgroundGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  backgroundCard: { position: "relative", width: "47%", minWidth: 142, flexGrow: 1, backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 12 },
  backgroundCardActive: { borderColor: C.accent, backgroundColor: C.accentDim },
  backgroundPreview: { height: 74, borderRadius: 14, overflow: "hidden", marginBottom: 10, borderWidth: 1, borderColor: C.border },
  backgroundPreviewBase: { ...StyleSheet.absoluteFillObject },
  backgroundOrb: { position: "absolute", width: 58, height: 58, borderRadius: 29, opacity: 0.78 },
  backgroundOrbOne: { top: -15, right: -9 },
  backgroundOrbTwo: { bottom: -18, left: -10 },
  backgroundTitle: { color: C.textPrimary, fontSize: 14, fontWeight: "800", marginBottom: 4 },
  backgroundDescription: { color: C.textSecondary, fontSize: 11, lineHeight: 16, maxWidth: "92%" },
  logoutCopy: { color: C.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 16 },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.red, borderRadius: 18, paddingVertical: 16, overflow: "hidden", shadowColor: C.red, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  logoutGlow: { position: "absolute", top: 0, left: "12%", right: "12%", height: 1, backgroundColor: "#fff", opacity: 0.25 },
  logoutText: { color: "#fff", fontSize: 15, fontWeight: "800", marginLeft: 8 },
  logoutOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: C.mode === "dark" ? `${C.bg}d9` : "rgba(245,247,255,0.84)", paddingHorizontal: 24 },
  logoutBackdropGlow: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: `${C.red}2e` },
  logoutBackdropGlowSecondary: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: `${C.accent}24`, bottom: "35%" },
  logoutFarewellCard: { width: "100%", maxWidth: 332, borderRadius: 30, paddingHorizontal: 24, paddingVertical: 30, backgroundColor: C.mode === "dark" ? `${C.cardBright}f5` : "rgba(255,255,255,0.96)", borderWidth: 1, borderColor: C.border, alignItems: "center" },
  logoutFarewellBadge: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  logoutFarewellBadgeText: { color: "#fff", fontSize: 30, fontWeight: "900" },
  logoutFarewellEyebrow: { color: C.red, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 10 },
  logoutFarewellTitle: { color: C.textPrimary, fontSize: 28, fontWeight: "800", letterSpacing: -0.8, textAlign: "center", marginBottom: 8 },
  logoutFarewellSubtitle: { color: C.textSecondary, fontSize: 14, lineHeight: 20, textAlign: "center", marginBottom: 20 },
  logoutFarewellTrack: { width: "100%", height: 7, borderRadius: 999, overflow: "hidden", backgroundColor: C.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(24,24,38,0.08)" },
  logoutFarewellFill: { height: "100%", backgroundColor: C.red },
});
