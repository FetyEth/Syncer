/**
 * Somnia Network Configuration
 * Supports both Testnet (Shannon) and Mainnet
 * Includes Somnia Data Streams (SDS) SDK
 */

import { createPublicClient, http, webSocket, defineChain } from "viem";
import { SDK } from "@somnia-chain/streams";

// Network type
export type NetworkMode = "testnet" | "mainnet";

// Determine network mode from environment variable (defaults to testnet)
const NETWORK_MODE: NetworkMode =
  (process.env.NEXT_PUBLIC_NETWORK_MODE as NetworkMode) || "testnet";

// Define Somnia Mainnet chain
export const somniaMainnet = defineChain({
  id: 5031,
  name: "Somnia Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "SOMI",
    symbol: "SOMI",
  },
  rpcUrls: {
    default: {
      http: ["https://api.infra.mainnet.somnia.network"],
      webSocket: ["wss://api.infra.mainnet.somnia.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Somnia Explorer",
      url: "https://explorer.somnia.network",
    },
  },
  testnet: false,
});

// Define Somnia Testnet (Shannon) chain
export const somniaTestnet = defineChain({
  id: 50312,
  name: "Somnia Testnet (Shannon)",
  nativeCurrency: {
    decimals: 18,
    name: "STT",
    symbol: "STT",
  },
  rpcUrls: {
    default: {
      http: ["https://dream-rpc.somnia.network"],
      webSocket: ["wss://dream-rpc.somnia.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Somnia Shannon Explorer",
      url: "https://shannon-explorer.somnia.network",
    },
  },
  testnet: true,
});

// Select chain based on network mode
export const somniaChain =
  NETWORK_MODE === "mainnet" ? somniaMainnet : somniaTestnet;

// Select RPC URL based on network mode or environment variable override
const rpcUrl =
  process.env.NEXT_PUBLIC_RPC_URL || somniaChain.rpcUrls.default.http[0];
const wsUrl =
  process.env.NEXT_PUBLIC_WS_URL || somniaChain.rpcUrls.default.webSocket?.[0];

// Create public client for Somnia (HTTP for read operations)
export const somniaClient = createPublicClient({
  chain: somniaChain,
  transport: http(rpcUrl),
});

// Create WebSocket client for real-time SDS subscriptions (REQUIRED for subscribe!)
export const somniaWebSocketClient = createPublicClient({
  chain: somniaChain,
  transport: wsUrl ? webSocket(wsUrl) : http(rpcUrl), // Fallback to HTTP if no WebSocket
});

// Initialize Somnia Data Streams SDK with WebSocket client for subscriptions
// Note: For publishing (write operations), initialize with wallet client server-side
export const somniaSDK = new SDK({
  public: somniaWebSocketClient, // Use WebSocket client for reactive subscriptions
});

// Alternative: Read-only SDK with HTTP (faster for non-reactive queries)
export const somniaReadSDK = new SDK({
  public: somniaClient,
});

// Export current network configuration
export const networkConfig = {
  mode: NETWORK_MODE,
  chainId: somniaChain.id,
  chainName: somniaChain.name,
  nativeCurrency: somniaChain.nativeCurrency,
  rpcUrl,
  wsUrl,
  blockExplorer: somniaChain.blockExplorers?.default.url,
  supportsWebSocket: !!wsUrl,
};
