/**
 * ConsensusFeed Component - Somnia SDS Edition
 * Visualizes streams with a Non-Overlapping Grid Stack Layout
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { StreamPacket, StreamStatus } from "@/types/stream";
import { Database, Layers, CheckCircle, Box } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface ConsensusFeedProps {
  streams: StreamPacket[];
  onStreamClick: (stream: StreamPacket) => void;
}

// Configuration for the grid layout
// COLUMNS will be dynamic
const ROW_HEIGHT = 42; // px
const CAPSULE_WIDTH = 220; // px
const STAGE_CONFIG = {
  streamed: {
    baseY: 2,
    label: "STREAMED",
    color: "text-[#0099FF]",
    glow: "shadow-[0_0_15px_rgba(0,153,255,0.3)]",
  },
  indexed: {
    baseY: 22,
    label: "INDEXED",
    color: "text-[#9D5BD2]",
    glow: "shadow-[0_0_15px_rgba(157,91,210,0.3)]",
  },
  consolidated: {
    baseY: 42,
    label: "CONSOLIDATED",
    color: "text-[#FFB02E]",
    glow: "shadow-[0_0_15px_rgba(255,176,46,0.3)]",
  },
  finalized: {
    baseY: 62,
    label: "FINALIZED",
    color: "text-[#00C896]",
    glow: "shadow-[0_0_15px_rgba(0,200,150,0.3)]",
  },
};

export function ConsensusFeed({ streams, onStreamClick }: ConsensusFeedProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const columns = isMobile ? 1 : isTablet ? 2 : 4;

  // Helper to calculate position based on status and index
  const getPosition = (status: StreamStatus, index: number) => {
    const config = STAGE_CONFIG[status];

    // Calculate grid position
    const col = index % columns;
    const row = Math.floor(index / columns);

    // Calculate coordinates
    // Center the grid horizontally
    // Total width of grid = COLUMNS * CAPSULE_WIDTH + Gaps
    // But let's use percentage for X to be responsive, and px for Y to stack neatly

    // Using percentage for X:
    const widthPerCol = 100 / columns;
    const left = col * widthPerCol + widthPerCol / 2; // Center of the column

    // Y position: Base % + (row * fixed px converted to % approx or just use calc)
    // Let's use calc in style
    const topBase = config.baseY;
    const topOffset = row * 5; // 5% vertical spacing per row approx?
    // Better to use calc(35% + 50px)

    // Use larger vertical spacing for finalized blocks to add gap
    const rowHeight = status === "finalized" ? 55 : 45;

    return {
      left: `${left}%`,
      top: `calc(${topBase}% + ${row * rowHeight}px + 40px)`, // +40px to clear the label with more gap
    };
  };

  // Safety: Deduplicate streams by ID before rendering to prevent key collisions
  const uniqueStreams = Array.from(
    new Map(streams.map((s) => [s.id, s])).values()
  );

  // Group streams by status to determine their index
  const streamsByStatus = {
    streamed: uniqueStreams.filter((s) => s.status === "streamed"),
    indexed: uniqueStreams.filter((s) => s.status === "indexed"),
    consolidated: uniqueStreams.filter((s) => s.status === "consolidated"),
    finalized: uniqueStreams.filter((s) => s.status === "finalized"),
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050507]">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

      {/* Vertical Lane Dividers (Optional, for structure) */}
      <div className="absolute inset-0 flex justify-between px-[12.5%] pointer-events-none opacity-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-full w-px bg-white" />
        ))}
      </div>

      {/* Stage Indicators */}
      {Object.entries(STAGE_CONFIG).map(([key, config]) => (
        <StageLine
          key={key}
          top={`${config.baseY}%`}
          label={config.label}
          color={config.color}
          glow={config.glow}
        />
      ))}

      {/* Streams Container */}
      <div className="absolute inset-0 z-10">
        {/* Empty State */}
        {uniqueStreams.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md px-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <Database className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  Waiting for Blocks...
                </h3>
                <p className="text-sm text-gray-400">
                  Listening for new transactions on Somnia Network
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  Check connection status in the right panel →
                </p>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {uniqueStreams.map((stream) => {
            // Find index in its group
            const group = streamsByStatus[stream.status];
            const index = group.findIndex((s) => s.id === stream.id);

            // Safety check if not found (shouldn't happen)
            if (index === -1) return null;

            const pos = getPosition(stream.status, index);

            return (
              <motion.div
                key={stream.id}
                layoutId={`stream-${stream.id}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  left: pos.left,
                  top: pos.top,
                  opacity: stream.status === "finalized" && index > 11 ? 0 : 1, // Show up to 12 finalized blocks (3 rows)
                  scale: 1,
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                  mass: 1,
                }}
                className="absolute cursor-pointer -translate-x-1/2"
                style={{ width: "20%" }} // Fixed width relative to container
                onClick={() => onStreamClick(stream)}
              >
                <StreamCapsule stream={stream} status={stream.status} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StageLine({
  top,
  label,
  color,
  glow,
}: {
  top: string;
  label: string;
  color: string;
  glow: string;
}) {
  return (
    <div
      className="absolute w-full flex justify-center items-center group z-0"
      style={{ top }}
    >
      {/* The Horizontal Line */}
      <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* The Label */}
      <div
        className={`relative px-4 py-1.5 rounded-full bg-[#050507] border border-white/10 ${color} text-[10px] font-bold tracking-widest flex items-center gap-2 ${glow} z-10 shadow-xl`}
      >
        <div className={`w-1.5 h-1.5 rounded-full bg-current animate-pulse`} />
        {label}
      </div>
    </div>
  );
}

function StreamCapsule({
  stream,
  status,
}: {
  stream: StreamPacket;
  status: StreamStatus;
}) {
  const statusConfig = {
    streamed: {
      border: "border-[#0099FF]/40",
      bg: "bg-[#0099FF]/20",
      text: "text-[#0099FF]",
      glow: "shadow-[0_0_30px_rgba(0,153,255,0.4)]",
      icon: <Box size={14} />,
    },
    indexed: {
      border: "border-[#9D5BD2]/40",
      bg: "bg-[#9D5BD2]/20",
      text: "text-[#9D5BD2]",
      glow: "shadow-[0_0_30px_rgba(157,91,210,0.4)]",
      icon: <Database size={14} />,
    },
    consolidated: {
      border: "border-[#FFB02E]/40",
      bg: "bg-[#FFB02E]/20",
      text: "text-[#FFB02E]",
      glow: "shadow-[0_0_30px_rgba(255,176,46,0.4)]",
      icon: <Layers size={14} />,
    },
    finalized: {
      border: "border-[#00C896]/40",
      bg: "bg-[#00C896]/20",
      text: "text-[#00C896]",
      glow: "shadow-[0_0_30px_rgba(0,200,150,0.4)]",
      icon: <CheckCircle size={14} />,
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`
                relative px-3 py-2 rounded-xl border backdrop-blur-md
                ${config.border} ${config.bg} ${config.glow}
                hover:scale-105 hover:brightness-110 transition-all duration-200
                group w-full flex items-center gap-3
            `}
    >
      {/* Icon Circle */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center bg-black/30 ${config.text} shrink-0`}
      >
        {config.icon}
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0 overflow-hidden">
        <span
          className={`font-bold text-xs tracking-tight text-white group-hover:text-white/90 uppercase truncate`}
        >
          {stream.eventType}
        </span>
        <span
          className={`text-[10px] font-mono opacity-60 ${config.text} truncate`}
        >
          #{stream.id.slice(-6)}
        </span>
      </div>

      {/* Status Dot */}
      <div
        className={`ml-auto w-1.5 h-1.5 rounded-full ${config.text} bg-current shadow-[0_0_8px_currentColor] shrink-0`}
      />

      {/* Block Number Badge */}
      <div
        className={`absolute -top-2 -right-1 px-2 py-0.5 rounded-md bg-[#0A0A0F] border ${config.border} text-xs font-bold font-mono text-white shadow-sm z-10 flex items-center gap-1`}
      >
        <span className={`text-[9px] opacity-70 ${config.text}`}>BLK</span>
        {stream.blockNumber}
      </div>
    </div>
  );
}
