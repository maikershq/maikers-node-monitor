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

const isDev = process.env.NODE_ENV === "development";

const MOCK_AGENTS: Agent[] = isDev
  ? [
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
    ]
  : [];

type SortField = "name" | "type" | "status" | "nodeId" | "timestamp";
type SortDirection = "asc" | "desc";
type TypeFilter = "all" | "search" | "transaction" | "monitor" | "creation";
type StatusFilter = "all" | "active" | "idle" | "failed";

export function RecentAgents() {
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredAndSortedAgents = useMemo(() => {
    return [...MOCK_AGENTS]
      .filter((agent) => {
        if (typeFilter !== "all" && agent.type !== typeFilter) return false;
        if (statusFilter !== "all" && agent.status !== statusFilter)
          return false;
        return true;
      })
      .sort((a, b) => {
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
  }, [sortField, sortDirection, typeFilter, statusFilter]);

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

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-600 mr-1">Type:</span>
            <FilterButton
              label="All"
              active={typeFilter === "all"}
              onClick={() => setTypeFilter("all")}
            />
            <FilterButton
              label="Search"
              active={typeFilter === "search"}
              onClick={() => setTypeFilter("search")}
            />
            <FilterButton
              label="Tx"
              active={typeFilter === "transaction"}
              onClick={() => setTypeFilter("transaction")}
            />
            <FilterButton
              label="Monitor"
              active={typeFilter === "monitor"}
              onClick={() => setTypeFilter("monitor")}
            />
            <FilterButton
              label="Create"
              active={typeFilter === "creation"}
              onClick={() => setTypeFilter("creation")}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-600 mr-1">Status:</span>
            <FilterButton
              label="All"
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            />
            <FilterButton
              label="Active"
              active={statusFilter === "active"}
              onClick={() => setStatusFilter("active")}
            />
            <FilterButton
              label="Idle"
              active={statusFilter === "idle"}
              onClick={() => setStatusFilter("idle")}
            />
            <FilterButton
              label="Failed"
              active={statusFilter === "failed"}
              onClick={() => setStatusFilter("failed")}
            />
          </div>
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
                onClick={() => toggleSort("type")}
                className="h-10 text-[10px] uppercase tracking-wider font-mono text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  Type
                  <SortIcon field="type" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => toggleSort("status")}
                className="h-10 text-[10px] uppercase tracking-wider font-mono text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  Status
                  <SortIcon field="status" />
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
