/**
 * Somnia Data Streams Type Definitions
 */

export type StreamStatus =
  | "streamed"
  | "indexed"
  | "consolidated"
  | "finalized";

export interface StreamPacket {
  id: string;
  status: StreamStatus;
  timestamp: number;
  eventType: string;
  source: string;
  data: Record<string, any>;
  confirmations: number;
  hash: string;
  lastStageTime: number;
  blockNumber: number;
}

export interface StreamStats {
  latestStream: string;
  streamsPerSecond: number;
  avgFinalizationTime: number;
  updateTime: string;
  latestBlockNumber: number;
}

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "polling"
  | "error"
  | "disconnected";

export interface ConnectionInfo {
  status: ConnectionStatus;
  method: "websocket" | "http" | "none";
  error?: string;
  lastBlockTime?: number;
  networkName: string;
  rpcUrl: string;
}
