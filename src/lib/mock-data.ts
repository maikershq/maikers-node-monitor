import type { NodeMetrics, TimeSeriesPoint } from "./types";

const TEE_PLATFORMS = ["IntelTdx", "AmdSevSnp", "Simulated"] as const;

function randomId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function generateCells(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    signal: Math.floor(Math.random() * 100),
    queueDepth: Math.floor(Math.random() * 20),
  }));
}

export function generateMockNode(index: number): NodeMetrics {
  const cellCount = 64;
  const platform = TEE_PLATFORMS[index % 3];

  return {
    nodeId: `node-${index.toString().padStart(3, "0")}`,
    peerId: `12D3KooW${randomId()}${randomId()}`,
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
    peers: Array.from(
      { length: Math.floor(Math.random() * 5) + 1 },
      () => `12D3KooW${randomId()}`,
    ),
    lastUpdate: Date.now(),
  };
}

export function generateMockNodes(count: number): NodeMetrics[] {
  return Array.from({ length: count }, (_, i) => generateMockNode(i));
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

export function updateNodeMetrics(node: NodeMetrics): NodeMetrics {
  return {
    ...node,
    cells: node.cells.map((c) => ({
      ...c,
      signal: Math.max(0, Math.min(100, c.signal + (Math.random() - 0.5) * 10)),
      queueDepth: Math.max(
        0,
        c.queueDepth + Math.floor((Math.random() - 0.5) * 4),
      ),
    })),
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
    latency: {
      ...node.latency,
      p50: Math.max(1, node.latency.p50 + (Math.random() - 0.5) * 5),
      p95: Math.max(10, node.latency.p95 + (Math.random() - 0.5) * 10),
      p99: Math.max(20, node.latency.p99 + (Math.random() - 0.5) * 20),
    },
    throughput: Math.max(
      0,
      node.throughput + Math.floor((Math.random() - 0.5) * 50),
    ),
    tasksProcessed: node.tasksProcessed + Math.floor(Math.random() * 10),
    lastUpdate: Date.now(),
  };
}
