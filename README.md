# Maikers Cellular Stigmergy Monitor

Real-time monitoring dashboard for the Maikers Cellular Stigmergy Network.

## Features

- 📊 **Real-time Metrics** — Throughput, latency P50/P95/P99, worker utilization
- 🔒 **TEE Status** — Node attestation status (Intel TDX, AMD SEV)
- 🧠 **Cell Fabric Visualization** — Live view of cell signal/load distribution
- 📈 **Time Series Charts** — Throughput and latency trends
- 🌐 **Multi-Node View** — Monitor entire network at a glance

## Quick Start

```bash
# Install
pnpm install

# Development
pnpm dev

# Build
pnpm build
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MONITOR DASHBOARD                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NETWORK STATS: Nodes | Throughput | Latency | TEE   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │  THROUGHPUT CHART    │  │  LATENCY CHART           │   │
│  │  [Area Graph]        │  │  [Line Graph P50/P99]    │   │
│  └──────────────────────┘  └──────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NODE GRID                                           │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                │  │
│  │  │ Node 0  │ │ Node 1  │ │ Node 2  │ ...            │  │
│  │  │[Fabric] │ │[Fabric] │ │[Fabric] │                │  │
│  │  │ Metrics │ │ Metrics │ │ Metrics │                │  │
│  │  └─────────┘ └─────────┘ └─────────┘                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Framework**: Next.js 16 + React 19
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

## Connecting to Real Nodes

Currently uses mock data. To connect to real nodes:

1. Add WebSocket endpoint to nodes
2. Update `src/lib/mock-data.ts` → `src/lib/node-client.ts`
3. Use `useEffect` with WebSocket subscription

## Related

- [maikers-cellular-stigmergy-node](https://github.com/maikershq/maikers-cellular-stigmergy-node) — Rust node implementation

---

**Built by [maikers - creators of realities](https://maikers.com)**
