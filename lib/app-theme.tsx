import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

export type ThemeMode = "dark" | "light" | "aurora" | "candy" | "mint" | "ruby";
export type ThemeAppearance = "dark" | "light";
export type BackgroundMode = "default" | "mountains" | "city" | "ocean" | "stars";

export type AppPalette = {
  id: ThemeMode;
  mode: ThemeAppearance;
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
const BACKGROUND_STORAGE_KEY = "splititup-background-mode";
const userThemeKey = (userId: string) => `${STORAGE_KEY}:${userId}`;
const userBackgroundKey = (userId: string) => `${BACKGROUND_STORAGE_KEY}:${userId}`;

export type ThemeOption = {
  id: ThemeMode;
  name: string;
  description: string;
  colors: string[];
};

export type AppBackgroundOption = {
  id: BackgroundMode;
  name: string;
  description: string;
  colors: string[];
};

export const THEME_OPTIONS: ThemeOption[] = [
  { id: "dark", name: "Dark", description: "Soft dark with bright violet.", colors: ["#07070f", "#a855f7", "#22d3a5"] },
  { id: "light", name: "Light", description: "Clean and bright.", colors: ["#f5f7ff", "#7c3aed", "#0284c7"] },
  { id: "aurora", name: "Aurora", description: "Green glow with pink sparks.", colors: ["#06110f", "#34d399", "#fb7185"] },
  { id: "candy", name: "Candy", description: "Cute pink with sky blue.", colors: ["#fff7fb", "#ec4899", "#06b6d4"] },
  { id: "mint", name: "Mint", description: "Fresh green with coral.", colors: ["#f2fff9", "#10b981", "#f43f5e"] },
  { id: "ruby", name: "Ruby", description: "Deep red with aqua shine.", colors: ["#12090d", "#e11d48", "#22d3ee"] },
];

export const APP_BACKGROUND_OPTIONS: AppBackgroundOption[] = [
  {
    id: "default",
    name: "Default",
    description: "Use the theme background.",
    colors: ["#07070f", "#f5f7ff", "#a855f7"],
  },
  {
    id: "mountains",
    name: "Mountains",
    description: "Soft peaks behind the app.",
    colors: ["#0f172a", "#38bdf8", "#a7f3d0"],
  },
  {
    id: "city",
    name: "City",
    description: "A little skyline glow.",
    colors: ["#111827", "#f472b6", "#22d3ee"],
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Calm waves and light.",
    colors: ["#052e2b", "#14b8a6", "#67e8f9"],
  },
  {
    id: "stars",
    name: "Dream Stars",
    description: "Cute stars and floating clouds.",
    colors: ["#1e1b4b", "#fde68a", "#c4b5fd"],
  },
];

export const THEME_PALETTES: Record<ThemeMode, AppPalette> = {
  dark: {
    id: "dark",
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
    id: "light",
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
  aurora: {
    id: "aurora",
    mode: "dark",
    bg: "#06110f",
    surface: "#0d1c18",
    card: "#10231f",
    cardBright: "#16352e",
    border: "#21463d",
    borderBright: "#2d5f51",
    accent: "#34d399",
    accentDim: "#34d39924",
    accentBright: "#a7f3d0",
    accentDeep: "#0f766e",
    green: "#4ade80",
    greenDim: "#4ade8018",
    red: "#fb7185",
    redDim: "#fb718518",
    amber: "#facc15",
    amberDim: "#facc1518",
    blue: "#22d3ee",
    blueDim: "#22d3ee18",
    textPrimary: "#eefcf7",
    textSecondary: "#9bc9bd",
    textMuted: "#6fa195",
    orbPrimary: "#34d39945",
    orbSecondary: "#fb718545",
    tabSurface: "#10231f",
    tabSurfaceSoft: "#17352e",
    tabBorder: "#2d5f51",
    tabText: "#eefcf7",
    tabTextMuted: "#9bc9bd",
    tabAccentSoft: "#a7f3d0",
  },
  candy: {
    id: "candy",
    mode: "light",
    bg: "#fff7fb",
    surface: "#ffffff",
    card: "#ffffff",
    cardBright: "#ffe8f1",
    border: "#f5c6d9",
    borderBright: "#f2a9c8",
    accent: "#ec4899",
    accentDim: "#ec489918",
    accentBright: "#db2777",
    accentDeep: "#be185d",
    green: "#10b981",
    greenDim: "#10b98112",
    red: "#e11d48",
    redDim: "#e11d4812",
    amber: "#ca8a04",
    amberDim: "#ca8a0412",
    blue: "#06b6d4",
    blueDim: "#06b6d412",
    textPrimary: "#24131c",
    textSecondary: "#7b5265",
    textMuted: "#ad8095",
    orbPrimary: "#ec489935",
    orbSecondary: "#06b6d430",
    tabSurface: "#ffffff",
    tabSurfaceSoft: "#ffe8f1",
    tabBorder: "#f5c6d9",
    tabText: "#24131c",
    tabTextMuted: "#8f6678",
    tabAccentSoft: "#db2777",
  },
  mint: {
    id: "mint",
    mode: "light",
    bg: "#f2fff9",
    surface: "#ffffff",
    card: "#ffffff",
    cardBright: "#dcfce7",
    border: "#b7efd0",
    borderBright: "#8ee7b8",
    accent: "#10b981",
    accentDim: "#10b98116",
    accentBright: "#047857",
    accentDeep: "#047857",
    green: "#16a34a",
    greenDim: "#16a34a12",
    red: "#f43f5e",
    redDim: "#f43f5e12",
    amber: "#d97706",
    amberDim: "#d9770612",
    blue: "#0891b2",
    blueDim: "#0891b212",
    textPrimary: "#10231b",
    textSecondary: "#4e7565",
    textMuted: "#83a99a",
    orbPrimary: "#10b98130",
    orbSecondary: "#f43f5e22",
    tabSurface: "#ffffff",
    tabSurfaceSoft: "#dcfce7",
    tabBorder: "#b7efd0",
    tabText: "#10231b",
    tabTextMuted: "#5f8777",
    tabAccentSoft: "#047857",
  },
  ruby: {
    id: "ruby",
    mode: "dark",
    bg: "#12090d",
    surface: "#1e1117",
    card: "#281720",
    cardBright: "#351d2a",
    border: "#4a2638",
    borderBright: "#673149",
    accent: "#e11d48",
    accentDim: "#e11d4826",
    accentBright: "#fda4af",
    accentDeep: "#be123c",
    green: "#22c55e",
    greenDim: "#22c55e18",
    red: "#fb7185",
    redDim: "#fb718518",
    amber: "#facc15",
    amberDim: "#facc1518",
    blue: "#22d3ee",
    blueDim: "#22d3ee18",
    textPrimary: "#fff1f5",
    textSecondary: "#c49aa9",
    textMuted: "#946a7a",
    orbPrimary: "#e11d4840",
    orbSecondary: "#22d3ee30",
    tabSurface: "#281720",
    tabSurfaceSoft: "#351d2a",
    tabBorder: "#4a2638",
    tabText: "#fff1f5",
    tabTextMuted: "#c49aa9",
    tabAccentSoft: "#fda4af",
  },
};

type AppThemeContextValue = {
  mode: ThemeMode;
  backgroundMode: BackgroundMode;
  palette: AppPalette;
  setMode: (mode: ThemeMode) => void;
  setBackgroundMode: (mode: BackgroundMode) => void;
  isDark: boolean;
  navigationTheme: Theme;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

const isThemeMode = (value?: string | null): value is ThemeMode => !!value && value in THEME_PALETTES;
const isBackgroundMode = (value?: string | null): value is BackgroundMode =>
  !!value && APP_BACKGROUND_OPTIONS.some((option) => option.id === value);

function buildNavigationTheme(palette: AppPalette): Theme {
  const base = palette.mode === "dark" ? DarkTheme : DefaultTheme;

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
  const [backgroundMode, setBackgroundModeState] = useState<BackgroundMode>("default");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadUserAppearance = async (userId?: string | null) => {
      if (!active) return;

      if (!userId) {
        setCurrentUserId(null);
        setModeState("dark");
        setBackgroundModeState("default");
        return;
      }

      setCurrentUserId(userId);

      const storedValues = await AsyncStorage.multiGet([
        userThemeKey(userId),
        userBackgroundKey(userId),
      ]).catch(() => []);

      if (!active) return;

      const storedTheme = storedValues.find(([key]) => key === userThemeKey(userId))?.[1];
      const storedBackground = storedValues.find(([key]) => key === userBackgroundKey(userId))?.[1];

      const nextTheme = isThemeMode(storedTheme) ? storedTheme : "dark";
      const nextBackground = isBackgroundMode(storedBackground) ? storedBackground : "default";

      setModeState(nextTheme);
      setBackgroundModeState(nextBackground);

      await AsyncStorage.multiSet([
        [userThemeKey(userId), nextTheme],
        [userBackgroundKey(userId), nextBackground],
      ]).catch(() => {});
    };

    supabase.auth.getSession().then(({ data }) => {
      loadUserAppearance(data.session?.user?.id);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUserAppearance(session?.user?.id);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    if (currentUserId) {
      AsyncStorage.setItem(userThemeKey(currentUserId), nextMode).catch(() => {});
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, nextMode).catch(() => {});
  }, [currentUserId]);

  const setBackgroundMode = useCallback((nextMode: BackgroundMode) => {
    setBackgroundModeState(nextMode);
    if (currentUserId) {
      AsyncStorage.setItem(userBackgroundKey(currentUserId), nextMode).catch(() => {});
      return;
    }
    AsyncStorage.setItem(BACKGROUND_STORAGE_KEY, nextMode).catch(() => {});
  }, [currentUserId]);

  const value = useMemo(() => {
    const palette = THEME_PALETTES[mode];

    return {
      mode,
      backgroundMode,
      palette,
      setMode,
      setBackgroundMode,
      isDark: palette.mode === "dark",
      navigationTheme: buildNavigationTheme(palette),
    };
  }, [backgroundMode, mode, setBackgroundMode, setMode]);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within an AppThemeProvider");
  }
  return context;
}
