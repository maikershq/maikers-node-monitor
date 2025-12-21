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
  // Stable node registry - nodes are never removed, only updated
  private nodeRegistry: Map<string, NodeMetrics> = new Map();
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
  }

  async addEndpoint(endpoint: string) {
    const normalized = endpoint.replace(/\/$/, "");

    if (!this.discoveredEndpoints.has(normalized)) {
      this.discoveredEndpoints.add(normalized);
      this.saveEndpoints();
      await this.refreshNodes();
    }
  }

  removeEndpoint(endpoint: string) {
    this.discoveredEndpoints.delete(endpoint);
    this.connections.delete(endpoint);
    // Find and remove the node associated with this endpoint
    for (const [nodeId, node] of this.nodeRegistry) {
      if (this.getEndpointForNode(nodeId) === endpoint) {
        this.nodeRegistry.delete(nodeId);
        break;
      }
    }
    this.saveEndpoints();
    if (this.onUpdate) {
      this.refreshNodes();
    }
  }

  private getEndpointForNode(nodeId: string): string | undefined {
    for (const [endpoint, conn] of this.connections) {
      if (conn.nodeId === nodeId) return endpoint;
    }
    return undefined;
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

    results.forEach((result, index) => {
      const endpoint = endpoints[index];

      if (result.status === "fulfilled" && result.value) {
        const node = result.value;
        node.status = "healthy";

        // Update registry with fresh data
        this.nodeRegistry.set(node.nodeId, node);

        this.connections.set(endpoint, {
          endpoint,
          nodeId: node.nodeId,
          connected: true,
          lastSeen: Date.now(),
        });
      } else {
        // Fetch failed - mark existing node as offline or create placeholder
        const existingConn = this.connections.get(endpoint);
        const nodeId = existingConn?.nodeId;

        if (nodeId && this.nodeRegistry.has(nodeId)) {
          // Update existing node to offline
          const existing = this.nodeRegistry.get(nodeId)!;
          this.nodeRegistry.set(nodeId, {
            ...existing,
            status: "offline",
            lastUpdate: Date.now(),
          });
        } else {
          // Create placeholder for never-seen endpoint
          const placeholder = this.createOfflinePlaceholder(endpoint);
          this.nodeRegistry.set(placeholder.nodeId, placeholder);
          this.connections.set(endpoint, {
            endpoint,
            nodeId: placeholder.nodeId,
            connected: false,
            lastSeen: 0,
          });
        }

        if (existingConn) {
          existingConn.connected = false;
        }
      }
    });

    // Return all nodes from registry (never removes nodes)
    return Array.from(this.nodeRegistry.values());
  }

  private async fetchNodeMetrics(
    endpoint: string,
  ): Promise<NodeMetrics | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const url = endpoint.startsWith("http") ? endpoint : `http://${endpoint}`;

      const response = await fetch(`${url}/metrics`, {
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

  private createOfflinePlaceholder(endpoint: string): NodeMetrics {
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

    // Initial scan
    this.scanForNodes();

    // Re-scan for new nodes every 30 seconds (less aggressive)
    this.scanInterval = setInterval(() => this.scanForNodes(), 30000);

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
