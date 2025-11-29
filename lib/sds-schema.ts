/**
 * Somnia Data Streams Schema Definitions
 * Defines structured schemas for transaction streaming
 */

import { zeroHash } from "viem";

// zeroBytes32 equivalent
export const zeroBytes32 = zeroHash;

// Transaction Stream Schema - Structured data format
export const transactionStreamSchema = `
  uint64 timestamp,
  bytes32 txHash,
  address fromAddress,
  address toAddress,
  uint256 value,
  uint256 gasUsed,
  string txType,
  bytes32 blockHash,
  uint256 blockNumber
`.trim();

// Event Schema for Transaction Broadcasts
export const transactionBroadcastEventSchema = {
  params: [
    { name: "blockNumber", paramType: "uint256", isIndexed: true },
    { name: "txCount", paramType: "uint256", isIndexed: false },
  ],
  eventTopic:
    "TransactionBroadcast(uint256 indexed blockNumber, uint256 txCount)",
};

// Schema Configuration
export const SCHEMA_CONFIG = {
  // Schema name (human-readable identifier)
  transactionStreamName: "somnia_transaction_stream",

  // Event ID for subscriptions
  transactionBroadcastEventId: "TransactionBroadcast",

  // Parent schema (use zeroBytes32 for root schemas)
  parentSchemaId: zeroBytes32,

  // Schema definition
  schema: transactionStreamSchema,

  // Event schema
  eventSchema: transactionBroadcastEventSchema,
};

// Demo Publisher Configuration
// In production, this would be a backend service with a private key
export const DEMO_PUBLISHER_CONFIG = {
  // This address should match the publisher that's actively writing data
  // For demo purposes, we'll use a placeholder and show fallback behavior
  publisherAddress:
    "0x0000000000000000000000000000000000000000" as `0x${string}`,

  // Note: In a real implementation, you'd have:
  // 1. A backend service with wallet credentials
  // 2. That service monitors blocks and publishes to SDS
  // 3. Frontend subscribes to the stream events

  // For now, we'll demonstrate with simulated data
  useDemoMode: true,
};

/**
 * Schema Encoder Field Definitions
 * Maps transaction data to schema fields
 */
export interface TransactionStreamData {
  timestamp: bigint;
  txHash: `0x${string}`;
  fromAddress: `0x${string}`;
  toAddress: `0x${string}`;
  value: bigint;
  gasUsed: bigint;
  txType: string;
  blockHash: `0x${string}`;
  blockNumber: bigint;
}

/**
 * Helper: Format transaction for schema encoding
 */
export function formatTransactionForSchema(
  tx: any,
  block: any
): TransactionStreamData {
  return {
    timestamp: BigInt(Date.now()),
    txHash: tx.hash || (("0x" + "0".repeat(64)) as `0x${string}`),
    fromAddress: (tx.from ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
    toAddress: (tx.to ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
    value: BigInt(tx.value || 0),
    gasUsed: BigInt(tx.gas || 0),
    txType: tx.to ? "Transfer" : "ContractDeploy",
    blockHash: (block.hash || "0x" + "0".repeat(64)) as `0x${string}`,
    blockNumber: BigInt(block.number || 0),
  };
}
