# maikers-node-monitor

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)

Real-time monitoring dashboard for maikers infrastructure nodes.

## Overview

**Core Capabilities:**

- **Node Discovery** - Auto-discover nodes from registry or add manually
- **Live Metrics** - Real-time throughput, latency, and worker stats
- **Cell Fabric Visualization** - Global view of cellular stigmergy network
- **TEE Attestation** - Track secure enclave status across nodes
- **Agent Activity** - Monitor recent agent executions

## Quick Start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_REGISTRY_URL` | No | Registry endpoint (default: https://registry.maikers.com) |

## Features

### Dashboard

- Network-wide metrics (nodes, throughput, latency, cells)
- Global cell fabric visualization
- Cluster status and node pool
- Latency distribution histogram

### Node Cards

- Individual node metrics and status
- TEE platform attestation (Intel TDX, AMD SEV)
- Cell shard ownership
- Clickable endpoint URLs

### Recent Agents

- Agent execution history
- Filter by collection, duration, node
- Sortable table with search

## Node Metrics API

Nodes expose a `/metrics` endpoint:

```json
{
  "nodeId": "node-001",
  "peerId": "12D3KooW...",
  "nodePubkey": "7xKX...",
  "secure": true,
  "teePlatform": "IntelTDX",
  "teeAttested": true,
  "uptime": 3600,
  "cells": [{ "id": 0, "signal": 45, "queueDepth": 10 }],
  "workers": { "active": 20, "total": 20, "max": 10000 },
  "latency": { "p50": 5.2, "p95": 12.1, "p99": 25.3, "avg": 6.8, "samples": 1000 },
  "throughput": 1500,
  "tasksProcessed": 50000,
  "tasksFailed": 12,
  "fuelConsumed": 1000000,
  "peers": []
}
```

## Development

```bash
pnpm install       # Install dependencies
pnpm dev           # Development server
pnpm build         # Production build
pnpm lint          # ESLint
```

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Recharts
- Zod

## Related Repositories

- **[maikers-node](https://github.com/maikershq/maikers-node)** - Node runtime
- **[maikers-registry](https://github.com/maikershq/maikers-registry)** - Node registry service
- **[maikers-mainframe](https://github.com/maikershq/maikers-mainframe)** - Solana program

---

**Built by [maikers - creators of realities](https://maikers.com)**
