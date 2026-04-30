import { RouterProvider } from "react-router";
import { useEffect } from "react";
import { router } from "./routes";
import InstallPrompt from "./components/InstallPrompt";
import ChatbotWidget from "./components/ChatbotWidget";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/sonner";
import { useAccessibilityStore } from "../lib/accessibility";
import { gamificationAPI } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { useSettingsStore } from "../lib/settingsStore";
import { useThemeStore } from "../lib/themeStore";
import { FuturisticBackground } from "./components/FuturisticBackground";
import { VoiceAccessibility } from "./components/VoiceAccessibility";
import { AnimationProvider } from "../animations";

export default function App() {
  const { highContrast, largeText, reducedMotion } = useAccessibilityStore();
  const { user } = useAuthStore();
  const { fetchSettings } = useSettingsStore();
  const { theme, isSeniorMode } = useThemeStore();

  useEffect(() => {
    if (import.meta.env.VITE_BYPASS_AUTH !== "true" && user?.role === "admin") {
      fetchSettings();
    }
  }, [fetchSettings, user]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("high-contrast", highContrast);
    root.classList.toggle("large-text", largeText);
    root.classList.toggle("reduced-motion", reducedMotion);
    root.classList.toggle("senior-mode", isSeniorMode);
  }, [highContrast, largeText, reducedMotion, isSeniorMode]);

  useEffect(() => {
    if (user && import.meta.env.VITE_BYPASS_AUTH !== "true") {
      gamificationAPI.trackLogin().catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ErrorBoundary>
      <AnimationProvider>
        <FuturisticBackground />
        <RouterProvider router={router} />
        <InstallPrompt />
        <Toaster position="top-right" richColors />
        {user?.role !== "admin" && <VoiceAccessibility />}
        {user?.role === "patient" && <ChatbotWidget />}
      </AnimationProvider>
    </ErrorBoundary>
  );
}
