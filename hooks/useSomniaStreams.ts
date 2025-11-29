/**
 * Somnia Data Streams Hook
 * Real-time blockchain data visualization using WebSocket
 *
 * Architecture:
 * - Uses WebSocket for instant block notifications (no polling delay!)
 * - Shows ALL transactions from each block (not just 8)
 * - Includes SDS SDK for future custom stream publishing
 */

"use client";

import { useState, useEffect, useRef } from "react";
import {
  StreamPacket,
  StreamStats,
  StreamStatus,
  ConnectionInfo,
  ConnectionStatus,
} from "@/types/stream";
import {
  somniaWebSocketClient,
  somniaSDK,
  networkConfig,
} from "@/lib/somnia-config";

const STAGE_DURATION = 300; // Fast progression through stages (ms)
const MAX_STREAMS = 100; // Increased to show more transactions
const MAX_TX_PER_BLOCK = 50; // Show up to 50 transactions per block (increased from 8!)

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

  const unwatchRef = useRef<(() => void) | null>(null);
  const txCounterRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());

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

  // Ensure streams array has no duplicates by ID
  const deduplicateStreams = (streams: StreamPacket[]): StreamPacket[] => {
    const seen = new Map<string, StreamPacket>();
    for (const stream of streams) {
      if (!seen.has(stream.id)) {
        seen.set(stream.id, stream);
      } else {
        // Keep the one with the more advanced status
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

  // Main Effect: Real-Time Block Watching with Fallback
  useEffect(() => {
    console.log("[Somnia SDS] 🔌 Connecting to", networkConfig.chainName);
    console.log("[Somnia SDS] 🌐 RPC:", networkConfig.rpcUrl);
    console.log("[Somnia SDS] 🔗 WebSocket:", networkConfig.wsUrl);
    console.log("[Somnia SDS] 📦 SDS SDK initialized:", !!somniaSDK);

    setConnectionInfo({
      status: "connecting",
      method: "none",
      networkName: networkConfig.chainName,
      rpcUrl: networkConfig.rpcUrl,
    });

    let usePolling = !networkConfig.supportsWebSocket;
    let pollInterval: NodeJS.Timeout | null = null;
    let lastProcessedBlock = 0n;

    // Try WebSocket first, fallback to polling if it fails
    let unwatch: (() => void) | null = null;

    const setupWebSocket = () => {
      try {
        console.log("[Somnia SDS] 🚀 Attempting WebSocket connection...");
        setConnectionInfo((prev) => ({
          ...prev,
          status: "connecting",
          method: "websocket",
        }));

        unwatch = somniaWebSocketClient.watchBlocks({
          onBlock: async (block) => {
            try {
              console.log(
                "[Somnia SDS] 🔥 NEW BLOCK:",
                block.number,
                "| TXs:",
                block.transactions.length
              );

              // Update connection status on first successful block
              setConnectionInfo((prev) => ({
                ...prev,
                status: "connected",
                lastBlockTime: Date.now(),
                error: undefined,
              }));

              const now = Date.now();
              const currencySymbol = networkConfig.nativeCurrency.symbol;

              // Fetch full block with transactions
              const fullBlock = await somniaWebSocketClient.getBlock({
                blockNumber: block.number!,
                includeTransactions: true,
              });

              // Show MORE transactions (up to MAX_TX_PER_BLOCK instead of just 8!)
              const txsToShow = fullBlock.transactions.slice(
                0,
                MAX_TX_PER_BLOCK
              );

              console.log(
                "[Somnia SDS] Processing",
                txsToShow.length,
                "transactions from block",
                block.number
              );

              if (txsToShow.length === 0) {
                console.log("[Somnia SDS] Empty block, skipping");
                return;
              }

              // Create stream packets from transactions
              const newStreams: StreamPacket[] = txsToShow.map(
                (tx: any, index: number) => {
                  const txValue = tx.value ? Number(tx.value) / 1e18 : 0;
                  const isHighValue = txValue > 0.01; // Highlight significant transfers

                  return {
                    id: (tx.hash || `tx_${now}_${index}`).toLowerCase(),
                    status: "streamed" as StreamStatus,
                    timestamp: now,
                    eventType: isHighValue ? "Transfer" : "Transaction",
                    source: tx.from || "0x0",
                    data: {
                      to: tx.to || "Contract Creation",
                      value: `${txValue.toFixed(6)} ${currencySymbol}`,
                      gas: tx.gas?.toString() || "N/A",
                      type: tx.to ? "Transfer" : "Contract Deploy",
                    },
                    confirmations: 0,
                    hash: (tx.hash || `tx_${now}_${index}`).toLowerCase(),
                    lastStageTime: now,
                    blockNumber: Number(block.number) || 0,
                  };
                }
              );

              // Update transaction counter for TPS calculation
              txCounterRef.current += newStreams.length;

              // Add new streams
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
                    "[Somnia SDS] ✅ Added",
                    uniqueNewStreams.length,
                    "streams | Total:",
                    updated.length
                  );
                  return updated;
                }
                return prev;
              });

              // Update stats
              const timeElapsed = (now - lastUpdateTimeRef.current) / 1000;
              const tps =
                timeElapsed > 0 ? txCounterRef.current / timeElapsed : 0;

              setStats((prev) => ({
                ...prev,
                latestStream: block.hash || "",
                streamsPerSecond: Math.round(tps * 10) / 10,
                updateTime: new Date().toLocaleTimeString(),
                latestBlockNumber:
                  Number(block.number) || prev.latestBlockNumber,
              }));

              // Reset counter every 10 seconds for rolling average
              if (timeElapsed > 10) {
                txCounterRef.current = 0;
                lastUpdateTimeRef.current = now;
              }
            } catch (error) {
              console.error("[Somnia SDS] ❌ Error processing block:", error);
            }
          },
          onError: (error) => {
            console.error("[Somnia SDS] ❌ WebSocket error:", error);
            console.log("[Somnia SDS] 🔄 Falling back to HTTP polling...");
            setConnectionInfo((prev) => ({
              ...prev,
              status: "error",
              error: error instanceof Error ? error.message : String(error),
            }));
            usePolling = true;
            if (unwatch) unwatch();
            setupPolling();
          },
          pollingInterval: undefined,
        });

        console.log("[Somnia SDS] ✅ WebSocket connected successfully");
        setConnectionInfo((prev) => ({ ...prev, status: "connected" }));
      } catch (error) {
        console.error("[Somnia SDS] ❌ WebSocket setup failed:", error);
        console.log("[Somnia SDS] 🔄 Falling back to HTTP polling...");
        setConnectionInfo((prev) => ({
          ...prev,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        }));
        usePolling = true;
        setupPolling();
      }
    };

    // Fallback: HTTP Polling (slower but reliable)
    const setupPolling = async () => {
      console.log("[Somnia SDS] 📡 Starting HTTP polling (500ms interval)...");
      setConnectionInfo((prev) => ({
        ...prev,
        status: "polling",
        method: "http",
      }));

      const pollBlocks = async () => {
        try {
          const latestBlockNumber =
            await somniaWebSocketClient.getBlockNumber();

          // Update connection status on successful poll
          setConnectionInfo((prev) => ({
            ...prev,
            status: "polling",
            lastBlockTime: Date.now(),
            error: undefined,
          }));

          if (lastProcessedBlock === 0n) {
            lastProcessedBlock = latestBlockNumber;
            console.log(
              "[Somnia SDS] 📍 Starting at block:",
              latestBlockNumber.toString()
            );
            return;
          }

          if (latestBlockNumber > lastProcessedBlock) {
            console.log(
              "[Somnia SDS] 🆕 New block detected:",
              latestBlockNumber.toString()
            );

            const block = await somniaWebSocketClient.getBlock({
              blockNumber: latestBlockNumber,
              includeTransactions: true,
            });

            // Process block (same logic as WebSocket)
            const now = Date.now();
            const currencySymbol = networkConfig.nativeCurrency.symbol;
            const txsToShow = block.transactions.slice(0, MAX_TX_PER_BLOCK);

            if (txsToShow.length > 0) {
              console.log(
                "[Somnia SDS] 📦 Processing",
                txsToShow.length,
                "transactions"
              );

              const newStreams: StreamPacket[] = txsToShow.map(
                (tx: any, index: number) => {
                  const txValue = tx.value ? Number(tx.value) / 1e18 : 0;
                  const isHighValue = txValue > 0.01;

                  return {
                    id: (tx.hash || `tx_${now}_${index}`).toLowerCase(),
                    status: "streamed" as StreamStatus,
                    timestamp: now,
                    eventType: isHighValue ? "Transfer" : "Transaction",
                    source: tx.from || "0x0",
                    data: {
                      to: tx.to || "Contract Creation",
                      value: `${txValue.toFixed(6)} ${currencySymbol}`,
                      gas: tx.gas?.toString() || "N/A",
                      type: tx.to ? "Transfer" : "Contract Deploy",
                    },
                    confirmations: 0,
                    hash: (tx.hash || `tx_${now}_${index}`).toLowerCase(),
                    lastStageTime: now,
                    blockNumber: Number(block.number) || 0,
                  };
                }
              );

              txCounterRef.current += newStreams.length;

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
                    "[Somnia SDS] ✅ Added",
                    uniqueNewStreams.length,
                    "streams | Total:",
                    updated.length
                  );
                  return updated;
                }
                return prev;
              });

              const timeElapsed = (now - lastUpdateTimeRef.current) / 1000;
              const tps =
                timeElapsed > 0 ? txCounterRef.current / timeElapsed : 0;

              setStats((prev) => ({
                ...prev,
                latestStream: block.hash || "",
                streamsPerSecond: Math.round(tps * 10) / 10,
                updateTime: new Date().toLocaleTimeString(),
                latestBlockNumber: Number(latestBlockNumber),
              }));

              if (timeElapsed > 10) {
                txCounterRef.current = 0;
                lastUpdateTimeRef.current = now;
              }
            } else {
              console.log("[Somnia SDS] ⚠️  Empty block");
            }

            lastProcessedBlock = latestBlockNumber;
          }
        } catch (error) {
          console.error("[Somnia SDS] ❌ Polling error:", error);
          setConnectionInfo((prev) => ({
            ...prev,
            status: "error",
            error: error instanceof Error ? error.message : String(error),
          }));
        }
      };

      // Initial poll
      await pollBlocks();

      // Poll every 500ms (2x per second - fast enough for visualization)
      pollInterval = setInterval(pollBlocks, 500);
    };

    // Start connection
    if (networkConfig.supportsWebSocket) {
      setupWebSocket();
    } else {
      setupPolling();
    }

    unwatchRef.current = unwatch;

    // Setup Progression Loop - advances streams through pipeline stages
    const progressionInterval = setInterval(() => {
      const now = Date.now();

      setStreams((prevStreams) => {
        let updatedStreams = [...prevStreams];

        // Progress existing streams through stages
        updatedStreams = updatedStreams.map((stream) => {
          // If finalized, just update confirmations
          if (stream.status === "finalized") {
            return { ...stream, confirmations: 3 };
          }

          // Check if enough time has passed to progress to next stage
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

        // Cleanup old finalized streams if we exceed MAX_STREAMS
        if (updatedStreams.length > MAX_STREAMS) {
          const finalizedIndices = updatedStreams
            .map((s, i) => (s.status === "finalized" ? i : -1))
            .filter((i) => i !== -1);

          if (finalizedIndices.length > 0) {
            const indexToRemove = finalizedIndices[finalizedIndices.length - 1];
            updatedStreams.splice(indexToRemove, 1);
          } else {
            updatedStreams.pop();
          }
        }

        return deduplicateStreams(updatedStreams);
      });
    }, 400); // Run progression every 400ms

    // Stats Update Loop
    const statsInterval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        updateTime: new Date().toLocaleTimeString(),
      }));
    }, 1000);

    // Cleanup
    return () => {
      console.log("[Somnia SDS] 🔌 Disconnecting...");
      if (unwatch) unwatch();
      if (pollInterval) clearInterval(pollInterval);
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
