import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "dark" | "light";

export type AppPalette = {
  mode: ThemeMode;
  bg: string;
  surface: string;
  card: string;
  cardBright: string;
  border: string;
  borderBright: string;
  accent: string;
  accentDim: string;
  accentBright: string;
  accentDeep: string;
  green: string;
  greenDim: string;
  red: string;
  redDim: string;
  amber: string;
  amberDim: string;
  blue: string;
  blueDim: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  orbPrimary: string;
  orbSecondary: string;
  tabSurface: string;
  tabSurfaceSoft: string;
  tabBorder: string;
  tabText: string;
  tabTextMuted: string;
  tabAccentSoft: string;
};

const STORAGE_KEY = "splititup-theme-mode";

export const THEME_PALETTES: Record<ThemeMode, AppPalette> = {
  dark: {
    mode: "dark",
    bg: "#07070f",
    surface: "#0f0f1a",
    card: "#141420",
    cardBright: "#1c1c2e",
    border: "#252538",
    borderBright: "#353550",
    accent: "#a855f7",
    accentDim: "#a855f730",
    accentBright: "#d8b4fe",
    accentDeep: "#7c3aed",
    green: "#22d3a5",
    greenDim: "#22d3a518",
    red: "#f43f5e",
    redDim: "#f43f5e18",
    amber: "#fbbf24",
    amberDim: "#fbbf2418",
    blue: "#38bdf8",
    blueDim: "#38bdf818",
    textPrimary: "#f0eeff",
    textSecondary: "#8c89a8",
    textMuted: "#6b6884",
    orbPrimary: "#7c3aed",
    orbSecondary: "#4f46e5",
    tabSurface: "#141420",
    tabSurfaceSoft: "#1a1a29",
    tabBorder: "#2c2c42",
    tabText: "#f3f0ff",
    tabTextMuted: "#8c89a8",
    tabAccentSoft: "#d8b4fe",
  },
  light: {
    mode: "light",
    bg: "#f5f7ff",
    surface: "#ffffff",
    card: "#ffffff",
    cardBright: "#eef2ff",
    border: "#d8deef",
    borderBright: "#c8d0e5",
    accent: "#7c3aed",
    accentDim: "#7c3aed14",
    accentBright: "#7c3aed",
    accentDeep: "#6d28d9",
    green: "#059669",
    greenDim: "#05966912",
    red: "#e11d48",
    redDim: "#e11d4812",
    amber: "#d97706",
    amberDim: "#d9770612",
    blue: "#0284c7",
    blueDim: "#0284c712",
    textPrimary: "#181826",
    textSecondary: "#66637d",
    textMuted: "#9b97b5",
    orbPrimary: "#8b5cf640",
    orbSecondary: "#38bdf830",
    tabSurface: "#ffffff",
    tabSurfaceSoft: "#eef2ff",
    tabBorder: "#d8deef",
    tabText: "#181826",
    tabTextMuted: "#7d7997",
    tabAccentSoft: "#7c3aed",
  },
};

type AppThemeContextValue = {
  mode: ThemeMode;
  palette: AppPalette;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  navigationTheme: Theme;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function buildNavigationTheme(mode: ThemeMode, palette: AppPalette): Theme {
  const base = mode === "dark" ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.accent,
      background: palette.bg,
      card: palette.card,
      text: palette.textPrimary,
      border: palette.border,
      notification: palette.red,
    },
  };
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "dark" || stored === "light") {
          setModeState(stored);
        }
      })
      .catch(() => {});
  }, []);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem(STORAGE_KEY, nextMode).catch(() => {});
  };

  const value = useMemo(() => {
    const palette = THEME_PALETTES[mode];
    return {
      mode,
      palette,
      setMode,
      isDark: mode === "dark",
      navigationTheme: buildNavigationTheme(mode, palette),
    };
  }, [mode]);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within an AppThemeProvider");
  }
  return context;
}
