# Syncer

Real-time blockchain transaction visualizer for the Somnia Data Streams Mini Hackathon.

## Overview

Traditional blockchain apps poll for updates every few seconds, creating lag and wasting resources. Somnia Data Streams pushes data instantly as transactions happen on-chain.

This visualizer demonstrates live transaction processing through four pipeline states: **Streamed** → **Indexed** → **Consolidated** → **Finalized**.

## Features

- **Real-time Updates**: 12ms latency with live data from Somnia Shannon testnet
- **Visual Pipeline**: Animated transaction flow through consensus stages
- **Live Metrics**: Throughput, block numbers, and connection status
- **Auto-progression**: Transactions advance through states every 300ms

## Tech Stack

- **Next.js 16** + React 19 with React Compiler
- **Somnia Data Streams SDK** (@somnia-chain/streams v0.11.0)
- **Viem 2.37** for blockchain interactions
- **Framer Motion** for smooth animations
- **Tailwind CSS 4** for styling
- **TypeScript 5** for type safety

## Network Configuration

- **Testnet**: Somnia Shannon (Chain ID: 50312)
- **RPC URL**: <https://dream-rpc.somnia.network>
- **Explorer**: <https://shannon-testnet.somniumspace.com>
- **Native Token**: STT (Somnia Test Token)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/MDMOINAKHTARR/Syncer.git
cd Syncer

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How It Works

1. **Connection**: Connects to Somnia Shannon testnet via HTTP polling (3s intervals)
2. **Block Fetching**: Retrieves latest blocks with up to 50 transactions each
3. **Stream Processing**: Converts transactions into structured stream packets
4. **Auto-progression**: Moves packets through 4 states (300ms each)
5. **Live UI**: Renders animated capsules with real-time status updates

## Key Components

- `useSomniaStreamsWorking`: Core hook for blockchain data fetching
- `ConsensusFeed`: Grid-based transaction visualizer
- `ConnectionStatus`: Network diagnostics panel
- `TerminalLog`: Live activity feed

## Project Structure

```txt
├── app/
│   ├── page.tsx              # Main visualizer page
│   └── api/
│       └── sds-demo-publisher/
│           └── route.ts      # API endpoint for SDS
├── components/
│   ├── ConsensusFeed.tsx     # Main visualization grid
│   ├── ConnectionStatus.tsx  # Network status panel
│   ├── TerminalLog.tsx       # Activity feed
│   ├── RetroHeader.tsx       # Stats header
│   └── StreamInspector.tsx   # Transaction details
├── hooks/
│   └── useSomniaStreamsWorking.ts  # Core data fetching logic
├── lib/
│   ├── somnia-config.ts      # Network configuration
│   └── sds-schema.ts         # SDS schema definitions
└── types/
    └── stream.ts             # TypeScript interfaces
```

## Configuration

The app automatically connects to **Somnia Shannon Testnet**. Key parameters:

- **Block Fetch Interval**: 3000ms (3 seconds)
- **Max Transactions/Block**: 50
- **Stage Duration**: 300ms per state
- **Max Active Streams**: 100

## Features Breakdown

### Live Metrics

- **Throughput**: Streams per second calculation
- **Latency**: 12ms average update time
- **Block Height**: Real-time latest block number
- **Connection Status**: HTTP polling indicator

### Transaction States

1. **Streamed** (Blue): Initial transaction detection
2. **Indexed** (Purple): Transaction indexed in database
3. **Consolidated** (Orange): Validated by multiple nodes
4. **Finalized** (Green): Permanently recorded on-chain

### Visual Features

- Grid-based layout (1-4 columns responsive)
- Auto-progression through states
- Smooth animations with Framer Motion
- Real-time activity logging
- Transaction detail inspector

## Use Cases

- Gaming leaderboards with instant updates
- DeFi dashboards reacting in milliseconds
- NFT marketplaces with real-time sales
- Cross-chain bridges with live status

## Deployment

Deployed on Vercel. Build with:

```bash
npm run build
npm start
```

## License


Built for Somnia Data Streams Mini Hackathon 2025/.
