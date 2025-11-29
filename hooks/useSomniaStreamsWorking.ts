/**
 * Somnia Streams Hook - Working Implementation
 * Fetches real blockchain data from Somnia testnet
 * Structures it according to SDS schemas for demonstration
 */

"use client";

import { useState, useEffect, useRef } from "react";
import {
  StreamPacket,
  StreamStats,
  StreamStatus,
  ConnectionInfo,
} from "@/types/stream";
import { somniaClient, networkConfig } from "@/lib/somnia-config";

const STAGE_DURATION = 300;
const MAX_STREAMS = 100;
const MAX_TX_PER_BLOCK = 50;
const BLOCK_FETCH_INTERVAL = 3000; // Check for new blocks every 3 seconds

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
    method: "http",
    networkName: networkConfig.chainName,
    rpcUrl: networkConfig.rpcUrl,
  });

  const txCounterRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());
  const lastBlockNumberRef = useRef(0n);

  const getNextStatus = (currentStatus: StreamStatus): StreamStatus => {
    const statusProgression: Record<StreamStatus, StreamStatus> = {
      streamed: "indexed",
      indexed: "consolidated",
      consolidated: "finalized",
      finalized: "finalized",
    };
    return statusProgression[currentStatus];
  };

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

  // Main Effect: Fetch real blockchain data
  useEffect(() => {
    console.log("[Somnia Streams] 🚀 Starting real-time blockchain stream...");
    console.log("[Somnia Streams] 📡 Network:", networkConfig.chainName);
    console.log("[Somnia Streams] 🔗 RPC:", networkConfig.rpcUrl);
    console.log("[Somnia Streams] ✨ Fetching live transaction data...");

    setConnectionInfo({
      status: "connecting",
      method: "http",
      networkName: networkConfig.chainName,
      rpcUrl: networkConfig.rpcUrl,
    });

    const fetchAndProcessBlock = async () => {
      try {
        // Get latest block number
        const latestBlockNumber = await somniaClient.getBlockNumber();

        // Initialize on first run
        if (lastBlockNumberRef.current === 0n) {
          lastBlockNumberRef.current = latestBlockNumber;
          console.log(
            "[Somnia Streams] 📍 Starting from block:",
            latestBlockNumber.toString()
          );
          setConnectionInfo((prev) => ({
            ...prev,
            status: "connected",
            lastBlockTime: Date.now(),
          }));
          return;
        }

        // Process new blocks
        if (latestBlockNumber > lastBlockNumberRef.current) {
          console.log(
            "[Somnia Streams] 🆕 New block detected:",
            latestBlockNumber.toString()
          );

          // Fetch full block with transactions
          const block = await somniaClient.getBlock({
            blockNumber: latestBlockNumber,
            includeTransactions: true,
          });

          const now = Date.now();
          const txsToShow = block.transactions.slice(0, MAX_TX_PER_BLOCK);

          if (txsToShow.length > 0) {
            console.log(
              `[Somnia Streams] ✅ Processing ${txsToShow.length} transactions`
            );

            // Convert transactions to stream packets
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
                    value: `${txValue.toFixed(6)} ${
                      networkConfig.nativeCurrency.symbol
                    }`,
                    gas: tx.gas?.toString() || "N/A",
                    type: tx.to ? "Transfer" : "Contract Deploy",
                    txHash: tx.hash,
                    blockHash: block.hash,
                  },
                  confirmations: 0,
                  hash: (tx.hash || `tx_${now}_${index}`).toLowerCase(),
                  lastStageTime: now,
                  blockNumber: Number(block.number) || 0,
                };
              }
            );

            txCounterRef.current += newStreams.length;

            // Update streams
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
                  `[Somnia Streams] 📊 Added ${uniqueNewStreams.length} streams | Total: ${updated.length}`
                );
                return updated;
              }
              return prev;
            });

            // Update stats
            const timeElapsed = (now - lastUpdateTimeRef.current) / 1000;
            const sps =
              timeElapsed > 0 ? txCounterRef.current / timeElapsed : 0;

            setStats((prev) => ({
              ...prev,
              latestStream: block.hash || "",
              streamsPerSecond: Math.round(sps * 10) / 10,
              updateTime: new Date().toLocaleTimeString(),
              latestBlockNumber: Number(latestBlockNumber),
            }));

            if (timeElapsed > 10) {
              txCounterRef.current = 0;
              lastUpdateTimeRef.current = now;
            }
          } else {
            console.log("[Somnia Streams] ⚠️  Empty block");
          }

          lastBlockNumberRef.current = latestBlockNumber;

          // Update connection status
          setConnectionInfo((prev) => ({
            ...prev,
            status: "connected",
            lastBlockTime: now,
            error: undefined,
          }));
        }
      } catch (error) {
        console.error("[Somnia Streams] ❌ Error fetching block:", error);
        setConnectionInfo((prev) => ({
          ...prev,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        }));
      }
    };

    // Initial fetch
    fetchAndProcessBlock();

    // Set up interval
    const blockFetchInterval = setInterval(
      fetchAndProcessBlock,
      BLOCK_FETCH_INTERVAL
    );

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
      console.log("[Somnia Streams] 🔌 Disconnecting...");
      clearInterval(blockFetchInterval);
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
