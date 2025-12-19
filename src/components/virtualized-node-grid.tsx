"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { NodeCard } from "./node-card";
import type { NodeMetrics } from "@/lib/types";

interface VirtualizedNodeGridProps {
  nodes: NodeMetrics[];
  cardHeight?: number;
  gap?: number;
}

export function VirtualizedNodeGrid({
  nodes,
  cardHeight = 280,
  gap = 16,
}: VirtualizedNodeGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [columns, setColumns] = useState(3);

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

  const rowHeight = cardHeight + gap;
  const totalRows = Math.ceil(nodes.length / columns);
  const totalHeight = totalRows * rowHeight;

  const handleScroll = useCallback(() => {
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
      end: Math.min(nodes.length, endRow * columns),
    });
  }, [rowHeight, totalRows, columns, nodes.length]);

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
    return nodes.slice(visibleRange.start, visibleRange.end);
  }, [nodes, visibleRange.start, visibleRange.end]);

  const startRow = Math.floor(visibleRange.start / columns);
  const topOffset = startRow * rowHeight;

  return (
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
  );
}
