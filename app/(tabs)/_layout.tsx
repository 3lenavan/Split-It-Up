import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { useAppTheme } from "@/lib/app-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";

function TabBarIcon({
  focused,
  color,
  label,
  name,
  colors,
  styles,
}: {
  focused: boolean;
  color: string;
  label: string;
  name: "house.fill" | "plus.circle.fill" | "person.fill";
  colors: ReturnType<typeof useAppTheme>["palette"];
  styles: ReturnType<typeof createStyles>;
}) {
  const iconStyle = name === "person.fill" ? styles.profileIconAdjust : undefined;

  return (
    <View style={styles.tabItemWrap}>
      {focused ? (
        <LinearGradient
          colors={["rgba(168,85,247,0.28)", "rgba(56,189,248,0.18)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeTabPill}
        >
          <View style={styles.activeIconShell}>
            <IconSymbol size={21} name={name} color={colors.tabText} style={iconStyle} />
          </View>
          <Text style={styles.activeTabLabel}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.inactiveTab}>
          <IconSymbol size={21} name={name} color={color} style={iconStyle} />
          <Text style={styles.inactiveTabLabel}>{label}</Text>
        </View>
      )}
    </View>
  );
}

function TabBarBackground({ styles, colors }: { styles: ReturnType<typeof createStyles>; colors: ReturnType<typeof useAppTheme>["palette"] }) {
  return (
    <View style={styles.backgroundWrap}>
      <BlurView intensity={60} tint={colors.mode === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={
          colors.mode === "dark"
            ? ["rgba(24,24,38,0.94)", "rgba(10,10,18,0.9)"]
            : ["rgba(255,255,255,0.94)", "rgba(239,243,255,0.92)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function BottomEdgeMask({ styles, colors }: { styles: ReturnType<typeof createStyles>; colors: ReturnType<typeof useAppTheme>["palette"] }) {
  return (
    <View pointerEvents="none" style={styles.bottomMaskWrap}>
      <BlurView intensity={28} tint={colors.mode === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={
          colors.mode === "dark"
            ? ["rgba(7,7,15,0.12)", "rgba(7,7,15,0.8)", "rgba(7,7,15,0.98)"]
            : ["rgba(245,247,255,0.16)", "rgba(245,247,255,0.84)", "rgba(245,247,255,0.98)"]
        }
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
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
          tabBarButton: HapticTab,
          tabBarShowLabel: false,
          tabBarActiveTintColor: C.tabText,
          tabBarInactiveTintColor: C.tabTextMuted,
          animation: "shift",
          sceneStyle: {
            backgroundColor: C.bg,
          },
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabBarItem,
          tabBarBackground: () => <TabBarBackground styles={styles} colors={C} />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon focused={focused} color={color} label="Home" name="house.fill" colors={C} styles={styles} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "Add",
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon focused={focused} color={color} label="Add" name="plus.circle.fill" colors={C} styles={styles} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon focused={focused} color={color} label="Profile" name="person.fill" colors={C} styles={styles} />
            ),
          }}
        />
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
    borderTopWidth: 0,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    overflow: "hidden",
    zIndex: 20,
    elevation: 20,
  },
  tabBarItem: {
    paddingVertical: 8,
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
  tabItemWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTabPill: {
    minWidth: 96,
    height: 52,
    borderRadius: 20,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.35)",
    shadowColor: C.accent,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  activeIconShell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileIconAdjust: {
    marginLeft: 1,
  },
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
  inactiveTabLabel: {
    color: C.tabTextMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
