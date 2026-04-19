import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { BackgroundMode, useAppTheme } from "@/lib/app-theme";

export function AppBackground() {
  const { backgroundMode, palette: C } = useAppTheme();

  if (backgroundMode === "default") return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={C.mode === "dark" ? [`${C.bg}00`, `${C.bg}88`, C.bg] : [`${C.bg}22`, `${C.bg}88`, C.bg]}
        style={StyleSheet.absoluteFill}
      />
      <SceneArt mode={backgroundMode} compact={false} />
    </View>
  );
}

export function AppBackgroundPreview({ mode }: { mode: BackgroundMode }) {
  return (
    <View style={styles.previewClip}>
      <SceneArt mode={mode} compact />
    </View>
  );
}

function SceneArt({ mode, compact }: { mode: BackgroundMode; compact: boolean }) {
  if (mode === "mountains") return <Mountains compact={compact} />;
  if (mode === "city") return <City compact={compact} />;
  if (mode === "ocean") return <Ocean compact={compact} />;
  if (mode === "stars") return <Stars compact={compact} />;
  return <DefaultDots compact={compact} />;
}

function DefaultDots({ compact }: { compact: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[styles.defaultOrb, compact ? styles.previewOrbOne : styles.defaultOrbOne]} />
      <View style={[styles.defaultOrb, compact ? styles.previewOrbTwo : styles.defaultOrbTwo]} />
    </View>
  );
}

function Mountains({ compact }: { compact: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={compact ? ["#16213e", "#0f766e"] : ["#11182733", "#0f766e18", "transparent"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.moon, compact && styles.previewMoon]} />
      <View style={[styles.star, compact ? styles.previewStarOne : styles.starOne]} />
      <View style={[styles.star, compact ? styles.previewStarTwo : styles.starTwo]} />
      <View style={[styles.mountain, styles.mountainBack, compact && styles.previewMountainBack]} />
      <View style={[styles.mountain, styles.mountainMid, compact && styles.previewMountainMid]} />
      <View style={[styles.mountain, styles.mountainFront, compact && styles.previewMountainFront]} />
    </View>
  );
}

function City({ compact }: { compact: boolean }) {
  const buildingCount = compact ? 7 : 11;
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={compact ? ["#111827", "#312e81"] : ["#11182722", "#312e8118", "transparent"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.cityGlow, compact && styles.previewCityGlow]} />
      <View style={[styles.citySun, compact && styles.previewCitySun]} />
      <View style={styles.skyline}>
        {Array.from({ length: buildingCount }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.building,
              {
                height: compact ? 24 + (index % 4) * 8 : 58 + (index % 5) * 18,
                width: compact ? 10 : 22,
                backgroundColor: index % 2 === 0 ? "#1f2937" : "#111827",
              },
            ]}
          >
            <View style={styles.windowRow}>
              <View style={styles.windowDot} />
              <View style={styles.windowDot} />
            </View>
            <View style={styles.windowRow}>
              <View style={styles.windowDot} />
              <View style={styles.windowDotDim} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function Ocean({ compact }: { compact: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={compact ? ["#083344", "#0f766e"] : ["#08334422", "#14b8a61c", "transparent"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.oceanSun, compact && styles.previewOceanSun]} />
      <View style={[styles.wave, styles.waveBack, compact && styles.previewWaveBack]} />
      <View style={[styles.wave, styles.waveMid, compact && styles.previewWaveMid]} />
      <View style={[styles.wave, styles.waveFront, compact && styles.previewWaveFront]} />
      <View style={[styles.bubble, compact ? styles.previewBubbleOne : styles.bubbleOne]} />
      <View style={[styles.bubble, compact ? styles.previewBubbleTwo : styles.bubbleTwo]} />
    </View>
  );
}

function Stars({ compact }: { compact: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={compact ? ["#1e1b4b", "#312e81"] : ["#1e1b4b22", "#7c3aed18", "transparent"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.cloud, compact ? styles.previewCloudOne : styles.cloudOne]} />
      <View style={[styles.cloud, compact ? styles.previewCloudTwo : styles.cloudTwo]} />
      <View style={[styles.twinkle, compact ? styles.previewTwinkleOne : styles.twinkleOne]} />
      <View style={[styles.twinkle, compact ? styles.previewTwinkleTwo : styles.twinkleTwo]} />
      <View style={[styles.comet, compact ? styles.previewComet : styles.cometMain]} />
    </View>
  );
}

const styles = StyleSheet.create({
  previewClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  defaultOrb: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.5,
  },
  defaultOrbOne: { width: 260, height: 260, top: -80, right: -70, backgroundColor: "#7c3aed" },
  defaultOrbTwo: { width: 190, height: 190, bottom: 95, left: -50, backgroundColor: "#4f46e5" },
  previewOrbOne: { width: 60, height: 60, top: -12, right: -14, backgroundColor: "#7c3aed" },
  previewOrbTwo: { width: 46, height: 46, bottom: -10, left: -8, backgroundColor: "#4f46e5" },
  moon: {
    position: "absolute",
    top: 72,
    right: 48,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fef3c7",
    opacity: 0.78,
  },
  previewMoon: { top: 12, right: 16, width: 18, height: 18, borderRadius: 9 },
  star: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#f8fafc",
    opacity: 0.72,
  },
  starOne: { top: 118, left: 48 },
  starTwo: { top: 166, right: 120 },
  previewStarOne: { top: 18, left: 18 },
  previewStarTwo: { top: 30, right: 48 },
  mountain: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 22,
    transform: [{ rotate: "45deg" }],
  },
  mountainBack: { bottom: -164, left: -30, backgroundColor: "#0f766e55" },
  mountainMid: { bottom: -154, right: 34, backgroundColor: "#38bdf84a" },
  mountainFront: { bottom: -176, left: 82, backgroundColor: "#0f172acc" },
  previewMountainBack: { width: 80, height: 80, bottom: -54, left: -10 },
  previewMountainMid: { width: 78, height: 78, bottom: -50, right: 12 },
  previewMountainFront: { width: 92, height: 92, bottom: -62, left: 34 },
  cityGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -40,
    top: 78,
    backgroundColor: "#ec489933",
  },
  previewCityGlow: { width: 70, height: 70, borderRadius: 35, top: 4, right: -12 },
  citySun: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    top: 95,
    right: 50,
    backgroundColor: "#22d3ee55",
  },
  previewCitySun: { width: 22, height: 22, borderRadius: 11, top: 14, right: 16 },
  skyline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    opacity: 0.9,
  },
  building: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  windowRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  windowDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#fde68a" },
  windowDotDim: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#67e8f9" },
  oceanSun: {
    position: "absolute",
    width: 62,
    height: 62,
    borderRadius: 31,
    right: 48,
    top: 90,
    backgroundColor: "#fde68a88",
  },
  previewOceanSun: { width: 22, height: 22, borderRadius: 11, right: 14, top: 12 },
  wave: {
    position: "absolute",
    left: -60,
    right: -60,
    height: 100,
    borderRadius: 999,
  },
  waveBack: { bottom: 42, backgroundColor: "#0ea5e933", transform: [{ rotate: "-4deg" }] },
  waveMid: { bottom: 12, backgroundColor: "#14b8a650", transform: [{ rotate: "3deg" }] },
  waveFront: { bottom: -34, backgroundColor: "#67e8f96b" },
  previewWaveBack: { height: 34, bottom: 18, left: -20, right: -20 },
  previewWaveMid: { height: 34, bottom: 5, left: -20, right: -20 },
  previewWaveFront: { height: 38, bottom: -15, left: -20, right: -20 },
  bubble: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "#cffafe",
    borderRadius: 999,
    opacity: 0.55,
  },
  bubbleOne: { width: 18, height: 18, top: 130, left: 60 },
  bubbleTwo: { width: 10, height: 10, top: 190, right: 95 },
  previewBubbleOne: { width: 8, height: 8, top: 24, left: 26 },
  previewBubbleTwo: { width: 5, height: 5, top: 38, right: 42 },
  cloud: {
    position: "absolute",
    height: 26,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  cloudOne: { width: 96, top: 110, left: 34 },
  cloudTwo: { width: 70, top: 172, right: 52 },
  previewCloudOne: { width: 40, height: 12, top: 17, left: 12 },
  previewCloudTwo: { width: 30, height: 10, top: 38, right: 12 },
  twinkle: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#fde68a",
    transform: [{ rotate: "45deg" }],
  },
  twinkleOne: { top: 82, right: 72 },
  twinkleTwo: { top: 212, left: 74, backgroundColor: "#c4b5fd" },
  previewTwinkleOne: { top: 10, right: 14, width: 7, height: 7 },
  previewTwinkleTwo: { top: 49, left: 20, width: 6, height: 6, backgroundColor: "#c4b5fd" },
  comet: {
    position: "absolute",
    width: 70,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#f8fafc",
    transform: [{ rotate: "-22deg" }],
    opacity: 0.58,
  },
  cometMain: { top: 142, right: 28 },
  previewComet: { width: 34, top: 28, right: 22 },
});
