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
  id: string;
  name: string;
  type: "search" | "transaction" | "monitor" | "creation";
  status: "active" | "idle" | "failed";
  nodeId: string;
  timestamp: number;
}

const MOCK_AGENTS: Agent[] = [
  {
    id: "ag_8x92...3f21",
    name: "Nexus Crawler",
    type: "search",
    status: "active",
    nodeId: "node-001",
    timestamp: 2,
  },
  {
    id: "ag_7a11...9k00",
    name: "Asset Minter",
    type: "creation",
    status: "active",
    nodeId: "node-003",
    timestamp: 5,
  },
  {
    id: "ag_3b44...1p55",
    name: "Liq. Watcher",
    type: "monitor",
    status: "idle",
    nodeId: "node-002",
    timestamp: 12,
  },
  {
    id: "ag_9c22...4m88",
    name: "Swap Exec",
    type: "transaction",
    status: "active",
    nodeId: "node-001",
    timestamp: 15,
  },
  {
    id: "ag_1d33...2n99",
    name: "Data Syncer",
    type: "monitor",
    status: "active",
    nodeId: "node-004",
    timestamp: 24,
  },
];

type SortField = "name" | "type" | "status" | "nodeId" | "timestamp";
type SortDirection = "asc" | "desc";

export function RecentAgents() {
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedAgents = useMemo(() => {
    return [...MOCK_AGENTS].sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      switch (sortField) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "type":
          valA = a.type;
          valB = b.type;
          break;
        case "status":
          const statusOrder = { active: 0, idle: 1, failed: 2 };
          valA = statusOrder[a.status];
          valB = statusOrder[b.status];
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
  }, [sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
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

  const formatTimestamp = (seconds: number) => `${seconds}s ago`;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-sm font-heading font-semibold text-zinc-400 flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Recent Agents
          <span className="text-zinc-600 font-normal">
            ({sortedAgents.length})
          </span>
        </h2>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500 mr-1">Sort by:</span>
          <SortButton field="name" label="Name" />
          <SortButton field="type" label="Type" />
          <SortButton field="status" label="Status" />
          <SortButton field="nodeId" label="Node" />
          <SortButton field="timestamp" label="Time" />
        </div>
      </div>

      <div className="border border-zinc-800/50 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-zinc-800/50 bg-zinc-900/50">
              <TableHead className="h-10 text-[10px] uppercase tracking-wider font-mono text-zinc-500">
                Agent
              </TableHead>
              <TableHead className="h-10 text-[10px] uppercase tracking-wider font-mono text-zinc-500">
                Type
              </TableHead>
              <TableHead className="h-10 text-[10px] uppercase tracking-wider font-mono text-zinc-500">
                Status
              </TableHead>
              <TableHead className="h-10 text-[10px] uppercase tracking-wider font-mono text-zinc-500 text-right">
                Node
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAgents.map((agent) => (
              <TableRow
                key={agent.id}
                className="hover:bg-zinc-800/30 border-zinc-800/50 transition-colors"
              >
                <TableCell className="py-3 font-medium text-xs">
                  <div className="flex flex-col">
                    <span className="text-zinc-200">{agent.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {agent.id}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      agent.type === "search"
                        ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
                        : agent.type === "transaction"
                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                          : agent.type === "creation"
                            ? "border-purple-500/30 text-purple-400 bg-purple-500/10"
                            : "border-zinc-500/30 text-zinc-400 bg-zinc-500/10"
                    }`}
                  >
                    {agent.type}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        agent.status === "active"
                          ? "bg-emerald-500 animate-pulse"
                          : agent.status === "idle"
                            ? "bg-zinc-500"
                            : "bg-red-500"
                      }`}
                    />
                    <span className="text-[10px] text-zinc-400 capitalize">
                      {agent.status}
                    </span>
                  </div>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
