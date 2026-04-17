import { Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { getRememberMePreference } from "../lib/auth-preferences";
import { supabase } from "../lib/supabaseClient";

type StartupScreen = "loading" | "auth" | "welcome" | "tabs";

export default function Index() {
  const [screen, setScreen] = useState<StartupScreen>("loading");
  const [welcomeName, setWelcomeName] = useState("friend");
  const [welcomeAvatarUrl, setWelcomeAvatarUrl] = useState("");
  const [messageStep, setMessageStep] = useState(0);
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.94)).current;
  const cardSlide = useRef(new Animated.Value(20)).current;
  const glowScale = useRef(new Animated.Value(0.94)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;

    const resolveWelcomeProfile = async (userId: string, email?: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", userId)
        .single();

      return {
        name: data?.username || data?.full_name || email?.split("@")[0] || "friend",
        avatarUrl: data?.avatar_url || "",
      };
    };

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        if (active) setScreen("auth");
        return;
      }

      const rememberMe = await getRememberMePreference();

      if (!rememberMe) {
        await supabase.auth.signOut();
        if (active) setScreen("auth");
        return;
      }

      const profile = await resolveWelcomeProfile(data.session.user.id, data.session.user.email ?? undefined);

      if (!active) return;
      setWelcomeName(profile.name);
      setWelcomeAvatarUrl(profile.avatarUrl);
      setScreen("welcome");
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          setScreen("auth");
          return;
        }

        const rememberMe = await getRememberMePreference();
        setScreen(rememberMe ? "welcome" : "auth");
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (screen !== "welcome") return;

    setMessageStep(0);
    cardOpacity.setValue(0);
    cardScale.setValue(0.94);
    cardSlide.setValue(20);
    glowScale.setValue(0.94);
    progress.setValue(0);

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.08,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.96,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 78,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.spring(cardSlide, {
        toValue: 0,
        tension: 78,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 2800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    glowLoop.start();

    const timers = [
      setTimeout(() => setMessageStep(1), 950),
      setTimeout(() => setMessageStep(2), 1950),
      setTimeout(() => {
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }).start(() => setScreen("tabs"));
      }, 3100),
    ];

    return () => {
      glowLoop.stop();
      timers.forEach(clearTimeout);
    };
  }, [cardOpacity, cardScale, cardSlide, glowScale, progress, screen]);

  if (screen === "loading") {
    return (
      <View style={styles.root}>
        <LinearGradient colors={["#0F0C29", "#1a1a4e", "#24243e"]} style={StyleSheet.absoluteFillObject} />
      </View>
    );
  }

  if (screen === "welcome") {
    const statusText = messageStep === 0
      ? "Welcome back"
      : messageStep === 1
        ? "Getting your splits ready"
        : "Opening Home";

    return (
      <View style={styles.root}>
        <LinearGradient colors={["#0F0C29", "#1a1a4e", "#24243e"]} style={StyleSheet.absoluteFillObject} />
        <View pointerEvents="none" style={styles.orbOne} />
        <View pointerEvents="none" style={styles.orbTwo} />
        <View style={styles.welcomeWrap}>
          <Animated.View
            style={[
              styles.scene,
              {
                opacity: cardOpacity,
                transform: [{ scale: cardScale }, { translateY: cardSlide }],
              },
            ]}
          >
            <Animated.View style={[styles.welcomeGlow, { transform: [{ scale: glowScale }] }]} />

            <View style={styles.welcomeCard}>
              <View style={styles.logoWrap}>
                <View style={styles.titleContainer}>
                  <Text style={styles.titlePrefix}>Split</Text>
                  <Text style={styles.titleHighlight}>It</Text>
                  <Text style={styles.titleSuffix}>Up</Text>
                </View>
                <View style={styles.logoUnderline} />
              </View>
              <View style={styles.avatarHalo}>
                {welcomeAvatarUrl ? (
                  <Image source={{ uri: welcomeAvatarUrl }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.avatarInitial}>{welcomeName.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <Text style={styles.welcomeLabel}>{statusText}</Text>
              <Text style={styles.nameText}>{welcomeName}</Text>
              <Text style={styles.welcomeText}>Your account is remembered on this device.</Text>
              <View style={styles.statusPills}>
                <View style={[styles.statusPill, messageStep >= 0 && styles.statusPillActive]}>
                  <Text style={[styles.statusPillText, messageStep >= 0 && styles.statusPillTextActive]}>Signed in</Text>
                </View>
                <View style={[styles.statusPill, messageStep >= 1 && styles.statusPillActive]}>
                  <Text style={[styles.statusPillText, messageStep >= 1 && styles.statusPillTextActive]}>Synced</Text>
                </View>
                <View style={[styles.statusPill, messageStep >= 2 && styles.statusPillActive]}>
                  <Text style={[styles.statusPillText, messageStep >= 2 && styles.statusPillTextActive]}>Ready</Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    );
  }

  return screen === "tabs" ? <Redirect href="/(tabs)" /> : <Redirect href="/auth" />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0F0C29",
  },
  orbOne: {
    position: "absolute",
    top: -90,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(145,234,228,0.14)",
  },
  orbTwo: {
    position: "absolute",
    bottom: 80,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(127,127,213,0.2)",
  },
  welcomeWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  scene: {
    width: "100%",
    maxWidth: 360,
    minHeight: 390,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeGlow: {
    position: "absolute",
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: "rgba(255,230,109,0.13)",
  },
  welcomeCard: {
    width: "100%",
    maxWidth: 334,
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: "rgba(13,12,34,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 26,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  titlePrefix: {
    color: "#F8F7FF",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -1.4,
  },
  titleHighlight: {
    color: "#FFE66D",
    fontSize: 50,
    fontWeight: "900",
    letterSpacing: -1.8,
    marginHorizontal: 2,
    transform: [{ rotate: "-3deg" }],
    textShadowColor: "rgba(255,230,109,0.42)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  titleSuffix: {
    color: "#F8F7FF",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -1.4,
  },
  logoUnderline: {
    width: 104,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#91EAE4",
    marginTop: 10,
    shadowColor: "#91EAE4",
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  avatarHalo: {
    width: 78,
    height: 78,
    borderRadius: 28,
    backgroundColor: "rgba(145,234,228,0.14)",
    borderWidth: 1,
    borderColor: "rgba(145,234,228,0.38)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    color: "#91EAE4",
    fontSize: 28,
    fontWeight: "900",
  },
  welcomeLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  nameText: {
    color: "#F8F7FF",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 6,
    textAlign: "center",
  },
  welcomeText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  statusPills: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 22,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statusPillActive: {
    backgroundColor: "rgba(145,234,228,0.16)",
    borderColor: "rgba(145,234,228,0.36)",
  },
  statusPillText: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "900",
  },
  statusPillTextActive: {
    color: "#91EAE4",
  },
  progressTrack: {
    height: 7,
    width: "100%",
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#91EAE4",
  },
});
