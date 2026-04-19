import * as ImagePicker from "expo-image-picker";
import { AppBackground } from "@/lib/app-background";
import { useAppTheme } from "@/lib/app-theme";
import { AVATAR_DECORATIONS, AvatarDecoration, getAvatarDecoration } from "@/lib/avatar-decoration";
import { isLocalProfileImage, uploadProfileImage } from "@/lib/profile-image";
import { supabase } from "@/lib/supabaseClient";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { ArrowLeft, Check, ChevronDown, LockKeyhole, Sparkles } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  BackHandler,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRONOUN_OPTIONS = [
  { label: "She/Her", value: "she/her" },
  { label: "He/Him", value: "he/him" },
  { label: "They/Them", value: "they/them" },
  { label: "She/They", value: "she/they" },
  { label: "He/They", value: "he/they" },
  { label: "Ze/Zir", value: "ze/zir" },
  { label: "Other", value: "other" },
];

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
  const { palette: C, backgroundMode } = useAppTheme();
  const styles = createStyles(C);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [customPronouns, setCustomPronouns] = useState("");
  const [showCustomPronoun, setShowCustomPronoun] = useState(false);
  const [initialFullName, setInitialFullName] = useState("");
  const [initialUsername, setInitialUsername] = useState("");
  const [initialPronouns, setInitialPronouns] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [initialAvatarUrl, setInitialAvatarUrl] = useState<string | null>(null);
  const [avatarDecoration, setAvatarDecoration] = useState("none");
  const [initialAvatarDecoration, setInitialAvatarDecoration] = useState("none");
  const [decorationModalVisible, setDecorationModalVisible] = useState(false);
  const [pronounModalVisible, setPronounModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const headerAnim = useFadeSlide(0, isFocused);
  const heroAnim = useFadeSlide(80, isFocused);
  const formAnim = useFadeSlide(160, isFocused);
  const securityAnim = useFadeSlide(240, isFocused);
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.92)).current;
  const successSlide = useRef(new Animated.Value(16)).current;
  const sparkleSpin = useRef(new Animated.Value(0)).current;
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error) {
        console.error("Error loading editable profile:", error);
        return;
      }

      const nextFullName = data?.full_name || "";
      const nextUsername = data?.username || "";
      const metadata = user.user_metadata ?? {};
      const nextAvatarDecoration = data?.avatar_decoration || metadata.avatar_decoration || "none";
      const nextPronouns = data?.pronouns || metadata.pronouns || "";
      const isPresetPronoun = PRONOUN_OPTIONS.some((option) => option.value === nextPronouns);

      setFullName(nextFullName);
      setUsername(nextUsername);
      setEmail(data?.email || user.email || "");
      setPronouns(isPresetPronoun ? nextPronouns : "");
      setCustomPronouns(isPresetPronoun ? "" : nextPronouns);
      setShowCustomPronoun(!!nextPronouns && !isPresetPronoun);
      setAvatarUri(data?.avatar_url || metadata.avatar_url || null);
      setInitialAvatarUrl(data?.avatar_url || metadata.avatar_url || null);
      setAvatarDecoration(nextAvatarDecoration);
      setInitialAvatarDecoration(nextAvatarDecoration);
      setInitialFullName(nextFullName);
      setInitialUsername(nextUsername);
      setInitialPronouns(nextPronouns);
    };

    loadProfile();
  }, [isFocused]);

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant permission to access your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
    });

    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera permission.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
    });

    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const showImageOptions = () => {
    Alert.alert("Profile Picture", "Choose an option", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Gallery", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const currentPronouns = showCustomPronoun ? customPronouns.trim() : pronouns.trim();

  const selectPronoun = (pronounValue: string) => {
    if (pronounValue === "other") {
      setShowCustomPronoun(true);
      setPronouns("");
    } else {
      setShowCustomPronoun(false);
      setPronouns(pronounValue);
      setCustomPronouns("");
    }
    setPronounModalVisible(false);
  };

  const hasChanges =
    fullName.trim() !== initialFullName.trim() ||
    username.trim().toLowerCase() !== initialUsername.trim().toLowerCase() ||
    currentPronouns !== initialPronouns.trim() ||
    (avatarUri ?? "") !== (initialAvatarUrl ?? "") ||
    avatarDecoration !== initialAvatarDecoration;

  const resetChanges = useCallback(() => {
    Keyboard.dismiss();
    setFullName(initialFullName);
    setUsername(initialUsername);
    const isPresetPronoun = PRONOUN_OPTIONS.some((option) => option.value === initialPronouns);
    setPronouns(isPresetPronoun ? initialPronouns : "");
    setCustomPronouns(isPresetPronoun ? "" : initialPronouns);
    setShowCustomPronoun(!!initialPronouns && !isPresetPronoun);
    setAvatarUri(initialAvatarUrl);
    setAvatarDecoration(initialAvatarDecoration);
    setDecorationModalVisible(false);
    setPronounModalVisible(false);
  }, [initialAvatarDecoration, initialAvatarUrl, initialFullName, initialPronouns, initialUsername]);

  const playSuccessMessage = useCallback(() => {
    if (successTimer.current) clearTimeout(successTimer.current);
    setSuccessVisible(true);
    successOpacity.setValue(0);
    successScale.setValue(0.92);
    successSlide.setValue(16);
    sparkleSpin.setValue(0);

    Animated.parallel([
      Animated.timing(successOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(successScale, { toValue: 1, tension: 90, friction: 9, useNativeDriver: true }),
      Animated.spring(successSlide, { toValue: 0, tension: 90, friction: 10, useNativeDriver: true }),
      Animated.timing(sparkleSpin, { toValue: 1, duration: 720, useNativeDriver: true }),
    ]).start();

    successTimer.current = setTimeout(() => {
      Animated.timing(successOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => {
        successTimer.current = null;
        setSuccessVisible(false);
      });
    }, 1700);
  }, [sparkleSpin, successOpacity, successScale, successSlide]);

  const saveProfileChanges = useCallback(async (goBackAfterSave = false) => {
    const cleanFullName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPronouns = currentPronouns;

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
      const nextAvatarUrl = avatarUri && isLocalProfileImage(avatarUri)
        ? await uploadProfileImage(user.id, avatarUri)
        : avatarUri;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: cleanFullName,
          username: cleanUsername,
          avatar_url: nextAvatarUrl,
          avatar_decoration: avatarDecoration,
          pronouns: cleanPronouns,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: cleanFullName,
          username: cleanUsername,
          avatar_url: nextAvatarUrl,
          avatar_decoration: avatarDecoration,
          pronouns: cleanPronouns,
        },
      });

      if (authError) throw authError;

      const isPresetPronoun = PRONOUN_OPTIONS.some((option) => option.value === cleanPronouns);
      setInitialFullName(cleanFullName);
      setInitialUsername(cleanUsername);
      setInitialPronouns(cleanPronouns);
      setFullName(cleanFullName);
      setUsername(cleanUsername);
      setPronouns(isPresetPronoun ? cleanPronouns : "");
      setCustomPronouns(isPresetPronoun ? "" : cleanPronouns);
      setShowCustomPronoun(!!cleanPronouns && !isPresetPronoun);
      setAvatarUri(nextAvatarUrl ?? null);
      setInitialAvatarUrl(nextAvatarUrl ?? null);
      setInitialAvatarDecoration(avatarDecoration);
      playSuccessMessage();

      if (goBackAfterSave) setTimeout(() => router.back(), 850);
    } catch (error: any) {
      if (error?.code === "23505") {
        Alert.alert("Username taken", "That username is already in use. Try another one.");
      } else {
        Alert.alert("Update failed", error?.message || "Something went wrong while saving your profile.");
      }
    } finally {
      setLoading(false);
    }
  }, [avatarDecoration, avatarUri, currentPronouns, fullName, playSuccessMessage, username]);

  const confirmSave = useCallback(() => {
    if (!hasChanges || loading) return;

    Alert.alert(
      "Confirm changes?",
      "Do you want to save these profile changes?",
      [
        { text: "No, reset", style: "destructive", onPress: resetChanges },
        { text: "Yes, save", onPress: () => saveProfileChanges() },
      ]
    );
  }, [hasChanges, loading, resetChanges, saveProfileChanges]);

  const handleBackPress = useCallback(() => {
    if (loading) return;

    if (!hasChanges) {
      router.back();
      return;
    }

    Alert.alert(
      "Save changes?",
      "You have unsaved profile changes. Do you want to save them before leaving?",
      [
        { text: "Keep editing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            resetChanges();
            router.back();
          },
        },
        { text: "Save", onPress: () => saveProfileChanges(true) },
      ]
    );
  }, [hasChanges, loading, resetChanges, saveProfileChanges]);

  useEffect(() => {
    if (!isFocused || Platform.OS !== "android") return;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBackPress();
      return true;
    });

    return () => subscription.remove();
  }, [handleBackPress, isFocused]);

  const profileInitial = fullName.trim() ? fullName.trim().charAt(0).toUpperCase() : "?";
  const selectedDecoration = getAvatarDecoration(avatarDecoration);
  const sparkleRotate = sparkleSpin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <Animated.View style={[styles.header, headerAnim]}>
          <Pressable style={styles.backButton} onPress={handleBackPress}>
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
            Change your name, username, pronouns, picture, and avatar decoration here.
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

          <View style={styles.avatarEditor}>
            <View style={styles.avatarPreviewWrap}>
              <Pressable style={styles.avatarButton} onPress={showImageOptions} disabled={loading}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>{profileInitial}</Text>
                  </View>
                )}
              </Pressable>
              <AvatarDecoration decorationId={avatarDecoration} size={88} />
            </View>
            <View style={styles.avatarCopy}>
              <Text style={styles.avatarTitle}>Profile picture</Text>
              <Text style={styles.avatarSubtitle}>Tap the circle to choose a new photo.</Text>
              <Pressable
                style={styles.decorationButton}
                onPress={() => setDecorationModalVisible(true)}
                disabled={loading}
              >
                <Text style={styles.decorationButtonText}>Add Decoration</Text>
              </Pressable>
              <Text style={styles.decorationSelected}>Current: {selectedDecoration.name}</Text>
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

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Pronouns</Text>
            <Pressable
              style={[styles.inputShell, styles.selectShell]}
              onPress={() => setPronounModalVisible(true)}
              disabled={loading}
            >
              <Text style={[styles.selectValue, !currentPronouns && styles.selectPlaceholder]}>
                {currentPronouns || "Select pronouns"}
              </Text>
              <ChevronDown size={17} color={C.textSecondary} />
            </Pressable>
          </View>

          {showCustomPronoun ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Custom pronouns</Text>
              <View style={styles.inputShell}>
                <TextInput
                  style={styles.input}
                  value={customPronouns}
                  onChangeText={setCustomPronouns}
                  placeholder="e.g., xe/xem, fae/faer"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="done"
                />
              </View>
            </View>
          ) : null}

          <View style={styles.readOnlyCard}>
            <Text style={styles.readOnlyLabel}>Email</Text>
            <Text style={styles.readOnlyValue}>{email || "No email found"}</Text>
            <Text style={styles.readOnlyHint}>Email editing is not available on this page.</Text>
          </View>

          <Pressable
            style={[styles.saveButton, (!hasChanges || loading) && styles.saveButtonDisabled]}
            onPress={confirmSave}
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
                Reset password will live here next so all account settings stay together.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {successVisible ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.successToast,
            {
              opacity: successOpacity,
              transform: [{ translateY: successSlide }, { scale: successScale }],
            },
          ]}
        >
          <View style={styles.successSparkleWrap}>
            <Animated.View style={{ transform: [{ rotate: sparkleRotate }] }}>
              <Sparkles size={18} color="#fff" />
            </Animated.View>
          </View>
          <View style={styles.successCopy}>
            <Text style={styles.successTitle}>Successfully changed</Text>
            <Text style={styles.successSubtitle}>Your profile has been updated.</Text>
          </View>
        </Animated.View>
      ) : null}

      <Modal
        visible={pronounModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPronounModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPronounModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Select Pronouns</Text>
            <Text style={styles.modalSubtitle}>Choose one, or pick Other to type your own.</Text>

            {PRONOUN_OPTIONS.map((option) => {
              const isSelected = showCustomPronoun ? option.value === "other" : pronouns === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={[styles.pronounOption, isSelected && styles.pronounOptionSelected]}
                  onPress={() => selectPronoun(option.value)}
                >
                  <Text style={[styles.pronounOptionText, isSelected && styles.pronounOptionTextSelected]}>
                    {option.label}
                  </Text>
                  {isSelected ? <Check size={16} color={C.accentBright} /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={decorationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDecorationModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDecorationModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Avatar Decoration</Text>
            <Text style={styles.modalSubtitle}>Choose the frame you want on your profile.</Text>

            <View style={styles.decorationGrid}>
              {AVATAR_DECORATIONS.map((option) => {
                const isSelected = option.id === avatarDecoration;

                return (
                  <Pressable
                    key={option.id}
                    style={[styles.decorationOption, isSelected && styles.decorationOptionSelected]}
                    onPress={() => setAvatarDecoration(option.id)}
                  >
                    <View style={styles.decorationPreview}>
                      <View style={styles.decorationPreviewAvatar}>
                        <Text style={styles.decorationPreviewText}>{profileInitial}</Text>
                      </View>
                      <AvatarDecoration decorationId={option.id} size={64} />
                    </View>
                    <Text style={styles.decorationOptionName} numberOfLines={1}>
                      {option.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.decorationDoneButton} onPress={() => setDecorationModalVisible(false)}>
              <Text style={styles.decorationDoneText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  avatarEditor: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 16 },
  avatarPreviewWrap: { width: 88, height: 88, alignItems: "center", justifyContent: "center", position: "relative" },
  avatarButton: { width: 72, height: 72, borderRadius: 36, overflow: "hidden", borderWidth: 2, borderColor: `${C.accent}55` },
  avatarImage: { width: "100%", height: "100%" },
  avatarFallback: { flex: 1, backgroundColor: C.accentDim, alignItems: "center", justifyContent: "center" },
  avatarFallbackText: { color: C.accentBright, fontSize: 28, fontWeight: "800" },
  avatarCopy: { flex: 1 },
  avatarTitle: { color: C.textPrimary, fontSize: 15, fontWeight: "800", marginBottom: 4 },
  avatarSubtitle: { color: C.textSecondary, fontSize: 12, lineHeight: 18 },
  decorationButton: { alignSelf: "flex-start", backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginTop: 10, marginBottom: 6 },
  decorationButtonText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  decorationSelected: { color: C.textSecondary, fontSize: 11, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: C.mode === "dark" ? `${C.bg}d9` : "rgba(245,247,255,0.78)", justifyContent: "center", padding: 18 },
  modalSheet: { backgroundColor: C.cardBright, borderRadius: 22, borderWidth: 1, borderColor: C.borderBright, padding: 18 },
  modalTitle: { color: C.textPrimary, fontSize: 22, fontWeight: "800", letterSpacing: -0.4, marginBottom: 6 },
  modalSubtitle: { color: C.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  pronounOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 9 },
  pronounOptionSelected: { borderColor: C.accent, backgroundColor: C.accentDim },
  pronounOptionText: { color: C.textPrimary, fontSize: 14, fontWeight: "800" },
  pronounOptionTextSelected: { color: C.accentBright },
  decorationGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  decorationOption: { width: "30.8%", minWidth: 92, flexGrow: 1, alignItems: "center", backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingVertical: 12, paddingHorizontal: 8 },
  decorationOptionSelected: { borderColor: C.accent, backgroundColor: C.accentDim },
  decorationPreview: { width: 64, height: 64, position: "relative", alignItems: "center", justifyContent: "center", marginBottom: 9 },
  decorationPreviewAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.accentDeep, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  decorationPreviewText: { color: "#fff", fontSize: 19, fontWeight: "900" },
  decorationOptionName: { color: C.textPrimary, fontSize: 11, fontWeight: "800", textAlign: "center" },
  decorationDoneButton: { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  decorationDoneText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { color: C.textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  inputShell: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 14 },
  inputPrefix: { color: C.textSecondary, fontSize: 16, fontWeight: "700" },
  input: { flex: 1, color: C.textPrimary, fontSize: 15, paddingVertical: 14 },
  inputWithPrefix: { paddingLeft: 8 },
  selectShell: { justifyContent: "space-between", minHeight: 50, paddingVertical: 13 },
  selectValue: { color: C.textPrimary, fontSize: 15, fontWeight: "700" },
  selectPlaceholder: { color: C.textMuted },
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
  successToast: { position: "absolute", top: 68, left: 18, right: 18, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.cardBright, borderRadius: 18, borderWidth: 1, borderColor: C.green + "55", padding: 14, shadowColor: C.green, shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  successSparkleWrap: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.green, alignItems: "center", justifyContent: "center" },
  successCopy: { flex: 1 },
  successTitle: { color: C.textPrimary, fontSize: 15, fontWeight: "900", letterSpacing: -0.2 },
  successSubtitle: { color: C.textSecondary, fontSize: 12, fontWeight: "600", marginTop: 2 },
  comingSoonRow: { flexDirection: "row", alignItems: "flex-start", backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 14, gap: 14 },
  comingSoonIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.accentDim, borderWidth: 1, borderColor: `${C.accent}33`, alignItems: "center", justifyContent: "center" },
  comingSoonBody: { flex: 1 },
  comingSoonTitle: { color: C.textPrimary, fontSize: 15, fontWeight: "800", marginBottom: 4 },
  comingSoonSubtitle: { color: C.textSecondary, fontSize: 12, lineHeight: 19 },
});
