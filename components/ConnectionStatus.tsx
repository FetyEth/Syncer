/**
 * Connection Status Component
 * Shows real-time connection diagnostics
 */

"use client";

import { ConnectionInfo } from "@/types/stream";
import { Wifi, WifiOff, Activity, AlertCircle, Radio } from "lucide-react";

interface ConnectionStatusProps {
  connectionInfo: ConnectionInfo;
}

export default function ConnectionStatus({
  connectionInfo,
}: ConnectionStatusProps) {
  const { status, method, error, lastBlockTime, networkName, rpcUrl } =
    connectionInfo;

  // Calculate time since last block
  const timeSinceLastBlock = lastBlockTime
    ? Math.floor((Date.now() - lastBlockTime) / 1000)
    : null;

  // Status color and icon
  const getStatusDisplay = () => {
    switch (status) {
      case "connected":
        return {
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          icon: <Wifi className="w-3 h-3" />,
          text: "Connected",
        };
      case "polling":
        return {
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
          icon: <Radio className="w-3 h-3" />,
          text: "Polling",
        };
      case "connecting":
        return {
          color: "text-blue-400",
          bgColor: "bg-blue-500/20",
          icon: <Activity className="w-3 h-3 animate-pulse" />,
          text: "Connecting",
        };
      case "error":
        return {
          color: "text-red-400",
          bgColor: "bg-red-500/20",
          icon: <AlertCircle className="w-3 h-3" />,
          text: "Error",
        };
      case "disconnected":
        return {
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
          icon: <WifiOff className="w-3 h-3" />,
          text: "Disconnected",
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="border border-cyan-900/50 rounded-lg p-3 bg-black/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded ${statusDisplay.bgColor}`}
        >
          <span className={statusDisplay.color}>{statusDisplay.icon}</span>
          <span className={`text-xs font-mono ${statusDisplay.color}`}>
            {statusDisplay.text}
          </span>
        </div>
      </div>

      <div className="space-y-1 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-gray-500">Network:</span>
          <span className="text-cyan-400">{networkName}</span>
        </div>

        {timeSinceLastBlock !== null && (
          <div className="flex justify-between">
            <span className="text-gray-500">Last Block:</span>
            <span
              className={
                timeSinceLastBlock > 30 ? "text-yellow-400" : "text-green-400"
              }
            >
              {timeSinceLastBlock}s ago
            </span>
          </div>
        )}

        {error && (
          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
            <div className="text-red-400 text-xs break-all">{error}</div>
          </div>
        )}

        {status === "error" && (
          <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
            <div className="text-yellow-300 text-xs">
              💡 Troubleshooting:
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li>Check if testnet is active</li>
                <li>Verify RPC URL is accessible</li>
                <li>Check browser console for details</li>
              </ul>
            </div>
          </div>
        )}

        <details className="mt-2">
          <summary className="text-gray-500 cursor-pointer hover:text-cyan-400 transition-colors">
            Details
          </summary>
          <div className="mt-2 p-2 bg-gray-900/50 rounded text-xs space-y-1">
            <div className="break-all">
              <span className="text-gray-500">RPC:</span>{" "}
              <span className="text-gray-300">{rpcUrl}</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
