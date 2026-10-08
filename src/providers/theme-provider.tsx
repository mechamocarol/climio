import { useColorScheme } from 'nativewind';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

import { getThemeCssVars } from '@/shared/theme/css-vars';
import {
  colorsByTheme,
  type ThemeName,
} from '@/shared/theme/tokens';

type ThemeColors = (typeof colorsByTheme)[ThemeName];

type ThemeContextValue = {
  theme: ThemeName;
  colors: ThemeColors;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
  /** Defaults to light. Overridable in tests. */
  initialTheme?: ThemeName;
};

/** Close to Figma Make `.app-shell` color ease (~300ms). */
const THEME_CROSSFADE_MS = 320;

export function toggleThemeName(theme: ThemeName): ThemeName {
  return theme === 'light' ? 'dark' : 'light';
}

function isJestEnvironment(): boolean {
  return typeof process !== 'undefined' && process.env.JEST_WORKER_ID != null;
}

/**
 * Manual Light/Dark theme via NativeWind `vars()`.
 * Crossfades by veiling the previous canvas color while tokens swap underneath.
 */
export function ThemeProvider({
  children,
  initialTheme = 'light',
}: ThemeProviderProps) {
  const { setColorScheme } = useColorScheme();
  const [theme, setThemeState] = useState<ThemeName>(initialTheme);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [veilColor, setVeilColor] = useState<string | null>(null);
  const themeRef = useRef(theme);
  const isTransitioningRef = useRef(false);
  const [veilOpacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => undefined);

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    try {
      setColorScheme(theme);
    } catch {
      // Jest / non-Metro environments may not expose the darkMode flag.
    }
  }, [setColorScheme, theme]);

  const clearVeil = useCallback(() => {
    setVeilColor(null);
    veilOpacity.setValue(0);
    isTransitioningRef.current = false;
  }, [veilOpacity]);

  const runThemeTransition = useCallback(
    (next: ThemeName) => {
      if (next === themeRef.current || isTransitioningRef.current) {
        return;
      }

      if (reduceMotion || isJestEnvironment()) {
        setThemeState(next);
        clearVeil();
        return;
      }

      isTransitioningRef.current = true;
      const previousCanvas = colorsByTheme[themeRef.current].canvas;

      setVeilColor(previousCanvas);
      veilOpacity.setValue(1);
      setThemeState(next);

      Animated.timing(veilOpacity, {
        toValue: 0,
        duration: THEME_CROSSFADE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          clearVeil();
          return;
        }
        setVeilColor(null);
        isTransitioningRef.current = false;
      });
    },
    [clearVeil, reduceMotion, veilOpacity],
  );

  const setTheme = useCallback(
    (next: ThemeName) => {
      runThemeTransition(next);
    },
    [runThemeTransition],
  );

  const toggleTheme = useCallback(() => {
    runThemeTransition(toggleThemeName(themeRef.current));
  }, [runThemeTransition]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colors: colorsByTheme[theme],
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  );

  const themeStyle = useMemo(() => getThemeCssVars(theme), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeStyle]}>
        <View style={styles.content}>{children}</View>
        {veilColor ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.veil,
              {
                backgroundColor: veilColor,
                opacity: veilOpacity,
              },
            ]}
          />
        ) : null}
      </View>
    </ThemeContext.Provider>
  );
}

export function useClimioTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useClimioTheme must be used within ThemeProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  veil: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
  },
});
