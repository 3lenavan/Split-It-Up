import { AppBackground, AppBackgroundPreview } from "@/lib/app-background";
import { APP_BACKGROUND_OPTIONS, THEME_OPTIONS, useAppTheme } from "@/lib/app-theme";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { ArrowLeft, Check } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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

export default function CustomizeScreen() {
  const isFocused = useIsFocused();
  const { palette: C, mode, setMode, backgroundMode, setBackgroundMode } = useAppTheme();
  const styles = createStyles(C);
  const headerAnim = useFadeSlide(0, isFocused);
  const heroAnim = useFadeSlide(80, isFocused);
  const themeAnim = useFadeSlide(160, isFocused);
  const backgroundAnim = useFadeSlide(240, isFocused);

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
            <Text style={styles.headerEyebrow}>Settings</Text>
            <Text style={styles.headerTitle}>Customize</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.heroCard, heroAnim]}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroEyebrow}>App style</Text>
          <Text style={styles.heroTitle}>Choose your theme and background</Text>
          <Text style={styles.heroSubtitle}>Pick the colors and artwork that make the app feel right.</Text>
        </Animated.View>

        <Animated.View style={[styles.glassCard, themeAnim]}>
          <View style={styles.sectionTop}>
            <View>
              <Text style={styles.sectionEyebrow}>Appearance</Text>
              <Text style={styles.sectionTitle}>Theme</Text>
            </View>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>Colors</Text>
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
        </Animated.View>

        <Animated.View style={[styles.glassCard, backgroundAnim]}>
          <View style={styles.sectionTop}>
            <View>
              <Text style={styles.sectionEyebrow}>Canvas</Text>
              <Text style={styles.sectionTitle}>App Background</Text>
            </View>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>Artwork</Text>
            </View>
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
  sectionTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  sectionEyebrow: { fontSize: 11, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 3 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.4 },
  sectionBadge: { backgroundColor: C.surface, borderRadius: 999, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 6 },
  sectionBadgeText: { color: C.textSecondary, fontSize: 11, fontWeight: "700" },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  themeCard: { position: "relative", width: "47%", minWidth: 142, flexGrow: 1, backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16 },
  themeCardActive: { borderColor: C.accent, backgroundColor: C.accentDim },
  themeSwatches: { flexDirection: "row", alignItems: "center", marginBottom: 12, minHeight: 34 },
  themeSwatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2 },
  themeTitle: { color: C.textPrimary, fontSize: 16, fontWeight: "800", marginBottom: 6 },
  themeDescription: { color: C.textSecondary, fontSize: 12, lineHeight: 18, maxWidth: "92%" },
  themeCheck: { position: "absolute", top: 14, right: 14, width: 24, height: 24, borderRadius: 12, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  backgroundGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  backgroundCard: { position: "relative", width: "47%", minWidth: 142, flexGrow: 1, backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 12 },
  backgroundCardActive: { borderColor: C.accent, backgroundColor: C.accentDim },
  backgroundPreview: { height: 74, borderRadius: 14, overflow: "hidden", marginBottom: 10, borderWidth: 1, borderColor: C.border },
  backgroundTitle: { color: C.textPrimary, fontSize: 14, fontWeight: "800", marginBottom: 4 },
  backgroundDescription: { color: C.textSecondary, fontSize: 11, lineHeight: 16, maxWidth: "92%" },
});
