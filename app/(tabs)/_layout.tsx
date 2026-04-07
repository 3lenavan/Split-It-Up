import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

const C = {
  bg: "#07070f",
  surface: "#141420",
  surfaceSoft: "#1a1a29",
  border: "#2c2c42",
  accent: "#a855f7",
  accentSoft: "#d8b4fe",
  blue: "#38bdf8",
  text: "#f3f0ff",
  textMuted: "#8c89a8",
};

function TabBarIcon({
  focused,
  color,
  label,
  name,
}: {
  focused: boolean;
  color: string;
  label: string;
  name: "house.fill" | "plus.circle.fill" | "person.fill";
}) {
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
            <IconSymbol size={21} name={name} color={C.text} />
          </View>
          <Text style={styles.activeTabLabel}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.inactiveTab}>
          <IconSymbol size={21} name={name} color={color} />
          <Text style={styles.inactiveTabLabel}>{label}</Text>
        </View>
      )}
    </View>
  );
}

function TabBarBackground() {
  return (
    <View style={styles.backgroundWrap}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["rgba(24,24,38,0.94)", "rgba(10,10,18,0.9)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function BottomEdgeMask() {
  return (
    <View pointerEvents="none" style={styles.bottomMaskWrap}>
      <BlurView intensity={42} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["rgba(7,7,15,0)", "rgba(7,7,15,0.72)", "rgba(7,7,15,0.98)"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={styles.root}>
      <BottomEdgeMask />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarShowLabel: false,
          tabBarActiveTintColor: C.text,
          tabBarInactiveTintColor: C.textMuted,
          animation: "shift",
          sceneStyle: {
            backgroundColor: C.bg,
          },
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabBarItem,
          tabBarBackground: () => <TabBarBackground />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon focused={focused} color={color} label="Home" name="house.fill" />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "Add",
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon focused={focused} color={color} label="Add" name="plus.circle.fill" />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon focused={focused} color={color} label="Profile" name="person.fill" />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
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
    elevation: 0,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    overflow: "hidden",
  },
  tabBarItem: {
    paddingVertical: 8,
  },
  backgroundWrap: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  bottomMaskWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 130,
    zIndex: 0,
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
  activeTabLabel: {
    color: C.text,
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
    color: C.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
