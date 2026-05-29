import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSettings } from '../types/chat';

interface SettingsState {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setApiKey: (key: string) => void;
  addCustomModel: (modelId: string) => void;
  removeCustomModel: (modelId: string) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  apiKey: '',
  defaultModel: 'google/gemini-flash-1.5',
  customModels: [],
  theme: 'dark', // default to dark for elegant studio design
  fontSize: 'base',
  autoTitle: true,
  temperature: 0.7,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (newSettings) =>
        set((state) => {
          const updated = { ...state.settings, ...newSettings };
          // Apply theme dynamically to documentElement
          if (typeof window !== 'undefined') {
            if (updated.theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else if (updated.theme === 'light') {
              document.documentElement.classList.remove('dark');
            } else {
              // System theme
              const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (systemDark) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            }
          }
          return { settings: updated };
        }),
      setApiKey: (key) =>
        set((state) => ({
          settings: { ...state.settings, apiKey: key.trim() },
        })),
      addCustomModel: (modelId) =>
        set((state) => {
          if (state.settings.customModels.includes(modelId)) return state;
          return {
            settings: {
              ...state.settings,
              customModels: [...state.settings.customModels, modelId.trim()],
            },
          };
        }),
      removeCustomModel: (modelId) =>
        set((state) => ({
          settings: {
            ...state.settings,
            customModels: state.settings.customModels.filter((m) => m !== modelId),
          },
        })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'smartprep-settings',
      version: 1,
    }
  )
);

// Helper to initialize theme on first load
export const initTheme = () => {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('smartprep-settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      const theme = parsed?.state?.settings?.theme || 'dark';
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } else {
      document.documentElement.classList.add('dark'); // default
    }
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
};
