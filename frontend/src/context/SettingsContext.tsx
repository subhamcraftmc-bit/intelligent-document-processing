import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AnimationLevel = 'full' | 'reduced' | 'off';
export type GlassLevel = 'on' | 'reduced' | 'off';

export interface NotificationSettings {
  uploadCompleted: boolean;
  processingCompleted: boolean;
  reviewRequired: boolean;
  exportReady: boolean;
}

export interface UserSettings {
  theme: ThemeMode;
  animationLevel: AnimationLevel;
  glassEffects: GlassLevel;
  cursorEffects: boolean;
  highContrast: boolean;
  notifications: NotificationSettings;
  tourCompleted: boolean;
}

interface SettingsContextValue {
  settings: UserSettings;
  setTheme: (theme: ThemeMode) => void;
  setAnimationLevel: (level: AnimationLevel) => void;
  setGlassEffects: (level: GlassLevel) => void;
  setCursorEffects: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setNotificationSetting: (key: keyof NotificationSettings, value: boolean) => void;
  setTourCompleted: (completed: boolean) => void;
  resetDefaults: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  animationLevel: 'full',
  glassEffects: 'on',
  cursorEffects: true,
  highContrast: false,
  notifications: {
    uploadCompleted: true,
    processingCompleted: true,
    reviewRequired: true,
    exportReady: true,
  },
  tourCompleted: false,
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const stored = localStorage.getItem('cineforge_settings');
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Apply attributes to <html> element whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem('cineforge_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }

    const root = document.documentElement;

    // 1. Theme
    if (settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', settings.theme);
    }

    // 2. Glass effects
    root.setAttribute('data-glass', settings.glassEffects);

    // 3. Cursor effects
    root.setAttribute('data-cursor-effects', settings.cursorEffects ? 'enabled' : 'disabled');

    // 4. Animation level & reduced motion
    root.setAttribute('data-animation', settings.animationLevel);

    // 5. High contrast
    if (settings.highContrast) {
      root.setAttribute('data-contrast', 'high');
    } else {
      root.removeAttribute('data-contrast');
    }
  }, [settings]);

  const setTheme = (theme: ThemeMode) => setSettings(s => ({ ...s, theme }));
  const setAnimationLevel = (animationLevel: AnimationLevel) => setSettings(s => ({ ...s, animationLevel }));
  const setGlassEffects = (glassEffects: GlassLevel) => setSettings(s => ({ ...s, glassEffects }));
  const setCursorEffects = (cursorEffects: boolean) => setSettings(s => ({ ...s, cursorEffects }));
  const setHighContrast = (highContrast: boolean) => setSettings(s => ({ ...s, highContrast }));
  const setTourCompleted = (tourCompleted: boolean) => setSettings(s => ({ ...s, tourCompleted }));

  const setNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(s => ({
      ...s,
      notifications: {
        ...s.notifications,
        [key]: value
      }
    }));
  };

  const resetDefaults = () => setSettings(DEFAULT_SETTINGS);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setTheme,
        setAnimationLevel,
        setGlassEffects,
        setCursorEffects,
        setHighContrast,
        setNotificationSetting,
        setTourCompleted,
        resetDefaults
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
};
