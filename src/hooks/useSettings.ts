"use client";

import { useState, useEffect, useCallback } from "react";

export interface MonitorSettings {
  registryUrl: string;
  refreshRateMs: number;
  registryScanIntervalMs: number;
}

const STORAGE_KEY = "maikers-monitor-settings";

const DEFAULT_SETTINGS: MonitorSettings = {
  registryUrl:
    process.env.NEXT_PUBLIC_REGISTRY_URL || "https://registry.maikers.com",
  refreshRateMs: 5000,
  registryScanIntervalMs: 60000,
};

export function useSettings() {
  const [settings, setSettings] = useState<MonitorSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch {
        // ignore invalid JSON
      }
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = useCallback((updates: Partial<MonitorSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return { settings, updateSettings, resetSettings, isLoaded };
}
