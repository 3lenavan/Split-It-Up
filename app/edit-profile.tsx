import { useAppTheme } from "@/lib/app-theme";
import { supabase } from "@/lib/supabaseClient";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { ArrowLeft, Check, LockKeyhole } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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

export default function EditProfileScreen() {
  const isFocused = useIsFocused();
  const { palette: C } = useAppTheme();
  const styles = createStyles(C);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [initialFullName, setInitialFullName] = useState("");
  const [initialUsername, setInitialUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const headerAnim = useFadeSlide(0, isFocused);
  const heroAnim = useFadeSlide(80, isFocused);
  const formAnim = useFadeSlide(160, isFocused);
  const securityAnim = useFadeSlide(240, isFocused);

  useEffect(() => {
    if (!isFocused) return;

    const loadProfile = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const user = session?.user;

      if (sessionError) {
        console.error("Error getting session:", sessionError);
        return;
      }

      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data, error } = await supabase.from("profiles").select("full_name, username, email").eq("id", user.id).single();
      if (error) {
        console.error("Error loading editable profile:", error);
        return;
      }

      const nextFullName = data?.full_name || "";
      const nextUsername = data?.username || "";

      setFullName(nextFullName);
      setUsername(nextUsername);
      setEmail(data?.email || user.email || "");
      setInitialFullName(nextFullName);
      setInitialUsername(nextUsername);
    };

    loadProfile();
  }, [isFocused]);

  const handleSave = async () => {
    const cleanFullName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanFullName || !cleanUsername) {
      Alert.alert("Missing info", "Please fill in both your name and username.");
      return;
    }

    setLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const user = session?.user;

      if (sessionError) throw sessionError;
      if (!user) throw new Error("No user session found.");

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: cleanFullName,
          username: cleanUsername,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: cleanFullName,
          username: cleanUsername,
        },
      });

      if (authError) throw authError;

      setInitialFullName(cleanFullName);
      setInitialUsername(cleanUsername);

      Alert.alert("Saved", "Your profile details were updated.", [
        { text: "Nice", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      if (error?.code === "23505") {
        Alert.alert("Username taken", "That username is already in use. Try another one.");
      } else {
        Alert.alert("Update failed", error?.message || "Something went wrong while saving your profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    fullName.trim() !== initialFullName.trim() ||
    username.trim().toLowerCase() !== initialUsername.trim().toLowerCase();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <FloatingOrb style={styles.orb1} />
      <FloatingOrb style={styles.orb2} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <Animated.View style={[styles.header, headerAnim]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={18} color={C.textPrimary} />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerEyebrow}>Settings</Text>
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.heroCard, heroAnim]}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroEyebrow}>Profile control</Text>
          <Text style={styles.heroTitle}>Update how your account shows up</Text>
          <Text style={styles.heroSubtitle}>
            Change your name and username here. Your email stays locked for now so this page stays simple.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.glassCard, formAnim]}>
          <View style={styles.sectionTop}>
            <View>
              <Text style={styles.sectionEyebrow}>Main details</Text>
              <Text style={styles.sectionTitle}>Public profile</Text>
            </View>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>Synced</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full name</Text>
            <View style={styles.inputShell}>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your name"
                placeholderTextColor={C.textMuted}
                editable={!loading}
                returnKeyType="done"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.inputShell}>
              <Text style={styles.inputPrefix}>@</Text>
              <TextInput
                style={[styles.input, styles.inputWithPrefix]}
                value={username}
                onChangeText={setUsername}
                placeholder="username"
                placeholderTextColor={C.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="done"
              />
            </View>
          </View>

          <View style={styles.readOnlyCard}>
            <Text style={styles.readOnlyLabel}>Email</Text>
            <Text style={styles.readOnlyValue}>{email || "No email found"}</Text>
            <Text style={styles.readOnlyHint}>Email editing is not available on this page.</Text>
          </View>

          <Pressable
            style={[styles.saveButton, (!hasChanges || loading) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || loading}
          >
            <View style={styles.saveGlow} />
            <Check size={18} color="#fff" />
            <Text style={styles.saveText}>{loading ? "Saving..." : "Save Changes"}</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.glassCard, securityAnim]}>
          <View style={styles.sectionTop}>
            <View>
              <Text style={styles.sectionEyebrow}>Security</Text>
              <Text style={styles.sectionTitle}>Reset password</Text>
            </View>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>Adding soon</Text>
            </View>
          </View>

          <View style={styles.comingSoonRow}>
            <View style={styles.comingSoonIcon}>
              <LockKeyhole size={18} color={C.accentBright} />
            </View>
            <View style={styles.comingSoonBody}>
              <Text style={styles.comingSoonTitle}>Password management</Text>
              <Text style={styles.comingSoonSubtitle}>
                We’ll place the reset password flow here next so all account settings stay together.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
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
  sectionTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, gap: 12 },
  sectionEyebrow: { fontSize: 11, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 3 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.4 },
  sectionBadge: { backgroundColor: C.surface, borderRadius: 999, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 6 },
  sectionBadgeText: { color: C.textSecondary, fontSize: 11, fontWeight: "700" },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { color: C.textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  inputShell: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 14 },
  inputPrefix: { color: C.textSecondary, fontSize: 16, fontWeight: "700" },
  input: { flex: 1, color: C.textPrimary, fontSize: 15, paddingVertical: 14 },
  inputWithPrefix: { paddingLeft: 8 },
  readOnlyCard: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 15, marginTop: 4, marginBottom: 16 },
  readOnlyLabel: { color: C.textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  readOnlyValue: { color: C.textPrimary, fontSize: 15, fontWeight: "700", marginBottom: 6 },
  readOnlyHint: { color: C.textSecondary, fontSize: 12, lineHeight: 18 },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.accent,
    borderRadius: 18,
    paddingVertical: 16,
    overflow: "hidden",
    shadowColor: C.accent,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  saveButtonDisabled: { opacity: 0.55 },
  saveGlow: { position: "absolute", top: 0, left: "12%", right: "12%", height: 1, backgroundColor: "#fff", opacity: 0.25 },
  saveText: { color: "#fff", fontSize: 15, fontWeight: "800", marginLeft: 8 },
  comingSoonRow: { flexDirection: "row", alignItems: "flex-start", backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 14, gap: 14 },
  comingSoonIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.accentDim,
    borderWidth: 1,
    borderColor: `${C.accent}33`,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonBody: { flex: 1 },
  comingSoonTitle: { color: C.textPrimary, fontSize: 15, fontWeight: "800", marginBottom: 4 },
  comingSoonSubtitle: { color: C.textSecondary, fontSize: 12, lineHeight: 19 },
});
