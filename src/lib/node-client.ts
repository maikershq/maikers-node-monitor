import type { NodeMetrics } from "./types";
import { config } from "./config";

const REGISTRY_TIMEOUT_MS = 5000;

export interface NodeConnection {
  endpoint: string;
  nodeId: string;
  connected: boolean;
  lastSeen: number;
}

export class NodeDiscovery {
  private discoveredEndpoints: Set<string> = new Set();
  private connections: Map<string, NodeConnection> = new Map();
  private nodesByEndpoint: Map<string, NodeMetrics> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private scanInterval: NodeJS.Timeout | null = null;
  private onUpdate: ((nodes: NodeMetrics[]) => void) | null = null;
  private registryUrl: string = config.registryUrl;

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

  setRegistryUrl(url: string) {
    this.registryUrl = url.replace(/\/$/, "");
  }

  getRegistryUrl(): string {
    return this.registryUrl;
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
    this.nodesByEndpoint.delete(endpoint);
    this.saveEndpoints();
    if (this.onUpdate) {
      this.refreshNodes();
    }
  }

  removeOfflineNodes(): number {
    const offlineEndpoints: string[] = [];

    this.connections.forEach((conn, endpoint) => {
      if (!conn.connected) {
        offlineEndpoints.push(endpoint);
      }
    });

    offlineEndpoints.forEach((endpoint) => {
      this.discoveredEndpoints.delete(endpoint);
      this.connections.delete(endpoint);
      this.nodesByEndpoint.delete(endpoint);
    });

    if (offlineEndpoints.length > 0) {
      this.saveEndpoints();
      if (this.onUpdate) {
        this.refreshNodes();
      }
    }

    return offlineEndpoints.length;
  }

  getOfflineCount(): number {
    return Array.from(this.connections.values()).filter((c) => !c.connected)
      .length;
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
    await this.fetchFromRegistry();
    await this.refreshNodes();
  }

  private async fetchFromRegistry(): Promise<void> {
    if (!this.registryUrl) return;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REGISTRY_TIMEOUT_MS);

      const response = await fetch(`${this.registryUrl}/nodes`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`Registry returned ${response.status}`);
        return;
      }

      const data = await response.json();
      const nodes = Array.isArray(data) ? data : data.nodes || [];

      let added = false;
      for (const node of nodes) {
        const endpoint = node.endpoint || node.url;
        const fallbackHost = node.host || node.nodeId;

        const resolved =
          endpoint || (fallbackHost ? `https://${fallbackHost}` : null);

        if (resolved && !this.discoveredEndpoints.has(resolved)) {
          this.discoveredEndpoints.add(resolved);
          added = true;
        }
      }

      if (added) {
        this.saveEndpoints();
      }
    } catch (err) {
      console.warn("Failed to fetch from registry:", err);
    }
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

        // Store by endpoint to prevent duplicates
        this.nodesByEndpoint.set(endpoint, node);

        this.connections.set(endpoint, {
          endpoint,
          nodeId: node.nodeId,
          connected: true,
          lastSeen: Date.now(),
        });
      } else {
        // Fetch failed - update existing or create placeholder
        const existing = this.nodesByEndpoint.get(endpoint);

        if (existing) {
          // Mark existing node as offline
          this.nodesByEndpoint.set(endpoint, {
            ...existing,
            status: "offline",
            lastUpdate: Date.now(),
          });
        } else {
          // Create placeholder for never-seen endpoint
          const placeholder = this.createOfflinePlaceholder(endpoint);
          this.nodesByEndpoint.set(endpoint, placeholder);
        }

        const conn = this.connections.get(endpoint);
        if (conn) {
          conn.connected = false;
        } else {
          const node = this.nodesByEndpoint.get(endpoint)!;
          this.connections.set(endpoint, {
            endpoint,
            nodeId: node.nodeId,
            connected: false,
            lastSeen: 0,
          });
        }
      }
    });

    // Return all nodes (one per endpoint, no duplicates)
    return Array.from(this.nodesByEndpoint.values());
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
    // Use endpoint as nodeId to ensure uniqueness
    const urlParts = endpoint.replace(/https?:\/\//, "");

    return {
      nodeId: urlParts,
      peerId: "unknown",
      secure: false,
      teePlatform: null,
      teeAttested: false,
      uptime: 0,
      cells: [],
      ownedCells: [],
      claimedEvents: 0,
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
      nodeId: (raw.nodeId as string) || endpoint.replace(/https?:\/\//, ""),
      peerId: (raw.peerId as string) || "unknown",
      secure: (raw.secure as boolean) ?? false,
      teePlatform: (raw.teePlatform as NodeMetrics["teePlatform"]) ?? null,
      teeAttested: (raw.teeAttested as boolean) || false,
      uptime: (raw.uptime as number) || 0,
      cells: (raw.cells as NodeMetrics["cells"]) || [],
      ownedCells: (raw.ownedCells as number[]) || [],
      claimedEvents: (raw.claimedEvents as number) || 0,
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

  startPolling(
    intervalMs: number,
    onUpdate: (nodes: NodeMetrics[]) => void,
    scanIntervalMs: number = 60000,
  ) {
    this.onUpdate = onUpdate;

    if (this.pollingInterval) clearInterval(this.pollingInterval);
    if (this.scanInterval) clearInterval(this.scanInterval);

    // Initial scan
    this.scanForNodes();

    // Re-scan registry for new nodes at configured interval
    this.scanInterval = setInterval(() => this.scanForNodes(), scanIntervalMs);

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
