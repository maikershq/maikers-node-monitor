export type NodeStatus = "healthy" | "degraded" | "offline";
export type EventStatus =
  | "pending"
  | "claimed"
  | "processing"
  | "complete"
  | "failed";
export type CellRole = "primary" | "replica";

export interface NodeMetrics {
  nodeId: string;
  peerId: string;
  nodePubkey?: string;
  endpoint?: string;
  secure: boolean;
  teePlatform: "IntelTDX" | "AmdSEV" | null;
  teeAttested: boolean;
  uptime: number;
  cells: CellMetrics[];
  workers: WorkerMetrics;
  latency: LatencyMetrics;
  throughput: number;
  tasksProcessed: number;
  tasksFailed: number;
  fuelConsumed: number;
  peers: string[];
  lastUpdate: number;
  status: NodeStatus;
  packetLoss: number;
  // Sharded replication fields
  ownedCells: number[]; // Cell IDs this node owns
  claimedEvents: number; // Events currently claimed by this node
}

export interface CellMetrics {
  id: number;
  signal: number;
  queueDepth: number;
  // Sharded replication fields
  role?: CellRole;
  replicas?: string[]; // PeerIds of replica nodes
  version?: number; // Lamport clock
  pendingEvents?: number;
  claimedEvents?: number;
}

export interface WorkerMetrics {
  active: number;
  total: number;
  max: number;
}

export interface LatencyMetrics {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  samples: number;
}

export interface NetworkStats {
  totalNodes: number;
  activeNodes: number;
  totalThroughput: number;
  avgLatencyP99: number;
  totalCells: number;
  attestedNodes: number;
  secureNodes: number;
  // Cluster health
  replicationFactor: number;
  healthyCells: number; // Cells with full RF
  degradedCells: number; // Cells with < RF replicas
  loadedCells: number; // Cells with at least 1 replica
  minReplication: number; // Minimum RF across all cells (0-3+)
}

export interface TimeSeriesPoint {
  timestamp: number;
  throughput: number;
  latencyP50: number;
  latencyP99: number;
  activeWorkers: number;
}

// Global cell view (aggregated from all nodes)
export interface GlobalCell {
  id: number;
  replicas: Array<{
    nodeId: string;
    role: CellRole;
    signal: number;
    queueDepth: number;
    status: NodeStatus;
  }>;
  totalSignal: number;
  totalQueueDepth: number;
  replicationCount: number;
  healthy: boolean;
}

export const TOTAL_CELLS = 64;
export const DEFAULT_REPLICATION_FACTOR = 3;
