export type NodeStatus = "healthy" | "degraded" | "offline";

export interface NodeMetrics {
  nodeId: string;
  peerId: string;
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
}

export interface CellMetrics {
  id: number;
  signal: number;
  queueDepth: number;
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
}

export interface TimeSeriesPoint {
  timestamp: number;
  throughput: number;
  latencyP50: number;
  latencyP99: number;
  activeWorkers: number;
}
