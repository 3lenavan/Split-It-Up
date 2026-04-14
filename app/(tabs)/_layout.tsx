import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/lib/app-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { supabase } from "@/lib/supabaseClient";

type TabRouteName = "index" | "add" | "inbox" | "profile";

function getTabMeta(routeName: string) {
  const mapping: Record<TabRouteName, { label: string; icon: "house.fill" | "plus.circle.fill" | "bell.fill" | "person.fill" }> = {
    index: { label: "Home", icon: "house.fill" },
    add: { label: "Add", icon: "plus.circle.fill" },
    inbox: { label: "Inbox", icon: "bell.fill" },
    profile: { label: "Profile", icon: "person.fill" },
  };

  return mapping[routeName as TabRouteName] ?? mapping.index;
}

function BottomEdgeMask({
  styles,
  colors,
}: {
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useAppTheme>["palette"];
}) {
  return (
    <View pointerEvents="none" style={styles.bottomMaskWrap}>
      <BlurView intensity={28} tint={colors.mode === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[`${colors.bg}1f`, `${colors.bg}d6`, `${colors.bg}fa`]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function CustomTabBar({
  state,
  descriptors,
  navigation,
  styles,
  colors,
}: BottomTabBarProps & {
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useAppTheme>["palette"];
}) {
  const [barWidth, setBarWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.16)).current;
  const activeOpacity = useRef(new Animated.Value(0)).current;
  const [inboxCount, setInboxCount] = useState(0);

  const segmentWidth = barWidth > 0 ? barWidth / state.routes.length : 0;
  const pillWidth = segmentWidth > 0 ? Math.max(68, segmentWidth - 8) : 78;
  const showActiveLabel = pillWidth >= 92;
  const targetX = segmentWidth > 0 ? state.index * segmentWidth + (segmentWidth - pillWidth) / 2 : 0;
  const activeMeta = getTabMeta(state.routes[state.index]?.name ?? "index");

  useEffect(() => {
    if (!barWidth) return;

    Animated.parallel([
      Animated.spring(translateX, {
        toValue: targetX,
        tension: 88,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scaleX, {
          toValue: 1.12,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(scaleX, {
          toValue: 1,
          tension: 150,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(scaleY, {
          toValue: 0.94,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(scaleY, {
          toValue: 1,
          tension: 150,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.34,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.16,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(activeOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeOpacity, barWidth, glowOpacity, scaleX, scaleY, state.index, targetX, translateX]);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadInboxCount = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      if (!currentUserId) {
        if (active) setInboxCount(0);
        return;
      }

      const [friendResult, moneyResult] = await Promise.all([
        supabase
          .from("friend_requests")
          .select("id", { count: "exact", head: true })
          .eq("addressee_id", currentUserId)
          .eq("status", "pending"),
        supabase
          .from("money_requests")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", currentUserId)
          .eq("status", "pending"),
      ]);

      if (friendResult.error) console.error("Error counting friend requests:", friendResult.error);
      if (moneyResult.error) console.error("Error counting money requests:", moneyResult.error);

      if (active) setInboxCount((friendResult.count ?? 0) + (moneyResult.count ?? 0));
    };

    supabase.auth.getSession().then(({ data }) => {
      const currentUserId = data.session?.user?.id;
      loadInboxCount();
      if (!active || !currentUserId) return;

      channel = supabase
        .channel(`tab-inbox-count-${currentUserId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "friend_requests", filter: `addressee_id=eq.${currentUserId}` }, loadInboxCount)
        .on("postgres_changes", { event: "*", schema: "public", table: "money_requests", filter: `owner_id=eq.${currentUserId}` }, loadInboxCount)
        .subscribe();
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadInboxCount();
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <View style={styles.tabBar}>
      <View style={styles.backgroundWrap} onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}>
        <BlurView intensity={60} tint={colors.mode === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[`${colors.tabSurface}f0`, `${colors.tabSurfaceSoft}eb`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {barWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activePillWrap,
              {
                width: pillWidth,
                opacity: activeOpacity,
                transform: [{ translateX }, { scaleX }, { scaleY }],
              },
            ]}
          >
            <LinearGradient
              colors={[`${colors.accent}47`, `${colors.blue}2e`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeTabPill}
            >
              <Animated.View style={[styles.activePillGlow, { opacity: glowOpacity }]} />
              <View style={styles.activeTabContent}>
                <View style={styles.activeIconShell}>
                  <IconSymbol size={21} name={activeMeta.icon} color={colors.tabText} />
                  {state.routes[state.index]?.name === "inbox" && inboxCount > 0 ? (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{inboxCount > 99 ? "99+" : inboxCount}</Text>
                    </View>
                  ) : null}
                </View>
                {showActiveLabel ? <Text style={styles.activeTabLabel}>{activeMeta.label}</Text> : null}
              </View>
            </LinearGradient>
          </Animated.View>
        ) : null}

        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const meta = getTabMeta(route.name);
            const routeBadgeCount = route.name === "inbox" ? inboxCount : 0;

            const onPress = () => {
              if (Platform.OS === "ios") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }

              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel}
                testID={descriptors[route.key]?.options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabButton}
              >
                <View style={[styles.inactiveTab, focused && styles.hiddenTabContent]}>
                  <View style={styles.inactiveIconWrap}>
                    <IconSymbol size={21} name={meta.icon} color={colors.tabTextMuted} />
                    {routeBadgeCount > 0 ? (
                      <View style={styles.tabBadge}>
                        <Text style={styles.tabBadgeText}>{routeBadgeCount > 99 ? "99+" : routeBadgeCount}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.inactiveTabLabel}>{meta.label}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { palette: C } = useAppTheme();
  const styles = createStyles(C);

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: "shift",
          sceneStyle: {
            backgroundColor: C.bg,
          },
        }}
        tabBar={(props) => <CustomTabBar {...props} styles={styles} colors={C} />}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="add" options={{ title: "Add" }} />
        <Tabs.Screen name="inbox" options={{ title: "Inbox" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
      <BottomEdgeMask styles={styles} colors={C} />
    </View>
  );
}

const createStyles = (C: ReturnType<typeof useAppTheme>["palette"]) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  tabBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: Platform.OS === "ios" ? 18 : 12,
    height: 76,
    borderRadius: 28,
    overflow: "hidden",
    zIndex: 20,
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  backgroundWrap: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.tabBorder,
    backgroundColor: C.tabSurface,
  },
  bottomMaskWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: Platform.OS === "ios" ? 40 : 30,
    zIndex: 10,
    elevation: 10,
  },
  tabRow: {
    flex: 1,
    flexDirection: "row",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    zIndex: 2,
  },
  activePillWrap: {
    position: "absolute",
    top: 14,
    left: 0,
    height: 52,
    zIndex: 1,
  },
  activeTabPill: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${C.accent}59`,
    shadowColor: C.accent,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    overflow: "hidden",
  },
  activePillGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.mode === "dark" ? "rgba(255,255,255,0.12)" : `${C.accent}12`,
  },
  activeTabContent: {
    width: "100%",
    height: "100%",
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  activeIconShell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.accentDim,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  inactiveIconWrap: { position: "relative", width: 28, height: 24, alignItems: "center", justifyContent: "center" },
  tabBadge: {
    position: "absolute",
    top: -9,
    right: -14,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: C.red,
    borderWidth: 1,
    borderColor: C.tabSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900", lineHeight: 11 },
  activeTabLabel: {
    color: C.tabText,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  inactiveTab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    width: 72,
    height: 48,
    borderRadius: 18,
  },
  hiddenTabContent: {
    opacity: 0,
  },
  inactiveTabLabel: {
    color: C.tabTextMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
