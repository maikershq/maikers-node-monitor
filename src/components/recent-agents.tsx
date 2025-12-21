"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bot, Zap, Circle, Activity } from "lucide-react";

// I'll need a Badge component. Let's check if I have it or just use Tailwind.
// Since I only installed Table and Card is there, I probably don't have Badge.
// I'll use Tailwind for badges to avoid installing too many things if not needed,
// or I can install badge.

interface Agent {
  id: string;
  name: string;
  type: "search" | "transaction" | "monitor" | "creation";
  status: "active" | "idle" | "failed";
  nodeId: string;
  timestamp: string;
}

const MOCK_AGENTS: Agent[] = [
  {
    id: "ag_8x92...3f21",
    name: "Nexus Crawler",
    type: "search",
    status: "active",
    nodeId: "node-001",
    timestamp: "2s ago",
  },
  {
    id: "ag_7a11...9k00",
    name: "Asset Minter",
    type: "creation",
    status: "active",
    nodeId: "node-003",
    timestamp: "5s ago",
  },
  {
    id: "ag_3b44...1p55",
    name: "Liq. Watcher",
    type: "monitor",
    status: "idle",
    nodeId: "node-002",
    timestamp: "12s ago",
  },
  {
    id: "ag_9c22...4m88",
    name: "Swap Exec",
    type: "transaction",
    status: "active",
    nodeId: "node-001",
    timestamp: "15s ago",
  },
  {
    id: "ag_1d33...2n99",
    name: "Data Syncer",
    type: "monitor",
    status: "active",
    nodeId: "node-004",
    timestamp: "24s ago",
  },
];

export function RecentAgents() {
  return (
    <Card className="monitor-card h-full">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Bot className="w-3.5 h-3.5 text-[var(--sys-accent)]" />
          Recent Agents
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-zinc-800/50">
              <TableHead className="h-8 text-[10px] uppercase tracking-wider font-mono text-zinc-500">
                Agent
              </TableHead>
              <TableHead className="h-8 text-[10px] uppercase tracking-wider font-mono text-zinc-500">
                Type
              </TableHead>
              <TableHead className="h-8 text-[10px] uppercase tracking-wider font-mono text-zinc-500">
                Status
              </TableHead>
              <TableHead className="h-8 text-[10px] uppercase tracking-wider font-mono text-zinc-500 text-right">
                Node
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_AGENTS.map((agent) => (
              <TableRow
                key={agent.id}
                className="hover:bg-zinc-800/30 border-zinc-800/50 transition-colors"
              >
                <TableCell className="py-2 font-medium text-xs">
                  <div className="flex flex-col">
                    <span className="text-zinc-200">{agent.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {agent.id}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2">
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
                <TableCell className="py-2">
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
                <TableCell className="py-2 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-zinc-300 font-mono">
                      {agent.nodeId}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {agent.timestamp}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
