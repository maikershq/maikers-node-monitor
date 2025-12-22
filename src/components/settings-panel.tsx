"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";
import type { NodeConnection } from "@/lib/node-client";
import type { MonitorSettings } from "@/hooks/useSettings";
import {
  Server,
  Plus,
  X,
  Circle,
  RefreshCw,
  Globe,
  RotateCcw,
  Trash2,
  Radio,
  EyeOff,
} from "lucide-react";

interface SettingsPanelProps {
  settings: MonitorSettings;
  connections: NodeConnection[];
  onSettingsChange: (updates: Partial<MonitorSettings>) => void;
  onResetSettings: () => void;
  onAddEndpoint: (endpoint: string) => void;
  onRemoveEndpoint: (endpoint: string) => void;
  onRemoveOfflineNodes: () => number;
  onScanRegistry: () => Promise<void>;
  className?: string;
}

const REFRESH_RATES = [
  { label: "1s", value: 1000 },
  { label: "2s", value: 2000 },
  { label: "5s", value: 5000 },
  { label: "10s", value: 10000 },
  { label: "30s", value: 30000 },
];

const REGISTRY_SCAN_RATES = [
  { label: "30s", value: 30000 },
  { label: "1m", value: 60000 },
  { label: "2m", value: 120000 },
  { label: "5m", value: 300000 },
];

export function SettingsPanel({
  settings,
  connections,
  onSettingsChange,
  onResetSettings,
  onAddEndpoint,
  onRemoveEndpoint,
  onRemoveOfflineNodes,
  onScanRegistry,
  className,
}: SettingsPanelProps) {
  const [newEndpoint, setNewEndpoint] = useState("");
  const [isAddingEndpoint, setIsAddingEndpoint] = useState(false);
  const [registryInput, setRegistryInput] = useState(settings.registryUrl);
  const [isScanning, setIsScanning] = useState(false);

  const offlineCount = connections.filter((c) => !c.connected).length;

  const handleScanRegistry = async () => {
    setIsScanning(true);
    await onScanRegistry();
    setIsScanning(false);
  };

  const handleAddEndpoint = () => {
    const trimmed = newEndpoint.trim();
    if (trimmed) {
      onAddEndpoint(trimmed);
      setNewEndpoint("");
      setIsAddingEndpoint(false);
    }
  };

  const handleRegistrySubmit = () => {
    const trimmed = registryInput.trim();
    if (trimmed && trimmed !== settings.registryUrl) {
      onSettingsChange({ registryUrl: trimmed });
    }
  };

  return (
    <div className={twMerge("space-y-6", className)}>
      {/* Registry URL */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-3.5 h-3.5 text-[var(--sys-accent)]" />
          <span className="text-xs text-zinc-400 font-medium uppercase tracking-wide">
            Registry
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={registryInput}
            onChange={(e) => setRegistryInput(e.target.value)}
            onBlur={handleRegistrySubmit}
            onKeyDown={(e) => e.key === "Enter" && handleRegistrySubmit()}
            placeholder="https://registry.maikers.com"
            className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[var(--sys-accent)]/50 font-mono"
          />
          <button
            onClick={handleScanRegistry}
            disabled={isScanning}
            className="px-3 py-2 bg-[var(--sys-accent)]/20 text-[var(--sys-accent)] rounded-lg text-xs hover:bg-[var(--sys-accent)]/30 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <RefreshCw
              className={twMerge("w-3 h-3", isScanning && "animate-spin")}
            />
            Scan
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-1.5">
          Nodes discovered from registry will be added automatically
        </p>
      </section>

      {/* Refresh Rate */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-3.5 h-3.5 text-[var(--sys-success)]" />
          <span className="text-xs text-zinc-400 font-medium uppercase tracking-wide">
            Refresh Rate
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {REFRESH_RATES.map((rate) => (
            <button
              key={rate.value}
              onClick={() => onSettingsChange({ refreshRateMs: rate.value })}
              className={twMerge(
                "px-3 py-1.5 text-xs rounded-lg font-mono transition-all",
                settings.refreshRateMs === rate.value
                  ? "bg-[var(--sys-accent)] text-white"
                  : "bg-zinc-900/80 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300",
              )}
            >
              {rate.label}
            </button>
          ))}
        </div>
      </section>

      {/* Registry Scan Interval */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-3.5 h-3.5 text-[var(--sys-tee)]" />
          <span className="text-xs text-zinc-400 font-medium uppercase tracking-wide">
            Registry Scan
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {REGISTRY_SCAN_RATES.map((rate) => (
            <button
              key={rate.value}
              onClick={() =>
                onSettingsChange({ registryScanIntervalMs: rate.value })
              }
              className={twMerge(
                "px-3 py-1.5 text-xs rounded-lg font-mono transition-all",
                settings.registryScanIntervalMs === rate.value
                  ? "bg-[var(--sys-tee)] text-white"
                  : "bg-zinc-900/80 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300",
              )}
            >
              {rate.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 mt-1.5">
          How often to check registry for new nodes
        </p>
      </section>

      {/* Display Options */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-400 font-medium uppercase tracking-wide">
            Display
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              onSettingsChange({ hideOfflineNodes: !settings.hideOfflineNodes })
            }
            className={twMerge(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs",
              settings.hideOfflineNodes
                ? "bg-zinc-800 border-zinc-700 text-zinc-200"
                : "bg-zinc-900/50 border-zinc-800/50 text-zinc-500 hover:bg-zinc-800/50",
            )}
          >
            <div
              className={twMerge(
                "w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-colors",
                settings.hideOfflineNodes
                  ? "bg-[var(--sys-accent)] border-[var(--sys-accent)]"
                  : "border-zinc-700",
              )}
            >
              {settings.hideOfflineNodes && (
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </div>
            Hide offline nodes
          </button>
        </div>
      </section>

      {/* Node Endpoints */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-[var(--sys-warn)]" />
            <span className="text-xs text-zinc-400 font-medium uppercase tracking-wide">
              Node Endpoints
            </span>
            <span className="text-[10px] text-zinc-600">
              ({connections.length})
            </span>
          </div>
          <div className="flex items-center gap-3">
            {offlineCount > 0 && (
              <button
                onClick={onRemoveOfflineNodes}
                className="text-xs text-[var(--sys-danger)]/80 hover:text-[var(--sys-danger)] flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Remove offline ({offlineCount})
              </button>
            )}
            <button
              onClick={() => setIsAddingEndpoint(!isAddingEndpoint)}
              className="text-xs text-[var(--sys-accent)] hover:text-[var(--sys-accent)]/80 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        </div>

        {isAddingEndpoint && (
          <div className="flex gap-2 mb-3 animate-in">
            <input
              type="text"
              value={newEndpoint}
              onChange={(e) => setNewEndpoint(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddEndpoint()}
              placeholder="http://localhost:8080"
              autoFocus
              className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[var(--sys-accent)]/50 font-mono"
            />
            <button
              onClick={handleAddEndpoint}
              className="px-3 py-2 bg-[var(--sys-accent)]/20 text-[var(--sys-accent)] rounded-lg text-xs hover:bg-[var(--sys-accent)]/30 transition-colors"
            >
              Add
            </button>
          </div>
        )}

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {connections.length === 0 ? (
            <p className="text-xs text-zinc-600 italic py-4 text-center">
              No endpoints configured
            </p>
          ) : (
            connections.map((conn) => (
              <div
                key={conn.endpoint}
                className="flex items-center justify-between bg-zinc-900/50 rounded-lg px-3 py-2 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Circle
                    className={twMerge(
                      "w-2 h-2 flex-shrink-0",
                      conn.connected
                        ? "text-[var(--sys-success)] fill-[var(--sys-success)]"
                        : "text-zinc-600",
                    )}
                  />
                  <span className="text-xs text-zinc-400 font-mono truncate">
                    {conn.endpoint}
                  </span>
                  {conn.nodeId && conn.nodeId !== conn.endpoint && (
                    <span className="text-[10px] text-zinc-600 truncate hidden md:block">
                      {conn.nodeId}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onRemoveEndpoint(conn.endpoint)}
                  className="text-zinc-600 hover:text-[var(--sys-danger)] p-1 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Reset */}
      <div className="pt-2 border-t border-zinc-800/50">
        <button
          onClick={onResetSettings}
          className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
