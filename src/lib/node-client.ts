import type { NodeMetrics, NodeStatus } from "./types";

const SCAN_PORT_START = 8080;
const SCAN_PORT_END = 8099;
const SCAN_TIMEOUT_MS = 1000;

export interface NodeConnection {
  endpoint: string;
  nodeId: string;
  connected: boolean;
  lastSeen: number;
}

export class NodeDiscovery {
  private discoveredEndpoints: Set<string> = new Set();
  private connections: Map<string, NodeConnection> = new Map();
  // Cache of last known healthy metrics for each endpoint
  private endpointMetrics: Map<string, NodeMetrics> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private scanInterval: NodeJS.Timeout | null = null;
  private onUpdate: ((nodes: NodeMetrics[]) => void) | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("discoveredEndpoints");
      if (saved) {
        try {
          const endpoints = JSON.parse(saved);
          if (Array.isArray(endpoints)) {
            endpoints.forEach((ep) => this.discoveredEndpoints.add(ep));
          }
        } catch (e) {
          console.warn("Failed to load saved endpoints", e);
        }
      }
    }

    // Add default localhost ports
    for (let port = SCAN_PORT_START; port <= SCAN_PORT_END; port++) {
      // We don't add them to discoveredEndpoints yet, scanForNodes will validate them
    }
  }

  async addEndpoint(endpoint: string) {
    // Normalize endpoint (remove trailing slash)
    const normalized = endpoint.replace(/\/$/, "");

    if (!this.discoveredEndpoints.has(normalized)) {
      this.discoveredEndpoints.add(normalized);
      this.saveEndpoints();
      // Try to connect immediately
      await this.refreshNodes();
    }
  }

  removeEndpoint(endpoint: string) {
    this.discoveredEndpoints.delete(endpoint);
    this.connections.delete(endpoint);
    this.endpointMetrics.delete(endpoint);
    this.saveEndpoints();
    // Notify update to remove it from UI
    if (this.onUpdate) {
      this.refreshNodes();
    }
  }

  private saveEndpoints() {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "discoveredEndpoints",
        JSON.stringify(Array.from(this.discoveredEndpoints)),
      );
    }
  }

  async scanForNodes(): Promise<void> {
    const ports = Array.from(
      { length: SCAN_PORT_END - SCAN_PORT_START + 1 },
      (_, i) => SCAN_PORT_START + i,
    );

    const checks = ports.map(async (port) => {
      const endpoint = `http://localhost:${port}`;
      if (this.discoveredEndpoints.has(endpoint)) return;

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
    await this.refreshNodes();
  }

  private async refreshNodes() {
    const nodes = await this.discoverNodes();
    if (this.onUpdate) {
      this.onUpdate(nodes);
    }
  }

  async discoverNodes(): Promise<NodeMetrics[]> {
    const endpoints = Array.from(this.discoveredEndpoints);
    const results = await Promise.allSettled(
      endpoints.map((endpoint) => this.fetchNodeMetrics(endpoint)),
    );

    const nodeMap = new Map<string, NodeMetrics>();
    const statusPriority: Record<NodeStatus, number> = {
      healthy: 3,
      degraded: 2,
      offline: 1,
    };

    const addToMap = (node: NodeMetrics) => {
      const existing = nodeMap.get(node.nodeId);
      if (!existing) {
        nodeMap.set(node.nodeId, node);
        return;
      }

      const newScore = statusPriority[node.status];
      const oldScore = statusPriority[existing.status];

      if (newScore > oldScore) {
        nodeMap.set(node.nodeId, node);
      } else if (newScore === oldScore) {
        // Tie-break by recency
        if (node.lastUpdate > existing.lastUpdate) {
          nodeMap.set(node.nodeId, node);
        }
      }
    };

    results.forEach((result, index) => {
      const endpoint = endpoints[index];

      if (result.status === "fulfilled" && result.value) {
        const node = result.value;
        node.status = "healthy"; // Explicitly set healthy
        this.endpointMetrics.set(endpoint, node); // Update cache

        addToMap(node);

        this.connections.set(endpoint, {
          endpoint,
          nodeId: node.nodeId,
          connected: true,
          lastSeen: Date.now(),
        });
      } else {
        // Fetch failed - show as offline
        const cached = this.endpointMetrics.get(endpoint);
        const offlineNode: NodeMetrics = cached
          ? {
              ...cached,
              status: "offline",
              lastUpdate: Date.now(),
            }
          : this.createOfflinePlaceholder(endpoint);

        addToMap(offlineNode);

        // Store placeholder in cache so it persists
        if (!cached) {
          this.endpointMetrics.set(endpoint, offlineNode);
        }

        const existing = this.connections.get(endpoint);
        if (existing) {
          existing.connected = false;
        } else {
          this.connections.set(endpoint, {
            endpoint,
            nodeId: offlineNode.nodeId,
            connected: false,
            lastSeen: 0,
          });
        }
      }
    });

    return Array.from(nodeMap.values());
  }

  private async fetchNodeMetrics(
    endpoint: string,
  ): Promise<NodeMetrics | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      // Handle HTTPS automatically if endpoint starts with http/https
      const url = endpoint.startsWith("http") ? endpoint : `http://${endpoint}`;

      const response = await fetch(`${url}/metrics`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      clearTimeout(timeout);

      if (!response.ok) return null;

      const data = await response.json();
      return this.parseNodeMetrics(data, endpoint);
    } catch (e) {
      console.warn(`Failed to fetch metrics from ${endpoint}:`, e);
      return null;
    }
  }

  private createOfflinePlaceholder(endpoint: string): NodeMetrics {
    // Extract a readable name from the endpoint
    const urlParts = endpoint.replace(/https?:\/\//, "").split(/[:.]/);
    const nodeId =
      urlParts[0] === "localhost"
        ? `localhost:${urlParts[1] || "8080"}`
        : urlParts[0];

    return {
      nodeId,
      peerId: "unknown",
      secure: false,
      teePlatform: null,
      teeAttested: false,
      uptime: 0,
      cells: [],
      workers: { active: 0, total: 0, max: 0 },
      latency: { p50: 0, p95: 0, p99: 0, avg: 0, samples: 0 },
      throughput: 0,
      tasksProcessed: 0,
      tasksFailed: 0,
      fuelConsumed: 0,
      peers: [],
      lastUpdate: Date.now(),
      status: "offline",
      packetLoss: 0,
    };
  }

  private parseNodeMetrics(data: unknown, endpoint: string): NodeMetrics {
    const raw = data as Record<string, unknown>;

    return {
      nodeId: (raw.nodeId as string) || `node-${endpoint.split(":").pop()}`,
      peerId: (raw.peerId as string) || "unknown",
      secure: (raw.secure as boolean) ?? false,
      teePlatform: (raw.teePlatform as NodeMetrics["teePlatform"]) ?? null,
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

    // Initial scan then poll
    this.scanForNodes();

    // Re-scan for new nodes every 10 seconds
    this.scanInterval = setInterval(() => this.scanForNodes(), 10000);

    // Poll known nodes at requested interval
    this.pollingInterval = setInterval(() => this.refreshNodes(), intervalMs);
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
