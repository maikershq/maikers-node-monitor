# maikers Node Monitor

Real-time monitoring dashboard for maikers nodes.

## Features

- **Live Mode**: Discovers and monitors real nodes via HTTP metrics endpoints
- **Simulation Mode**: Generates mock data for testing/demo purposes
- **Real-time Charts**: Throughput and latency visualization
- **Node Cards**: Individual node status with TEE attestation info
- **Endpoint Management**: Add/remove node endpoints dynamically

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Connecting to Nodes

The monitor connects to nodes via HTTP on port 8080 by default. Ensure nodes are running with the HTTP metrics server enabled.

Default endpoints:

- `http://localhost:8080`
- `http://localhost:8081`
- `http://localhost:8082`

Add custom endpoints via the Settings panel in Live mode.

## Node Metrics API

Nodes expose a `/metrics` endpoint returning:

```json
{
  "nodeId": "abc12345",
  "peerId": "12D3KooW...",
  "teePlatform": "IntelTDX",
  "teeAttested": true,
  "uptime": 3600,
  "cells": [{ "id": 0, "signal": 45, "tasks": 10 }],
  "workers": { "active": 20, "total": 20, "max": 10000 },
  "latency": {
    "p50": 5.2,
    "p95": 12.1,
    "p99": 25.3,
    "avg": 6.8,
    "samples": 1000
  },
  "throughput": 1500,
  "tasksProcessed": 50000,
  "tasksFailed": 12,
  "fuelConsumed": 1000000,
  "peers": []
}
```

## Tech Stack

- Next.js 16
- Tailwind CSS
- Recharts
- Zod
