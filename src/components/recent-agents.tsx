"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bot,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";

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
type DurationOption = "fast" | "medium" | "slow";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    onChange(next);
  };

  const displayText =
    selected.size === 0
      ? `All ${label}`
      : selected.size === 1
        ? Array.from(selected)[0]
        : `${selected.size} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-7 px-2 pr-6 text-[10px] bg-zinc-900 border border-zinc-800 rounded text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer flex items-center gap-1 min-w-[100px]"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className="w-3 h-3 absolute right-2 text-zinc-500" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[140px] bg-zinc-900 border border-zinc-800 rounded shadow-lg py-1 max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className="w-full px-2 py-1.5 text-[10px] text-left hover:bg-zinc-800 flex items-center gap-2 text-zinc-300"
            >
              <span
                className={`w-3 h-3 rounded border flex items-center justify-center ${selected.has(opt) ? "bg-cyan-500 border-cyan-500" : "border-zinc-600"}`}
              >
                {selected.has(opt) && <Check className="w-2 h-2 text-white" />}
              </span>
              {opt}
            </button>
          ))}
          {selected.size > 0 && (
            <button
              onClick={() => onChange(new Set())}
              className="w-full px-2 py-1.5 text-[10px] text-left hover:bg-zinc-800 text-zinc-500 border-t border-zinc-800 mt-1"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function RecentAgents() {
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [agentSearch, setAgentSearch] = useState("");
  const [collectionFilter, setCollectionFilter] = useState<Set<string>>(
    new Set(),
  );
  const [durationFilter, setDurationFilter] = useState<Set<DurationOption>>(
    new Set(),
  );
  const [nodeFilter, setNodeFilter] = useState<Set<string>>(new Set());

  const collections = useMemo(() => {
    const unique = [...new Set(MOCK_AGENTS.map((a) => a.collection))];
    return unique.sort();
  }, []);

  const nodes = useMemo(() => {
    const unique = [...new Set(MOCK_AGENTS.map((a) => a.nodeId))];
    return unique.sort();
  }, []);

  const durationOptions: { value: DurationOption; label: string }[] = [
    { value: "fast", label: "<1s" },
    { value: "medium", label: "1-3s" },
    { value: "slow", label: ">3s" },
  ];

  const filteredAndSortedAgents = useMemo(() => {
    return [...MOCK_AGENTS]
      .filter((agent) => {
        if (agentSearch) {
          const search = agentSearch.toLowerCase();
          const matchesPubkey = agent.pubkey.toLowerCase().includes(search);
          const matchesName = agent.name?.toLowerCase().includes(search);
          if (!matchesPubkey && !matchesName) return false;
        }
        if (
          collectionFilter.size > 0 &&
          !collectionFilter.has(agent.collection)
        )
          return false;
        if (durationFilter.size > 0) {
          const isFast = agent.durationMs < 1000;
          const isMedium = agent.durationMs >= 1000 && agent.durationMs < 3000;
          const isSlow = agent.durationMs >= 3000;
          const matches =
            (durationFilter.has("fast") && isFast) ||
            (durationFilter.has("medium") && isMedium) ||
            (durationFilter.has("slow") && isSlow);
          if (!matches) return false;
        }
        if (nodeFilter.size > 0 && !nodeFilter.has(agent.nodeId)) return false;
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
  }, [
    sortField,
    sortDirection,
    agentSearch,
    collectionFilter,
    durationFilter,
    nodeFilter,
  ]);

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

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (seconds: number) => `${seconds}s ago`;

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-heading font-semibold text-zinc-400 flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Recent Agents
            <span className="text-zinc-600 font-normal">
              ({filteredAndSortedAgents.length})
            </span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
            <input
              type="text"
              placeholder="Agent address..."
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
              className="h-7 pl-7 pr-3 text-[10px] bg-zinc-900 border border-zinc-800 rounded text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 w-36"
            />
          </div>

          <MultiSelect
            label="Collections"
            options={collections}
            selected={collectionFilter}
            onChange={setCollectionFilter}
          />

          <MultiSelect
            label="Durations"
            options={durationOptions.map((d) => d.label)}
            selected={
              new Set(
                Array.from(durationFilter).map(
                  (v) => durationOptions.find((d) => d.value === v)?.label || v,
                ),
              )
            }
            onChange={(labels) => {
              const values = new Set<DurationOption>();
              labels.forEach((label) => {
                const opt = durationOptions.find((d) => d.label === label);
                if (opt) values.add(opt.value);
              });
              setDurationFilter(values);
            }}
          />

          <MultiSelect
            label="Nodes"
            options={nodes}
            selected={nodeFilter}
            onChange={setNodeFilter}
          />
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
