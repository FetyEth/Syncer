/**
 * Somnia SDS Visualizer - Main Page
 * Premium Redesign
 */

"use client";

import { RetroHeader } from "@/components/RetroHeader";
import { ConsensusFeed } from "@/components/ConsensusFeed";
import { TerminalLog } from "@/components/TerminalLog";
import { StreamInspector } from "@/components/StreamInspector";
import ConnectionStatus from "@/components/ConnectionStatus";
// WORKING VERSION: Fetches real blockchain data from Somnia testnet
import { useSomniaStreams } from "@/hooks/useSomniaStreamsWorking";

export default function Home() {
  const { streams, stats, selectedStream, setSelectedStream, connectionInfo } =
    useSomniaStreams();

  return (
    <main className="h-screen w-screen overflow-hidden relative text-white selection:bg-indigo-500/30 flex flex-col">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* Header (Fixed) */}
      <RetroHeader stats={stats} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden pb-4 lg:pb-6 px-4 lg:px-6 z-10 gap-4 lg:gap-6">
        {/* Left: ConsensusFeed (Main Visualizer) */}
        <div className="flex-[7] relative rounded-2xl overflow-hidden border border-white/5 bg-white/[0.01] shadow-2xl backdrop-blur-sm min-h-[50vh] lg:min-h-0">
          <ConsensusFeed streams={streams} onStreamClick={setSelectedStream} />
        </div>

        {/* Right: TerminalLog (Activity Feed) */}
        <div className="flex-[3] relative rounded-2xl overflow-hidden border border-white/5 shadow-2xl backdrop-blur-sm hidden lg:block">
          <div className="absolute inset-0 flex flex-col">
            {/* Connection Status at top */}
            <div className="p-4 border-b border-cyan-900/30">
              <ConnectionStatus connectionInfo={connectionInfo} />
            </div>

            {/* Terminal Log below */}
            <div className="flex-1 overflow-hidden">
              <TerminalLog streams={streams} />
            </div>
          </div>
        </div>
      </div>

      {/* Stream Inspector Overlay */}
      <StreamInspector
        stream={selectedStream}
        onClose={() => setSelectedStream(null)}
      />
    </main>
  );
}
