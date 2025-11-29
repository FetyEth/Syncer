/**
 * Somnia Data Streams (SDS) Schema Definitions
 *
 * This file demonstrates how to properly use SDS for custom data publishing.
 * Currently, the visualizer shows blockchain transactions, but you can extend
 * it to publish and subscribe to custom data streams.
 *
 * Learn more: https://docs.somnia.network/somnia-data-streams
 */

import { SchemaEncoder } from '@somnia-chain/streams';

// ============================================================================
// EXAMPLE: Transaction Stream Schema
// ============================================================================

/**
 * Schema for publishing transaction events to SDS
 * Format: Solidity-compatible types, comma-separated
 */
export const transactionStreamSchema =
  "uint64 timestamp, address from, address to, uint256 value, bytes32 txHash, string txType";

/**
 * Schema for publishing block events to SDS
 */
export const blockStreamSchema =
  "uint64 blockNumber, uint64 timestamp, bytes32 blockHash, uint32 txCount, uint256 gasUsed";

/**
 * Schema for high-frequency trading data (example)
 */
export const tradingStreamSchema =
  "uint64 timestamp, string symbol, uint256 price, uint256 volume, string exchange";

// ============================================================================
// Schema Encoders
// ============================================================================

export const transactionEncoder = new SchemaEncoder(transactionStreamSchema);
export const blockEncoder = new SchemaEncoder(blockStreamSchema);
export const tradingEncoder = new SchemaEncoder(tradingStreamSchema);

// ============================================================================
// Helper Functions for SDS Publishing (FUTURE USE)
// ============================================================================

/**
 * Example: How to publish transaction data to SDS
 *
 * IMPORTANT: This requires a wallet client and gas fees!
 * For read-only visualization, we use blockchain data directly.
 */
export async function publishTransactionToSDS(
  sdk: any, // somniaSDK instance
  walletClient: any, // Your wallet client
  transactionData: {
    timestamp: bigint;
    from: `0x${string}`;
    to: `0x${string}`;
    value: bigint;
    txHash: `0x${string}`;
    txType: string;
  }
) {
  // 1. Compute schema ID
  const schemaId = await sdk.streams.computeSchemaId(transactionStreamSchema);

  // 2. Check if schema is registered
  const isRegistered = await sdk.streams.isSchemaRegistered(schemaId);
  if (!isRegistered) {
    // Register schema (one-time operation)
    await sdk.streams.registerDataSchemas({
      schemaName: "TransactionStream",
      schema: transactionStreamSchema,
    });
  }

  // 3. Encode transaction data
  const encoded = transactionEncoder.encodeData([
    { name: 'timestamp', value: transactionData.timestamp.toString(), type: 'uint64' },
    { name: 'from', value: transactionData.from, type: 'address' },
    { name: 'to', value: transactionData.to, type: 'address' },
    { name: 'value', value: transactionData.value.toString(), type: 'uint256' },
    { name: 'txHash', value: transactionData.txHash, type: 'bytes32' },
    { name: 'txType', value: transactionData.txType, type: 'string' },
  ]);

  // 4. Publish to SDS
  const txHash = await sdk.streams.set({
    schemaId,
    key: transactionData.txHash, // Unique identifier for this data
    data: encoded,
  });

  return txHash;
}

/**
 * Example: How to subscribe to real-time SDS events
 *
 * This uses the SDS reactivity system for push-based updates
 */
export async function subscribeToTransactionStream(
  sdk: any,
  schemaId: `0x${string}`,
  publisherAddress: `0x${string}`,
  onData: (decodedData: any) => void
) {
  // Subscribe to stream events
  const unsubscribe = await sdk.streams.subscribe({
    somniaStreamsEventId: schemaId,
    onData: (eventData: any) => {
      // Decode the stream data
      const decoded = transactionEncoder.decodeData(eventData.data);
      onData(decoded);
    },
    onError: (error: Error) => {
      console.error('[SDS] Subscription error:', error);
    },
  });

  return unsubscribe;
}

// ============================================================================
// SDS Best Practices
// ============================================================================

/**
 * BEST PRACTICES:
 *
 * 1. Schema Design:
 *    - Keep schemas simple and focused
 *    - Use fixed-size types when possible (uint64 vs uint256)
 *    - Avoid large string fields (use bytes32 for identifiers)
 *
 * 2. Publishing:
 *    - Register schemas once, use many times
 *    - Use unique keys for each data entry
 *    - Consider gas costs for high-frequency publishing
 *
 * 3. Subscribing:
 *    - Use event-driven subscriptions instead of polling
 *    - Handle errors gracefully
 *    - Unsubscribe when component unmounts
 *
 * 4. Performance:
 *    - WebSocket connections are faster than HTTP polling
 *    - Batch operations when possible
 *    - Use schema composition for complex data structures
 *
 * Learn more:
 * - Quickstart: https://docs.somnia.network/somnia-data-streams/getting-started/quickstart
 * - Reactivity: https://docs.somnia.network/somnia-data-streams/basics/somnia-data-streams-reactivity
 * - SDK Methods: https://docs.somnia.network/somnia-data-streams/getting-started/sdk-methods-guide
 */
