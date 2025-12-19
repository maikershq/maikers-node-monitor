import type { NodeMetrics } from "./types";

const SCAN_PORT_START = 8080;
const SCAN_PORT_END = 8099;
const SCAN_TIMEOUT_MS = 500;

export interface NodeConnection {
  endpoint: string;
  nodeId: string;
  connected: boolean;
  lastSeen: number;
}

export class NodeDiscovery {
  private discoveredEndpoints: Set<string> = new Set();
  private connections: Map<string, NodeConnection> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private scanInterval: NodeJS.Timeout | null = null;
  private onUpdate: ((nodes: NodeMetrics[]) => void) | null = null;

  addEndpoint(endpoint: string) {
    this.discoveredEndpoints.add(endpoint);
  }

  removeEndpoint(endpoint: string) {
    this.discoveredEndpoints.delete(endpoint);
    this.connections.delete(endpoint);
  }

  async scanForNodes(): Promise<void> {
    const ports = Array.from(
      { length: SCAN_PORT_END - SCAN_PORT_START + 1 },
      (_, i) => SCAN_PORT_START + i,
    );

    const checks = ports.map(async (port) => {
      const endpoint = `http://localhost:${port}`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

        const response = await fetch(`${endpoint}/health`, {
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          this.discoveredEndpoints.add(endpoint);
        }
      } catch {
        // Port not responding
      }
    });

    await Promise.allSettled(checks);
  }

  async discoverNodes(): Promise<NodeMetrics[]> {
    const endpoints = Array.from(this.discoveredEndpoints);
    const results = await Promise.allSettled(
      endpoints.map((endpoint) => this.fetchNodeMetrics(endpoint)),
    );

    const nodes: NodeMetrics[] = [];

    results.forEach((result, index) => {
      const endpoint = endpoints[index];

      if (result.status === "fulfilled" && result.value) {
        nodes.push(result.value);
        this.connections.set(endpoint, {
          endpoint,
          nodeId: result.value.nodeId,
          connected: true,
          lastSeen: Date.now(),
        });
      } else {
        const existing = this.connections.get(endpoint);
        if (existing) {
          existing.connected = false;
        }
      }
    });

    return nodes;
  }

  private async fetchNodeMetrics(
    endpoint: string,
  ): Promise<NodeMetrics | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${endpoint}/metrics`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      clearTimeout(timeout);

      if (!response.ok) return null;

      const data = await response.json();
      return this.parseNodeMetrics(data, endpoint);
    } catch {
      return null;
    }
  }

  private parseNodeMetrics(data: unknown, endpoint: string): NodeMetrics {
    const raw = data as Record<string, unknown>;

    return {
      nodeId: (raw.nodeId as string) || `node-${endpoint.split(":").pop()}`,
      peerId: (raw.peerId as string) || "unknown",
      teePlatform:
        (raw.teePlatform as NodeMetrics["teePlatform"]) || "Simulated",
      teeAttested: (raw.teeAttested as boolean) || false,
      uptime: (raw.uptime as number) || 0,
      cells: (raw.cells as NodeMetrics["cells"]) || [],
      workers: (raw.workers as NodeMetrics["workers"]) || {
        active: 0,
        total: 0,
        max: 10000,
      },
      latency: (raw.latency as NodeMetrics["latency"]) || {
        p50: 0,
        p95: 0,
        p99: 0,
        avg: 0,
        samples: 0,
      },
      throughput: (raw.throughput as number) || 0,
      tasksProcessed: (raw.tasksProcessed as number) || 0,
      tasksFailed: (raw.tasksFailed as number) || 0,
      fuelConsumed: (raw.fuelConsumed as number) || 0,
      peers: (raw.peers as string[]) || [],
      lastUpdate: Date.now(),
      status: "healthy",
      packetLoss: 0,
    };
  }

  startPolling(intervalMs: number, onUpdate: (nodes: NodeMetrics[]) => void) {
    this.onUpdate = onUpdate;

    if (this.pollingInterval) clearInterval(this.pollingInterval);
    if (this.scanInterval) clearInterval(this.scanInterval);

    const poll = async () => {
      const nodes = await this.discoverNodes();
      if (this.onUpdate) this.onUpdate(nodes);
    };

    // Initial scan then poll
    this.scanForNodes().then(poll);

    // Re-scan for new nodes every 10 seconds
    this.scanInterval = setInterval(() => this.scanForNodes(), 10000);

    // Poll known nodes at requested interval
    this.pollingInterval = setInterval(poll, intervalMs);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.onUpdate = null;
  }

  getConnections(): NodeConnection[] {
    return Array.from(this.connections.values());
  }
}

export const nodeDiscovery = new NodeDiscovery();
