import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

export type AvatarDecorationId =
  | "none"
  | "neon"
  | "orbit"
  | "bloom"
  | "crown"
  | "pixel"
  | "floaties"
  | "flame"
  | "kitty"
  | "sparkle"
  | "rainbow"
  | "clouds"
  | "storm";

export type AvatarDecorationOption = {
  id: AvatarDecorationId;
  name: string;
  colors: string[];
};

export const AVATAR_DECORATIONS: AvatarDecorationOption[] = [
  { id: "none", name: "None", colors: ["#64748b"] },
  { id: "neon", name: "Neon Halo", colors: ["#22d3ee", "#a855f7"] },
  { id: "orbit", name: "Orbit", colors: ["#38bdf8", "#84cc16"] },
  { id: "bloom", name: "Bloom", colors: ["#fb7185", "#f9a8d4"] },
  { id: "crown", name: "Crown", colors: ["#facc15", "#f97316"] },
  { id: "pixel", name: "Pixel Corners", colors: ["#818cf8", "#22c55e"] },
  { id: "floaties", name: "Floaties", colors: ["#67e8f9", "#f9a8d4"] },
  { id: "flame", name: "Tiny Flame", colors: ["#fb7185", "#f97316"] },
  { id: "kitty", name: "Kitty", colors: ["#f9a8d4", "#f0abfc"] },
  { id: "sparkle", name: "Sparkle Pop", colors: ["#fde68a", "#93c5fd"] },
  { id: "rainbow", name: "Rainbow Cloud", colors: ["#fb7185", "#67e8f9"] },
  { id: "clouds", name: "Cloud Hug", colors: ["#e0f2fe", "#fce7f3"] },
  { id: "storm", name: "Storm Ring", colors: ["#93c5fd", "#fde047"] },
];

export const getAvatarDecoration = (value?: string | null): AvatarDecorationOption => {
  return AVATAR_DECORATIONS.find((decoration) => decoration.id === value) ?? AVATAR_DECORATIONS[0];
};

export function AvatarDecoration({
  decorationId,
  size,
}: {
  decorationId?: string | null;
  size: number;
}) {
  const decoration = getAvatarDecoration(decorationId);
  const spin = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const flicker = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (decoration.id === "none") return;

    spin.setValue(0);
    bob.setValue(0);
    pulse.setValue(0);
    flicker.setValue(0);
    twinkle.setValue(0);

    const animations = [
      Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 6200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, {
            toValue: 1,
            duration: 1150,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bob, {
            toValue: 0,
            duration: 1150,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(flicker, {
            toValue: 1,
            duration: 280,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(flicker, {
            toValue: 0.28,
            duration: 180,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(flicker, {
            toValue: 0.72,
            duration: 240,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(twinkle, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(twinkle, {
            toValue: 0,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
    ];

    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [bob, decoration.id, flicker, pulse, spin, twinkle]);

  const spinRotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const reverseSpin = spin.interpolate({ inputRange: [0, 1], outputRange: ["360deg", "0deg"] });
  const softBob = bob.interpolate({ inputRange: [0, 1], outputRange: [-3, 4] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.06] });
  const flickerScale = flicker.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] });
  const flickerOpacity = flicker.interpolate({ inputRange: [0, 1], outputRange: [0.68, 1] });
  const twinkleScale = twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1.16] });
  const twinkleOpacity = twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  if (decoration.id === "none") return null;

  if (decoration.id === "neon") {
    return (
      <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
        <Animated.View style={[styles.neonRing, { borderColor: decoration.colors[0], transform: [{ scale: pulseScale }] }]} />
        <View style={[styles.neonRingInner, { borderColor: decoration.colors[1] }]} />
        <Animated.View style={[styles.dot, styles.dotTop, { backgroundColor: decoration.colors[0], transform: [{ translateY: softBob }] }]} />
        <Animated.View style={[styles.dot, styles.dotBottom, { backgroundColor: decoration.colors[1], transform: [{ translateY: softBob }, { scale: twinkleScale }] }]} />
      </View>
    );
  }

  if (decoration.id === "orbit") {
    return (
      <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
        <Animated.View
          style={[
            styles.orbitRing,
            {
              borderTopColor: decoration.colors[0],
              borderBottomColor: decoration.colors[1],
              transform: [{ rotate: spinRotate }],
            },
          ]}
        />
        <Animated.View style={[styles.orbitDot, { backgroundColor: decoration.colors[1], transform: [{ rotate: reverseSpin }, { scale: pulseScale }] }]} />
      </View>
    );
  }

  if (decoration.id === "bloom") {
    return (
      <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
        {[0, 1, 2, 3, 4].map((index) => (
          <View
            key={index}
            style={[
              styles.petal,
              {
                backgroundColor: index % 2 === 0 ? decoration.colors[0] : decoration.colors[1],
                top: size / 2 - 12,
                left: size / 2 - 7.5,
                transform: [{ rotate: `${index * 72}deg` }, { translateY: -(size * 0.42) }],
              },
            ]}
          />
        ))}
        <Animated.View
          style={[
            styles.bloomCenter,
            {
              backgroundColor: decoration.colors[1],
              opacity: twinkleOpacity,
              transform: [{ scale: twinkleScale }],
            },
          ]}
        />
      </View>
    );
  }

  if (decoration.id === "crown") {
    return (
      <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
        <Animated.View style={[styles.crownBand, { borderColor: decoration.colors[1], transform: [{ translateY: softBob }] }]}>
          <Text style={[styles.crownText, { color: decoration.colors[0] }]}>M</Text>
        </Animated.View>
      </View>
    );
  }

  if (decoration.id === "floaties") {
    return (
      <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
        <Animated.View style={[styles.floatTrack, { transform: [{ rotate: spinRotate }] }]}>
          <Animated.View style={[styles.floatBall, styles.floatBallTop, { backgroundColor: decoration.colors[0], transform: [{ scale: pulseScale }] }]} />
          <Animated.View style={[styles.floatBall, styles.floatBallRight, { backgroundColor: decoration.colors[1], transform: [{ translateY: softBob }] }]} />
          <Animated.View style={[styles.floatBallSmall, styles.floatBallLeft, { backgroundColor: "#c4b5fd", opacity: twinkleOpacity }]} />
        </Animated.View>
      </View>
    );
  }

  if (decoration.id === "flame") {
    return (
      <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
        <Animated.View
          style={[
            styles.flameWrap,
            {
              opacity: flickerOpacity,
              transform: [{ translateY: softBob }, { scale: flickerScale }],
            },
          ]}
        >
          <View style={[styles.flame, styles.flameBack, { backgroundColor: decoration.colors[1] }]} />
          <View style={[styles.flame, styles.flameFront, { backgroundColor: decoration.colors[0] }]} />
          <View style={[styles.flame, styles.flameCore, { backgroundColor: "#fde68a" }]} />
        </Animated.View>
        <Animated.View style={[styles.flameSpark, styles.flameSparkLeft, { opacity: twinkleOpacity, transform: [{ scale: twinkleScale }] }]} />
        <Animated.View style={[styles.flameSpark, styles.flameSparkRight, { opacity: twinkleOpacity, transform: [{ scale: pulseScale }] }]} />
      </View>
    );
  }

  if (decoration.id === "kitty") {
    return (
      <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
        <Animated.View style={[styles.kittyTop, { transform: [{ translateY: softBob }, { scale: pulseScale }] }]}>
          <View style={[styles.catEar, styles.catEarLeft, { borderBottomColor: decoration.colors[0] }]} />
          <View style={[styles.catEarInner, styles.catEarInnerLeft, { borderBottomColor: "#fff1f2" }]} />
          <View style={[styles.catEar, styles.catEarRight, { borderBottomColor: decoration.colors[1] }]} />
          <View style={[styles.catEarInner, styles.catEarInnerRight, { borderBottomColor: "#fff1f2" }]} />
        </Animated.View>
        <View style={[styles.whisker, styles.whiskerLeftTop, { backgroundColor: decoration.colors[0] }]} />
        <View style={[styles.whisker, styles.whiskerLeftBottom, { backgroundColor: decoration.colors[0] }]} />
        <View style={[styles.whisker, styles.whiskerRightTop, { backgroundColor: decoration.colors[1] }]} />
        <View style={[styles.whisker, styles.whiskerRightBottom, { backgroundColor: decoration.colors[1] }]} />
      </View>
    );
  }

  if (decoration.id === "sparkle") {
    return (
      <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
        <Animated.View style={[styles.sparkle, styles.sparkleTop, { backgroundColor: decoration.colors[0], opacity: twinkleOpacity, transform: [{ scale: twinkleScale }, { rotate: spinRotate }] }]} />
        <Animated.View style={[styles.sparkle, styles.sparkleRight, { backgroundColor: decoration.colors[1], opacity: flickerOpacity, transform: [{ scale: pulseScale }, { rotate: reverseSpin }] }]} />
        <Animated.View style={[styles.sparkleMini, styles.sparkleLeft, { backgroundColor: "#f0abfc", transform: [{ translateY: softBob }, { scale: pulseScale }] }]} />
      </View>
    );
  }

  if (decoration.id === "clouds") {
    return (
      <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
        <Animated.View style={[styles.cloudFrameGlow, { opacity: twinkleOpacity, transform: [{ scale: pulseScale }] }]} />
        <Animated.View style={[styles.cloudFrameCluster, styles.cloudFrameTop, { transform: [{ translateY: softBob }, { scale: pulseScale }] }]}>
          <View style={[styles.cloudFramePuff, styles.cloudFramePuffLarge, { backgroundColor: decoration.colors[0] }]} />
          <View style={[styles.cloudFramePuff, styles.cloudFramePuffMid, { backgroundColor: "#f8fafc" }]} />
          <View style={[styles.cloudFramePuff, styles.cloudFramePuffSmall, { backgroundColor: decoration.colors[1] }]} />
        </Animated.View>
        <Animated.View style={[styles.cloudFrameCluster, styles.cloudFrameLeft, { transform: [{ translateY: softBob }, { scale: twinkleScale }] }]}>
          <View style={[styles.cloudFramePuff, styles.cloudFramePuffLarge, { backgroundColor: "#f8fafc" }]} />
          <View style={[styles.cloudFramePuff, styles.cloudFramePuffMid, { backgroundColor: decoration.colors[0] }]} />
          <View style={[styles.cloudFramePuff, styles.cloudFramePuffSmall, { backgroundColor: decoration.colors[1] }]} />
        </Animated.View>
        <Animated.View style={[styles.cloudFrameCluster, styles.cloudFrameRight, { transform: [{ translateY: softBob }, { scale: pulseScale }] }]}>
          <View style={[styles.cloudFramePuff, styles.cloudFramePuffLarge, { backgroundColor: decoration.colors[1] }]} />
          <View style={[styles.cloudFramePuff, styles.cloudFramePuffMid, { backgroundColor: "#f8fafc" }]} />
          <View style={[styles.cloudFramePuff, styles.cloudFramePuffSmall, { backgroundColor: decoration.colors[0] }]} />
        </Animated.View>
        <Animated.View style={[styles.cloudFrameCluster, styles.cloudFrameBottom, { opacity: flickerOpacity, transform: [{ translateY: softBob }, { scale: pulseScale }] }]}>
          <View style={[styles.cloudFramePuff, styles.cloudFramePuffLarge, { backgroundColor: "#f8fafc" }]} />
          <View style={[styles.cloudFramePuff, styles.cloudFramePuffMid, { backgroundColor: decoration.colors[1] }]} />
          <View style={[styles.cloudFramePuff, styles.cloudFramePuffSmall, { backgroundColor: decoration.colors[0] }]} />
        </Animated.View>
      </View>
    );
  }

  if (decoration.id === "storm") {
    return (
      <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
        <Animated.View style={[styles.stormRing, { borderColor: decoration.colors[0], opacity: flickerOpacity, transform: [{ scale: pulseScale }] }]} />
        <Animated.View style={[styles.stormCloud, { transform: [{ translateY: softBob }, { scale: pulseScale }] }]}>
          <View style={[styles.stormCloudPuff, styles.stormCloudPuffOne]} />
          <View style={[styles.stormCloudPuff, styles.stormCloudPuffTwo]} />
          <View style={[styles.stormCloudPuff, styles.stormCloudPuffThree]} />
        </Animated.View>
        <Animated.View style={[styles.raindrop, styles.raindropOne, { backgroundColor: decoration.colors[0], opacity: twinkleOpacity, transform: [{ translateY: softBob }] }]} />
        <Animated.View style={[styles.raindrop, styles.raindropTwo, { backgroundColor: "#bfdbfe", opacity: flickerOpacity, transform: [{ translateY: softBob }] }]} />
        <Animated.View style={[styles.raindrop, styles.raindropThree, { backgroundColor: decoration.colors[0], opacity: twinkleOpacity, transform: [{ translateY: softBob }] }]} />
        <Animated.View style={[styles.lightningBolt, styles.lightningLeft, { opacity: flickerOpacity, transform: [{ scale: flickerScale }, { rotate: "-12deg" }] }]}>
          <View style={[styles.lightningPart, styles.lightningPartTop, { backgroundColor: decoration.colors[1] }]} />
          <View style={[styles.lightningPart, styles.lightningPartBottom, { backgroundColor: decoration.colors[1] }]} />
        </Animated.View>
        <Animated.View style={[styles.lightningBolt, styles.lightningRight, { opacity: twinkleOpacity, transform: [{ scale: twinkleScale }, { rotate: "14deg" }] }]}>
          <View style={[styles.lightningPart, styles.lightningPartTop, { backgroundColor: decoration.colors[1] }]} />
          <View style={[styles.lightningPart, styles.lightningPartBottom, { backgroundColor: decoration.colors[1] }]} />
        </Animated.View>
      </View>
    );
  }

  if (decoration.id === "rainbow") {
    const rainbowColors: [string, string, string, string, string, string] = ["#fb7185", "#fdba74", "#fde68a", "#86efac", "#67e8f9", "#a78bfa"];

    return (
      <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
        <Animated.View style={[styles.rainbowHalo, { opacity: twinkleOpacity, transform: [{ scale: pulseScale }] }]} />
        <Animated.View
          style={[
            styles.rainbowBandWrap,
            {
              width: size * 1.22,
              height: size * 0.28,
              top: size * 0.1,
              left: -size * 0.1,
              transform: [{ translateY: softBob }, { rotate: "-23deg" }],
            },
          ]}
        >
          <LinearGradient
            colors={rainbowColors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.rainbowBand}
          />
          <View style={styles.rainbowShine} />
        </Animated.View>

        <Animated.View style={[styles.cloud, styles.cloudLeft, { transform: [{ translateY: softBob }, { scale: pulseScale }] }]}>
          <View style={[styles.cloudPuff, styles.cloudPuffLarge]} />
          <View style={[styles.cloudPuff, styles.cloudPuffMid]} />
          <View style={[styles.cloudPuff, styles.cloudPuffSmall]} />
        </Animated.View>

        <Animated.View style={[styles.cloud, styles.cloudRight, { transform: [{ translateY: softBob }, { scale: twinkleScale }] }]}>
          <View style={[styles.cloudPuff, styles.cloudPuffLarge]} />
          <View style={[styles.cloudPuff, styles.cloudPuffMid]} />
          <View style={[styles.cloudPuff, styles.cloudPuffSmall]} />
        </Animated.View>

        <Animated.View style={[styles.rainbowDust, styles.rainbowDustTop, { opacity: twinkleOpacity, transform: [{ scale: twinkleScale }] }]} />
        <Animated.View style={[styles.rainbowDust, styles.rainbowDustLeft, { opacity: flickerOpacity, transform: [{ scale: pulseScale }] }]} />
        <Animated.View style={[styles.rainbowDust, styles.rainbowDustRight, { opacity: twinkleOpacity, transform: [{ scale: pulseScale }] }]} />
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View style={[styles.corner, styles.cornerTopLeft, { borderColor: decoration.colors[0], transform: [{ scale: pulseScale }] }]} />
      <Animated.View style={[styles.corner, styles.cornerTopRight, { borderColor: decoration.colors[1], transform: [{ scale: pulseScale }] }]} />
      <Animated.View style={[styles.corner, styles.cornerBottomLeft, { borderColor: decoration.colors[1], transform: [{ scale: pulseScale }] }]} />
      <Animated.View style={[styles.corner, styles.cornerBottomRight, { borderColor: decoration.colors[0], transform: [{ scale: pulseScale }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  neonRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 3,
    opacity: 0.95,
  },
  neonRingInner: {
    position: "absolute",
    top: 5,
    right: 5,
    bottom: 5,
    left: 5,
    borderRadius: 999,
    borderWidth: 1,
    opacity: 0.75,
  },
  dot: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  dotTop: { top: 0, right: 14 },
  dotBottom: { bottom: 3, left: 12 },
  orbitRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 3,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    transform: [{ rotate: "-22deg" }],
  },
  orbitDot: {
    position: "absolute",
    top: 10,
    right: 7,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  petal: {
    position: "absolute",
    width: 15,
    height: 24,
    borderRadius: 12,
    opacity: 0.9,
  },
  bloomCenter: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    top: 2,
    right: 20,
  },
  crownBand: {
    position: "absolute",
    top: -10,
    width: 56,
    height: 30,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: "rgba(15,23,42,0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  crownText: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: -1,
  },
  corner: {
    position: "absolute",
    width: 22,
    height: 22,
    borderWidth: 3,
  },
  cornerTopLeft: { top: 1, left: 1, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  cornerTopRight: { top: 1, right: 1, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  cornerBottomLeft: { bottom: 1, left: 1, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  cornerBottomRight: { bottom: 1, right: 1, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  floatTrack: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  floatBall: {
    position: "absolute",
    width: 13,
    height: 13,
    borderRadius: 7,
    shadowColor: "#fff",
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  floatBallSmall: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  floatBallTop: { top: -1, left: "43%" },
  floatBallRight: { right: 0, bottom: "25%" },
  floatBallLeft: { left: 2, top: "58%" },
  flameWrap: {
    position: "absolute",
    top: -14,
    width: 52,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  flame: {
    position: "absolute",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 26,
    borderBottomLeftRadius: 6,
    transform: [{ rotate: "45deg" }],
  },
  flameBack: { width: 38, height: 38 },
  flameFront: { width: 28, height: 28, top: 9 },
  flameCore: { width: 16, height: 16, top: 17 },
  flameSpark: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fde68a",
  },
  flameSparkLeft: { top: 1, left: 16 },
  flameSparkRight: { top: 4, right: 14 },
  kittyTop: {
    ...StyleSheet.absoluteFillObject,
  },
  catEar: {
    position: "absolute",
    top: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 26,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  catEarLeft: { left: 7, transform: [{ rotate: "-20deg" }] },
  catEarRight: { right: 7, transform: [{ rotate: "20deg" }] },
  catEarInner: {
    position: "absolute",
    top: 4,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 15,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  catEarInnerLeft: { left: 13, transform: [{ rotate: "-20deg" }] },
  catEarInnerRight: { right: 13, transform: [{ rotate: "20deg" }] },
  whisker: {
    position: "absolute",
    width: 24,
    height: 2,
    borderRadius: 999,
    opacity: 0.9,
  },
  whiskerLeftTop: { left: -5, top: "48%", transform: [{ rotate: "12deg" }] },
  whiskerLeftBottom: { left: -5, top: "58%", transform: [{ rotate: "-12deg" }] },
  whiskerRightTop: { right: -5, top: "48%", transform: [{ rotate: "-12deg" }] },
  whiskerRightBottom: { right: -5, top: "58%", transform: [{ rotate: "12deg" }] },
  sparkle: {
    position: "absolute",
    width: 15,
    height: 15,
    borderRadius: 3,
  },
  sparkleMini: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 2,
  },
  sparkleTop: { top: 0, right: 15 },
  sparkleRight: { right: 1, bottom: 17 },
  sparkleLeft: { left: 5, bottom: 9 },
  cloudFrameGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.36)",
    shadowColor: "#e0f2fe",
    shadowOpacity: 0.62,
    shadowRadius: 12,
  },
  cloudFrameCluster: {
    position: "absolute",
    width: "48%",
    height: "28%",
  },
  cloudFrameTop: { top: -9, left: "26%" },
  cloudFrameLeft: { left: -9, top: "40%", opacity: 0.92 },
  cloudFrameRight: { right: -10, top: "34%", opacity: 0.92 },
  cloudFrameBottom: { bottom: -10, left: "25%", opacity: 0.88 },
  cloudFramePuff: {
    position: "absolute",
    borderRadius: 999,
    shadowColor: "#fff",
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  cloudFramePuffLarge: {
    width: "58%",
    height: "90%",
    left: 0,
    bottom: 0,
  },
  cloudFramePuffMid: {
    width: "54%",
    height: "76%",
    left: "28%",
    bottom: "9%",
  },
  cloudFramePuffSmall: {
    width: "38%",
    height: "58%",
    right: 0,
    bottom: 0,
  },
  stormRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 2,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  stormCloud: {
    position: "absolute",
    top: -14,
    width: "72%",
    height: "34%",
  },
  stormCloudPuff: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#cbd5e1",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.48)",
    shadowColor: "#bfdbfe",
    shadowOpacity: 0.48,
    shadowRadius: 8,
  },
  stormCloudPuffOne: {
    width: "42%",
    height: "72%",
    left: "3%",
    bottom: 0,
  },
  stormCloudPuffTwo: {
    width: "52%",
    height: "92%",
    left: "25%",
    bottom: "5%",
    backgroundColor: "#e2e8f0",
  },
  stormCloudPuffThree: {
    width: "38%",
    height: "68%",
    right: "4%",
    bottom: 0,
  },
  raindrop: {
    position: "absolute",
    width: 4,
    height: 13,
    borderRadius: 999,
    transform: [{ rotate: "16deg" }],
  },
  raindropOne: { top: "14%", left: "28%" },
  raindropTwo: { top: "17%", left: "48%" },
  raindropThree: { top: "15%", right: "28%" },
  lightningBolt: {
    position: "absolute",
    width: 18,
    height: 30,
  },
  lightningLeft: { left: 1, top: "20%" },
  lightningRight: { right: 0, top: "23%" },
  lightningPart: {
    position: "absolute",
    width: 8,
    height: 18,
    borderRadius: 2,
    shadowColor: "#fde047",
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
  lightningPartTop: {
    top: 0,
    left: 7,
    transform: [{ rotate: "28deg" }],
  },
  lightningPartBottom: {
    top: 12,
    left: 3,
    transform: [{ rotate: "-28deg" }],
  },
  rainbowHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.48)",
    shadowColor: "#f9a8d4",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  rainbowBandWrap: {
    position: "absolute",
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#f9a8d4",
    shadowOpacity: 0.58,
    shadowRadius: 12,
    elevation: 4,
  },
  rainbowBand: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  rainbowShine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 2,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.42)",
  },
  cloud: {
    position: "absolute",
    width: "46%",
    height: "27%",
  },
  cloudLeft: { left: -3, bottom: -3 },
  cloudRight: { right: -5, top: 2, opacity: 0.82 },
  cloudPuff: {
    position: "absolute",
    backgroundColor: "#fce7f3",
    shadowColor: "#fff",
    shadowOpacity: 0.55,
    shadowRadius: 7,
  },
  cloudPuffLarge: {
    width: "58%",
    height: "88%",
    borderRadius: 999,
    left: 0,
    bottom: 0,
  },
  cloudPuffMid: {
    width: "54%",
    height: "76%",
    borderRadius: 999,
    left: "30%",
    bottom: "7%",
    backgroundColor: "#fbcfe8",
  },
  cloudPuffSmall: {
    width: "38%",
    height: "58%",
    borderRadius: 999,
    right: 0,
    bottom: 0,
    backgroundColor: "#f5d0fe",
  },
  rainbowDust: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#fff7ed",
    shadowColor: "#fff",
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  rainbowDustTop: { top: 1, left: "26%" },
  rainbowDustLeft: { left: 0, top: "36%" },
  rainbowDustRight: { right: 4, bottom: "26%" },
});
