"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bot, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Agent {
  pubkey: string;
  name?: string;
  image: string;
  collection: string;
  durationMs: number;
  nodeId: string;
  timestamp: number;
}

const isDev = process.env.NODE_ENV === "development";

const MOCK_AGENTS: Agent[] = isDev
  ? [
      {
        pubkey: "7xKX...9f3A",
        name: "Nexus Crawler",
        image: "https://arweave.net/placeholder1",
        collection: "Claynosaurz",
        durationMs: 1250,
        nodeId: "node-001",
        timestamp: 2,
      },
      {
        pubkey: "3mVp...2kL8",
        image: "https://arweave.net/placeholder2",
        collection: "Mad Lads",
        durationMs: 890,
        nodeId: "node-003",
        timestamp: 5,
      },
      {
        pubkey: "9qRt...5nW2",
        name: "Liq. Watcher",
        image: "https://arweave.net/placeholder3",
        collection: "Tensorians",
        durationMs: 3420,
        nodeId: "node-002",
        timestamp: 12,
      },
      {
        pubkey: "1pZa...8mK4",
        image: "https://arweave.net/placeholder4",
        collection: "Famous Fox",
        durationMs: 567,
        nodeId: "node-001",
        timestamp: 15,
      },
      {
        pubkey: "5wNb...7cH9",
        name: "Data Syncer",
        image: "https://arweave.net/placeholder5",
        collection: "Okay Bears",
        durationMs: 2100,
        nodeId: "node-004",
        timestamp: 24,
      },
    ]
  : [];

type SortField = "name" | "collection" | "duration" | "nodeId" | "timestamp";
type SortDirection = "asc" | "desc";

export function RecentAgents() {
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [collectionFilter, setCollectionFilter] = useState<string>("all");

  const collections = useMemo(() => {
    const unique = [...new Set(MOCK_AGENTS.map((a) => a.collection))];
    return unique.sort();
  }, []);

  const filteredAndSortedAgents = useMemo(() => {
    return [...MOCK_AGENTS]
      .filter((agent) => {
        if (collectionFilter !== "all" && agent.collection !== collectionFilter)
          return false;
        return true;
      })
      .sort((a, b) => {
        let valA: string | number;
        let valB: string | number;

        switch (sortField) {
          case "name":
            valA = (a.name || a.pubkey).toLowerCase();
            valB = (b.name || b.pubkey).toLowerCase();
            break;
          case "collection":
            valA = a.collection.toLowerCase();
            valB = b.collection.toLowerCase();
            break;
          case "duration":
            valA = a.durationMs;
            valB = b.durationMs;
            break;
          case "nodeId":
            valA = a.nodeId;
            valB = b.nodeId;
            break;
          case "timestamp":
            valA = a.timestamp;
            valB = b.timestamp;
            break;
          default:
            return 0;
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [sortField, sortDirection, collectionFilter]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3" />
    ) : (
      <ArrowDown className="w-3 h-3" />
    );
  };

  const FilterButton = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
        active
          ? "bg-cyan-500/20 text-cyan-400"
          : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (seconds: number) => `${seconds}s ago`;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-sm font-heading font-semibold text-zinc-400 flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Recent Agents
          <span className="text-zinc-600 font-normal">
            ({filteredAndSortedAgents.length})
          </span>
        </h2>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-zinc-600 mr-1">Collection:</span>
          <FilterButton
            label="All"
            active={collectionFilter === "all"}
            onClick={() => setCollectionFilter("all")}
          />
          {collections.map((c) => (
            <FilterButton
              key={c}
              label={c}
              active={collectionFilter === c}
              onClick={() => setCollectionFilter(c)}
            />
          ))}
        </div>
      </div>

      <div className="border border-zinc-800/50 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-zinc-800/50 bg-zinc-900/50">
              <TableHead
                onClick={() => toggleSort("name")}
                className="h-10 text-[10px] uppercase tracking-wider font-mono text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  Agent
                  <SortIcon field="name" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => toggleSort("collection")}
                className="h-10 text-[10px] uppercase tracking-wider font-mono text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  Collection
                  <SortIcon field="collection" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => toggleSort("duration")}
                className="h-10 text-[10px] uppercase tracking-wider font-mono text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  Duration
                  <SortIcon field="duration" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => toggleSort("nodeId")}
                className="h-10 text-[10px] uppercase tracking-wider font-mono text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none text-right"
              >
                <div className="flex items-center gap-1.5 justify-end">
                  Node
                  <SortIcon field="nodeId" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedAgents.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-zinc-600 text-xs"
                >
                  No agents found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedAgents.map((agent) => (
                <TableRow
                  key={agent.pubkey}
                  className="hover:bg-zinc-800/30 border-zinc-800/50 transition-colors"
                >
                  <TableCell className="py-3 font-medium text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-zinc-800 overflow-hidden flex-shrink-0">
                        <img
                          src={agent.image}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        {agent.name && (
                          <span className="text-zinc-200 truncate">
                            {agent.name}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {agent.pubkey}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-700/50 text-zinc-300 bg-zinc-800/50">
                      {agent.collection}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-[10px] text-zinc-400 font-mono tabular-nums">
                      {formatDuration(agent.durationMs)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-zinc-300 font-mono">
                        {agent.nodeId}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {formatTimestamp(agent.timestamp)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
