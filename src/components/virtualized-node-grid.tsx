"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { NodeCard } from "./node-card";
import type { NodeMetrics } from "@/lib/types";
import { ArrowUpDown, ArrowUp, ArrowDown, Server, EyeOff } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

interface VirtualizedNodeGridProps {
  nodes: NodeMetrics[];
  cardHeight?: number;
  gap?: number;
}

type SortField =
  | "nodeId"
  | "status"
  | "throughput"
  | "workers"
  | "latency"
  | "uptime";
type SortDirection = "asc" | "desc";

export function VirtualizedNodeGrid({
  nodes,
  cardHeight = 280,
  gap = 16,
}: VirtualizedNodeGridProps) {
  const { settings, updateSettings } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [columns, setColumns] = useState(3);
  const [sortField, setSortField] = useState<SortField>("nodeId");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const filteredNodes = useMemo(() => {
    if (!settings.hideOfflineNodes) return nodes;
    return nodes.filter((node) => node.status !== "offline");
  }, [nodes, settings.hideOfflineNodes]);

  const updateColumns = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.offsetWidth;
    if (width >= 1024) setColumns(3);
    else if (width >= 768) setColumns(2);
    else setColumns(1);
  }, []);

  useEffect(() => {
    updateColumns();
    const resizeObserver = new ResizeObserver(updateColumns);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [updateColumns]);

  const sortedNodes = useMemo(() => {
    return [...filteredNodes].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortField) {
        case "nodeId":
          valA = a.nodeId;
          valB = b.nodeId;
          break;
        case "status":
          // Custom order: healthy > degraded > offline
          const statusOrder = { healthy: 0, degraded: 1, offline: 2 };
          valA = statusOrder[a.status];
          valB = statusOrder[b.status];
          break;
        case "throughput":
          valA = a.throughput;
          valB = b.throughput;
          break;
        case "workers":
          valA = a.workers.active;
          valB = b.workers.active;
          break;
        case "latency":
          valA = a.latency.p99;
          valB = b.latency.p99;
          break;
        case "uptime":
          valA = a.uptime;
          valB = b.uptime;
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredNodes, sortField, sortDirection]);

  const rowHeight = cardHeight + gap;
  const totalRows = Math.ceil(sortedNodes.length / columns);
  const totalHeight = totalRows * rowHeight;

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const containerTop = containerRef.current.offsetTop;
      const relativeScroll = Math.max(0, scrollTop - containerTop);

      const startRow = Math.floor(relativeScroll / rowHeight);
      const visibleRows = Math.ceil(viewportHeight / rowHeight) + 2;
      const endRow = Math.min(totalRows, startRow + visibleRows);

      setVisibleRange({
        start: startRow * columns,
        end: Math.min(sortedNodes.length, endRow * columns),
      });
    });
  }, [rowHeight, totalRows, columns, sortedNodes.length]);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll]);

  const visibleNodes = useMemo(() => {
    return sortedNodes.slice(visibleRange.start, visibleRange.end);
  }, [sortedNodes, visibleRange.start, visibleRange.end]);

  const startRow = Math.floor(visibleRange.start / columns);
  const topOffset = startRow * rowHeight;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc"); // Default to desc for metrics usually
    }
  };

  const SortButton = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <button
      onClick={() => toggleSort(field)}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        sortField === field
          ? "bg-cyan-500/20 text-cyan-400"
          : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      }`}
    >
      {label}
      {sortField === field ? (
        sortDirection === "asc" ? (
          <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      )}
    </button>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-sm font-heading font-semibold text-zinc-400 flex items-center gap-2">
          <Server className="w-4 h-4" />
          Discovered Nodes
          <span className="text-zinc-600 font-normal">
            ({sortedNodes.length})
          </span>
        </h2>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() =>
              updateSettings({ hideOfflineNodes: !settings.hideOfflineNodes })
            }
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors mr-2 ${
              settings.hideOfflineNodes
                ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                : "bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 border border-transparent"
            }`}
          >
            <EyeOff
              className={`w-3.5 h-3.5 ${settings.hideOfflineNodes ? "text-cyan-400" : ""}`}
            />
            {settings.hideOfflineNodes ? "Online Only" : "Hide Offline"}
          </button>
          <div className="h-4 w-[1px] bg-zinc-800/50 mx-1 hidden md:block" />
          <span className="text-xs text-zinc-500 mr-1 ml-1">Sort by:</span>
          <SortButton field="nodeId" label="Name" />
          <SortButton field="status" label="Status" />
          <SortButton field="throughput" label="Throughput" />
          <SortButton field="workers" label="Workers" />
          <SortButton field="latency" label="Latency" />
          <SortButton field="uptime" label="Uptime" />
        </div>
      </div>

      <div
        ref={containerRef}
        style={{ height: totalHeight, position: "relative" }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 absolute w-full"
          style={{ top: topOffset }}
        >
          {visibleNodes.map((node) => (
            <NodeCard key={node.nodeId} node={node} />
          ))}
        </div>
      </div>
    </div>
  );
}
