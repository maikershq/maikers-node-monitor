"use client";

import { useState, useEffect, useCallback } from "react";

export interface MonitorSettings {
  refreshRateMs: number;
  registryScanIntervalMs: number;
  hideOfflineNodes: boolean;
}

const STORAGE_KEY = "maikers-monitor-settings";

const DEFAULT_SETTINGS: MonitorSettings = {
  refreshRateMs: 5000,
  registryScanIntervalMs: 60000,
  hideOfflineNodes: false,
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
