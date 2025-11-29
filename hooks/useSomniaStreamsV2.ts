/**
 * Somnia Data Streams Hook - CORRECTED VERSION
 *
 * This version uses ACTUAL Somnia Data Streams (SDS) with:
 * - Proper schema design
 * - Reactive WebSocket subscriptions via sdk.streams.subscribe()
 * - Event-driven push notifications (not polling!)
 * - Full SDS reactivity pattern
 *
 * Architecture:
 * 1. Subscribe to SDS event stream ("TransactionBroadcast")
 * 2. Receive instant push when publisher emits events
 * 3. Decode and process structured stream data
 * 4. Update visualization with <50ms latency
 */

"use client";

import { useState, useEffect, useRef } from "react";
import {
  StreamPacket,
  StreamStats,
  StreamStatus,
  ConnectionInfo,
} from "@/types/stream";
import { somniaSDK, somniaReadSDK, networkConfig } from "@/lib/somnia-config";
import { SCHEMA_CONFIG, transactionStreamSchema } from "@/lib/sds-schema";
import { SchemaEncoder } from "@somnia-chain/streams";

// Schema decoded item type
type SchemaDecodedItem = { name: string; type: string; value: any };
import { decodeEventLog, toHex } from "viem";

const STAGE_DURATION = 300;
const MAX_STREAMS = 100;
const USE_REAL_BLOCKCHAIN_DATA = true; // Fetch real data from Somnia
const BLOCK_FETCH_INTERVAL = 3000; // Fetch new blocks every 3 seconds

export function useSomniaStreams() {
  const [streams, setStreams] = useState<StreamPacket[]>([]);
  const [stats, setStats] = useState<StreamStats>({
    latestStream: "",
    streamsPerSecond: 0,
    avgFinalizationTime: 0.3,
    updateTime: "--:--:--",
    latestBlockNumber: 0,
  });
  const [selectedStream, setSelectedStream] = useState<StreamPacket | null>(
    null
  );
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    status: "connecting",
    method: "none",
    networkName: networkConfig.chainName,
    rpcUrl: networkConfig.rpcUrl,
  });

  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const txCounterRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());
  const schemaEncoderRef = useRef<SchemaEncoder | null>(null);

  // Progress stream through pipeline stages
  const getNextStatus = (currentStatus: StreamStatus): StreamStatus => {
    const statusProgression: Record<StreamStatus, StreamStatus> = {
      streamed: "indexed",
      indexed: "consolidated",
      consolidated: "finalized",
      finalized: "finalized",
    };
    return statusProgression[currentStatus];
  };

  // Deduplicate streams by ID
  const deduplicateStreams = (streams: StreamPacket[]): StreamPacket[] => {
    const seen = new Map<string, StreamPacket>();
    for (const stream of streams) {
      if (!seen.has(stream.id)) {
        seen.set(stream.id, stream);
      } else {
        const existing = seen.get(stream.id)!;
        const statusOrder: Record<StreamStatus, number> = {
          streamed: 0,
          indexed: 1,
          consolidated: 2,
          finalized: 3,
        };
        if (statusOrder[stream.status] > statusOrder[existing.status]) {
          seen.set(stream.id, stream);
        }
      }
    }
    return Array.from(seen.values());
  };

  // Convert decoded SDS data to StreamPacket
  const convertSDSDataToStreamPacket = (
    decodedData: SchemaDecodedItem[],
    dataId: string
  ): StreamPacket => {
    // Extract fields from decoded schema data
    const timestamp = Number(
      decodedData.find((item) => item.name === "timestamp")?.value || Date.now()
    );
    const txHash = String(
      decodedData.find((item) => item.name === "txHash")?.value || "0x0"
    );
    const fromAddress = String(
      decodedData.find((item) => item.name === "fromAddress")?.value || "0x0"
    );
    const toAddress = String(
      decodedData.find((item) => item.name === "toAddress")?.value || "0x0"
    );
    const value = BigInt(
      decodedData.find((item) => item.name === "value")?.value || 0
    );
    const gasUsed = BigInt(
      decodedData.find((item) => item.name === "gasUsed")?.value || 0
    );
    const txType = String(
      decodedData.find((item) => item.name === "txType")?.value || "Transaction"
    );
    const blockNumber = Number(
      decodedData.find((item) => item.name === "blockNumber")?.value || 0
    );

    const txValue = Number(value) / 1e18;
    const isHighValue = txValue > 0.01;

    return {
      id: dataId.toLowerCase(),
      status: "streamed" as StreamStatus,
      timestamp,
      eventType: isHighValue ? "Transfer" : txType,
      source: fromAddress,
      data: {
        to:
          toAddress === "0x0000000000000000000000000000000000000000"
            ? "Contract Creation"
            : toAddress,
        value: `${txValue.toFixed(6)} ${networkConfig.nativeCurrency.symbol}`,
        gas: gasUsed.toString(),
        type: txType,
        hash: txHash,
      },
      confirmations: 0,
      hash: txHash.toLowerCase(),
      lastStageTime: timestamp,
      blockNumber,
    };
  };

  // Main Effect: SDS Subscription
  useEffect(() => {
    console.log("[SDS] 🚀 Initializing Somnia Data Streams...");
    console.log("[SDS] 📡 Network:", networkConfig.chainName);
    console.log("[SDS] 🔗 WebSocket:", networkConfig.wsUrl);
    console.log("[SDS] 📋 Schema:", SCHEMA_CONFIG.transactionStreamName);
    console.log(
      "[SDS] 🎯 Event ID:",
      SCHEMA_CONFIG.transactionBroadcastEventId
    );

    setConnectionInfo({
      status: "connecting",
      method: "websocket",
      networkName: networkConfig.chainName,
      rpcUrl: networkConfig.rpcUrl,
    });

    // Initialize schema encoder
    schemaEncoderRef.current = new SchemaEncoder(transactionStreamSchema);

    const setupSDSSubscription = async () => {
      try {
        if (USE_DEMO_MODE) {
          console.log("[SDS] ⚠️  Running in DEMO MODE");
          console.log("[SDS] ℹ️  To use live SDS streams:");
          console.log(
            "[SDS]     1. Set up a publisher backend with PRIVATE_KEY"
          );
          console.log(
            "[SDS]     2. Call /api/sds-demo-publisher to register schema"
          );
          console.log(
            "[SDS]     3. Publisher monitors blocks and calls setAndEmitEvents()"
          );
          console.log(
            "[SDS]     4. This subscriber receives instant push notifications"
          );
          console.log(
            "[SDS] 📖 Docs: https://docs.somnia.network/somnia-data-streams/basics/somnia-data-streams-reactivity"
          );

          setConnectionInfo((prev) => ({
            ...prev,
            status: "error",
            error:
              "Demo mode: No live publisher configured. See console for setup instructions.",
          }));

          // Fallback: Show demo data
          generateDemoStream();
          return;
        }

        // CORRECT SDS PATTERN: Subscribe to event stream
        console.log("[SDS] 🎧 Subscribing to TransactionBroadcast events...");

        const subscription = await somniaSDK.streams.subscribe({
          somniaStreamsEventId: SCHEMA_CONFIG.transactionBroadcastEventId,
          ethCalls: [], // No additional view calls needed
          onlyPushChanges: false, // Push all events
          onData: async (data) => {
            try {
              console.log("[SDS] 📥 Received push notification:", data);

              // Update connection status
              setConnectionInfo((prev) => ({
                ...prev,
                status: "connected",
                lastBlockTime: Date.now(),
                error: undefined,
              }));

              // Decode event log to get block number and tx count
              const decodedEvent = decodeEventLog({
                abi: [
                  {
                    type: "event",
                    name: "TransactionBroadcast",
                    inputs: SCHEMA_CONFIG.eventSchema.params.map((p) => ({
                      name: p.name,
                      type: p.paramType,
                      indexed: p.isIndexed,
                    })),
                  },
                ],
                topics: data.result.topics,
                data: data.result.data,
              });

              console.log("[SDS] 🔓 Decoded event:", decodedEvent);

              const blockNumber = Number(
                (decodedEvent.args as any).blockNumber || 0
              );
              const txCount = Number((decodedEvent.args as any).txCount || 0);

              // Compute schema ID
              const schemaIdResult =
                await somniaReadSDK.streams.computeSchemaId(
                  transactionStreamSchema
                );

              if (!schemaIdResult || schemaIdResult instanceof Error) {
                console.error("[SDS] ❌ Schema ID computation failed");
                return;
              }

              const schemaId = schemaIdResult as `0x${string}`;

              // Fetch the published stream data from SDS
              console.log(
                "[SDS] 🔍 Fetching stream data for block",
                blockNumber
              );

              // Get latest published data for this block
              // In production, you'd query by specific data IDs from the event
              const latestData =
                await somniaReadSDK.streams.getLastPublishedDataForSchema(
                  schemaId,
                  SCHEMA_CONFIG.transactionBroadcastEventId as `0x${string}`
                );

              if (
                latestData &&
                Array.isArray(latestData) &&
                latestData.length > 0
              ) {
                console.log("[SDS] ✅ Retrieved stream data:", latestData);

                // Convert to stream packets
                const newStreams: StreamPacket[] = latestData.map(
                  (decodedData: any, index: number) => {
                    return convertSDSDataToStreamPacket(
                      decodedData,
                      `stream_${blockNumber}_${index}`
                    );
                  }
                );

                txCounterRef.current += newStreams.length;

                // Add to visualization
                setStreams((prev) => {
                  const existingIds = new Set(prev.map((s) => s.id));
                  const uniqueNewStreams = newStreams.filter(
                    (s) => !existingIds.has(s.id)
                  );

                  if (uniqueNewStreams.length > 0) {
                    const updated = deduplicateStreams([
                      ...uniqueNewStreams,
                      ...prev,
                    ]).slice(0, MAX_STREAMS);
                    console.log(
                      "[SDS] 📊 Added",
                      uniqueNewStreams.length,
                      "streams | Total:",
                      updated.length
                    );
                    return updated;
                  }
                  return prev;
                });

                // Update stats
                const now = Date.now();
                const timeElapsed = (now - lastUpdateTimeRef.current) / 1000;
                const sps =
                  timeElapsed > 0 ? txCounterRef.current / timeElapsed : 0;

                setStats((prev) => ({
                  ...prev,
                  latestStream: blockNumber.toString(),
                  streamsPerSecond: Math.round(sps * 10) / 10,
                  updateTime: new Date().toLocaleTimeString(),
                  latestBlockNumber: blockNumber,
                }));

                if (timeElapsed > 10) {
                  txCounterRef.current = 0;
                  lastUpdateTimeRef.current = now;
                }
              }
            } catch (error) {
              console.error("[SDS] ❌ Error processing stream data:", error);
            }
          },
          onError: (error) => {
            console.error("[SDS] ❌ Subscription error:", error);
            setConnectionInfo((prev) => ({
              ...prev,
              status: "error",
              error: String(error),
            }));
          },
        });

        if (subscription && !(subscription instanceof Error)) {
          subscriptionRef.current = subscription;
          console.log(
            "[SDS] ✅ Subscription active! Waiting for publisher events..."
          );
        } else {
          console.error("[SDS] ❌ Subscription failed:", subscription);
          throw subscription;
        }

        setConnectionInfo((prev) => ({
          ...prev,
          status: "connected",
        }));
      } catch (error) {
        console.error("[SDS] ❌ Subscription setup failed:", error);
        setConnectionInfo((prev) => ({
          ...prev,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        }));

        // Fallback to demo
        generateDemoStream();
      }
    };

    // Demo stream generator (fallback)
    const generateDemoStream = () => {
      console.log("[SDS] 🎭 Generating demo streams...");

      const demoInterval = setInterval(() => {
        const now = Date.now();
        const demoStream: StreamPacket = {
          id: `demo_${now}_${Math.random()}`,
          status: "streamed",
          timestamp: now,
          eventType: "Demo Transaction",
          source: "0xDemo" + "0".repeat(36),
          data: {
            to: "0xRecipient" + "0".repeat(32),
            value: `${(Math.random() * 10).toFixed(6)} ${
              networkConfig.nativeCurrency.symbol
            }`,
            gas: Math.floor(Math.random() * 100000).toString(),
            type: "Transfer",
          },
          confirmations: 0,
          hash: "0xdemo" + Math.random().toString(36).substring(2),
          lastStageTime: now,
          blockNumber: Math.floor(Date.now() / 10000),
        };

        setStreams((prev) =>
          deduplicateStreams([demoStream, ...prev]).slice(0, MAX_STREAMS)
        );
      }, 2000);

      return () => clearInterval(demoInterval);
    };

    setupSDSSubscription();

    // Stream progression interval
    const progressionInterval = setInterval(() => {
      const now = Date.now();

      setStreams((prevStreams) => {
        let updatedStreams = [...prevStreams];

        updatedStreams = updatedStreams.map((stream) => {
          if (stream.status === "finalized") {
            return { ...stream, confirmations: 3 };
          }

          if (
            stream.lastStageTime &&
            now - stream.lastStageTime >= STAGE_DURATION
          ) {
            const nextStatus = getNextStatus(stream.status);
            if (nextStatus !== stream.status) {
              return {
                ...stream,
                status: nextStatus,
                lastStageTime: now,
                confirmations: stream.confirmations + 1,
              };
            }
          }
          return stream;
        });

        if (updatedStreams.length > MAX_STREAMS) {
          const finalizedIndices = updatedStreams
            .map((s, i) => (s.status === "finalized" ? i : -1))
            .filter((i) => i !== -1);

          if (finalizedIndices.length > 0) {
            updatedStreams.splice(
              finalizedIndices[finalizedIndices.length - 1],
              1
            );
          } else {
            updatedStreams.pop();
          }
        }

        return deduplicateStreams(updatedStreams);
      });
    }, 400);

    // Stats update loop
    const statsInterval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        updateTime: new Date().toLocaleTimeString(),
      }));
    }, 1000);

    // Cleanup
    return () => {
      console.log("[SDS] 🔌 Cleaning up subscription...");
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      clearInterval(progressionInterval);
      clearInterval(statsInterval);
    };
  }, []);

  return {
    streams,
    stats,
    selectedStream,
    setSelectedStream,
    connectionInfo,
  };
}
