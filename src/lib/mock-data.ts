import type { NodeMetrics, TimeSeriesPoint, NodeStatus } from "./types";

const TEE_PLATFORMS = ["IntelTdx", "AmdSevSnp", "Simulated"] as const;

const PEER_ID_POOL: string[] = [];
const NODE_ID_POOL: string[] = [];

function getOrCreatePeerId(index: number): string {
  if (!PEER_ID_POOL[index]) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < 16; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    PEER_ID_POOL[index] = `12D3KooW${id}`;
  }
  return PEER_ID_POOL[index];
}

function getOrCreateNodeId(index: number): string {
  if (!NODE_ID_POOL[index]) {
    NODE_ID_POOL[index] = `node-${index.toString().padStart(3, "0")}`;
  }
  return NODE_ID_POOL[index];
}

const CELL_CACHE = new Map<number, { id: number }[]>();

function getCellTemplate(cellCount: number): { id: number }[] {
  if (!CELL_CACHE.has(cellCount)) {
    CELL_CACHE.set(
      cellCount,
      Array.from({ length: cellCount }, (_, i) => ({ id: i })),
    );
  }
  return CELL_CACHE.get(cellCount)!;
}

function generateCells(
  count: number,
): { id: number; signal: number; queueDepth: number }[] {
  const template = getCellTemplate(count);
  return template.map((c) => ({
    id: c.id,
    signal: Math.random() * 100,
    queueDepth: Math.floor(Math.random() * 20),
  }));
}

export function generateMockNode(index: number, cellCount = 16): NodeMetrics {
  const platform = TEE_PLATFORMS[index % 3];

  return {
    nodeId: getOrCreateNodeId(index),
    peerId: getOrCreatePeerId(index),
    teePlatform: platform,
    teeAttested: Math.random() > 0.1,
    uptime: Math.floor(Math.random() * 86400 * 7),
    cells: generateCells(cellCount),
    workers: {
      active: Math.floor(Math.random() * 100),
      total: 100 + Math.floor(Math.random() * 100),
      max: 10000,
    },
    latency: {
      p50: 10 + Math.random() * 20,
      p95: 30 + Math.random() * 50,
      p99: 50 + Math.random() * 100,
      avg: 15 + Math.random() * 25,
      samples: 500 + Math.floor(Math.random() * 500),
    },
    throughput: Math.floor(Math.random() * 500),
    tasksProcessed: Math.floor(Math.random() * 100000),
    tasksFailed: Math.floor(Math.random() * 100),
    fuelConsumed: Math.floor(Math.random() * 1000000),
    peers: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) =>
      getOrCreatePeerId((index + i + 1) % 1000),
    ),
    lastUpdate: Date.now(),
    status: "healthy",
    packetLoss: 0,
  };
}

export function generateMockNodes(
  count: number,
  cellCount = 16,
): NodeMetrics[] {
  return Array.from({ length: count }, (_, i) =>
    generateMockNode(i, cellCount),
  );
}

export function generateTimeSeries(points: number): TimeSeriesPoint[] {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    timestamp: now - (points - i) * 1000,
    throughput: 200 + Math.random() * 300 + Math.sin(i / 10) * 100,
    latencyP50: 12 + Math.random() * 8,
    latencyP99: 60 + Math.random() * 40 + Math.sin(i / 5) * 20,
    activeWorkers: 50 + Math.floor(Math.random() * 100),
  }));
}

interface NetworkIssueConfig {
  enabled: boolean;
  offlineChance: number;
  degradedChance: number;
  latencySpikeChance: number;
  packetLossChance: number;
}

const DEFAULT_NETWORK_ISSUES: NetworkIssueConfig = {
  enabled: true,
  offlineChance: 0.02,
  degradedChance: 0.05,
  latencySpikeChance: 0.08,
  packetLossChance: 0.03,
};

function simulateNetworkStatus(
  currentStatus: NodeStatus,
  config: NetworkIssueConfig,
): { status: NodeStatus; packetLoss: number } {
  if (!config.enabled) return { status: "healthy", packetLoss: 0 };

  const roll = Math.random();

  if (currentStatus === "offline") {
    if (roll < 0.3) return { status: "healthy", packetLoss: 0 };
    if (roll < 0.5)
      return { status: "degraded", packetLoss: Math.random() * 0.3 };
    return { status: "offline", packetLoss: 1 };
  }

  if (currentStatus === "degraded") {
    if (roll < 0.4) return { status: "healthy", packetLoss: 0 };
    if (roll < 0.1) return { status: "offline", packetLoss: 1 };
    return { status: "degraded", packetLoss: Math.random() * 0.5 };
  }

  if (roll < config.offlineChance) {
    return { status: "offline", packetLoss: 1 };
  }
  if (roll < config.offlineChance + config.degradedChance) {
    return { status: "degraded", packetLoss: 0.1 + Math.random() * 0.4 };
  }
  if (
    roll <
    config.offlineChance + config.degradedChance + config.packetLossChance
  ) {
    return { status: "healthy", packetLoss: Math.random() * 0.1 };
  }

  return { status: "healthy", packetLoss: 0 };
}

function applyLatencySpike(
  latency: NodeMetrics["latency"],
  config: NetworkIssueConfig,
): NodeMetrics["latency"] {
  if (!config.enabled) return latency;

  if (Math.random() < config.latencySpikeChance) {
    const spikeFactor = 2 + Math.random() * 8;
    return {
      ...latency,
      p50: latency.p50 * spikeFactor,
      p95: latency.p95 * spikeFactor,
      p99: latency.p99 * spikeFactor,
      avg: latency.avg * spikeFactor,
    };
  }

  return latency;
}

export function updateNodeMetrics(
  node: NodeMetrics,
  networkConfig: NetworkIssueConfig = DEFAULT_NETWORK_ISSUES,
): NodeMetrics {
  const { status, packetLoss } = simulateNetworkStatus(
    node.status,
    networkConfig,
  );

  if (status === "offline") {
    return {
      ...node,
      status: "offline",
      packetLoss: 1,
      throughput: 0,
      workers: { ...node.workers, active: 0 },
      lastUpdate: Date.now(),
    };
  }

  const throughputMultiplier =
    status === "degraded" ? 0.3 + Math.random() * 0.4 : 1;
  const latencyMultiplier = status === "degraded" ? 1.5 + Math.random() * 2 : 1;

  const baseLatency = {
    p50:
      Math.max(1, node.latency.p50 + (Math.random() - 0.5) * 5) *
      latencyMultiplier,
    p95:
      Math.max(10, node.latency.p95 + (Math.random() - 0.5) * 10) *
      latencyMultiplier,
    p99:
      Math.max(20, node.latency.p99 + (Math.random() - 0.5) * 20) *
      latencyMultiplier,
    avg: node.latency.avg * latencyMultiplier,
    samples: node.latency.samples,
  };

  const latency = applyLatencySpike(baseLatency, networkConfig);

  const cellUpdateCount = Math.min(8, node.cells.length);
  const cellsToUpdate = new Set<number>();
  while (cellsToUpdate.size < cellUpdateCount) {
    cellsToUpdate.add(Math.floor(Math.random() * node.cells.length));
  }

  const cells = node.cells.map((c, i) => {
    if (!cellsToUpdate.has(i)) return c;
    return {
      ...c,
      signal: Math.max(0, Math.min(100, c.signal + (Math.random() - 0.5) * 15)),
      queueDepth: Math.max(
        0,
        c.queueDepth + Math.floor((Math.random() - 0.5) * 4),
      ),
    };
  });

  return {
    ...node,
    cells,
    workers: {
      ...node.workers,
      active: Math.max(
        0,
        Math.min(
          node.workers.total,
          node.workers.active + Math.floor((Math.random() - 0.5) * 20),
        ),
      ),
    },
    latency,
    throughput: Math.max(
      0,
      Math.floor(
        (node.throughput + (Math.random() - 0.5) * 50) * throughputMultiplier,
      ),
    ),
    tasksProcessed:
      node.tasksProcessed +
      Math.floor(Math.random() * 10 * throughputMultiplier),
    status,
    packetLoss,
    lastUpdate: Date.now(),
  };
}

export function batchUpdateNodes(
  nodes: NodeMetrics[],
  networkConfig?: NetworkIssueConfig,
): NodeMetrics[] {
  // Performance optimization: only update ~20% of nodes per tick + all visible nodes (approximated by first 20)
  // + any offline/degraded nodes to ensure they recover
  const updateThreshold = 0.2;

  return nodes.map((node, index) => {
    // Always update first 20 (likely visible) and unhealthy nodes
    if (
      index < 20 ||
      node.status !== "healthy" ||
      Math.random() < updateThreshold
    ) {
      return updateNodeMetrics(node, networkConfig);
    }
    return node;
  });
}

export { DEFAULT_NETWORK_ISSUES };
export type { NetworkIssueConfig };
