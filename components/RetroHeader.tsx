/**
 * RetroHeader Component - Somnia SDS Edition
 * Redesigned for a Premium, Human-Generated Aesthetic
 */

"use client";

import { StreamStats } from "@/types/stream";
import { Activity, Zap, Clock, Layers, Box } from "lucide-react";
import { networkConfig } from "@/lib/somnia-config";

interface RetroHeaderProps {
  stats: StreamStats;
}

export function RetroHeader({ stats }: RetroHeaderProps) {
  return (
    <div className="w-full z-50 px-6 py-4 shrink-0">
      <div className="max-w-[1920px] mx-auto">
        <div className="bg-[#050507]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-0">
          {/* Left: Brand & Title */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6 w-full lg:w-auto min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 font-sans flex-wrap">
                  <span className="whitespace-nowrap">SOMNIA SDS</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-[10px] font-medium tracking-wide whitespace-nowrap">
                    VISUALIZER
                  </span>
                </h1>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="whitespace-nowrap">System Operational</span>
                </div>
              </div>
            </div>

            <div className="h-px w-full lg:h-8 lg:w-px bg-white/5 mx-0 lg:mx-2 hidden lg:block" />

            {/* Stats - Horizontal & Clean */}
            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-3 w-full lg:w-auto">
              <StatItem
                icon={<Activity size={14} />}
                label="Throughput"
                value={stats.streamsPerSecond}
                unit="SPS"
                color="text-indigo-400"
              />
              <StatItem
                icon={<Clock size={14} />}
                label="Latency"
                value="12"
                unit="ms"
                color="text-emerald-400"
              />
              <StatItem
                icon={<Layers size={14} />}
                label="Avg Finality"
                value={stats.avgFinalizationTime.toString()}
                unit="s"
                color="text-white"
              />
              <div className="h-8 w-px bg-white/5 mx-2 hidden lg:block" />
              <StatItem
                icon={<Box size={14} />}
                label="Latest Block"
                value={stats.latestBlockNumber.toLocaleString()}
                unit=""
                color="text-amber-400"
              />
              <StatItem
                icon={<Clock size={14} />}
                label="Updated"
                value={stats.updateTime}
                unit=""
                color="text-gray-400"
              />
            </div>
          </div>

          {/* Right: Controls & Legend */}
          <div className="flex items-center justify-between w-full lg:w-auto gap-3 sm:gap-6 mt-2 lg:mt-0 border-t border-white/5 pt-3 lg:border-0 lg:pt-0">
            {/* Legend */}
            <div className="hidden xl:flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/5">
              <LegendItem color="bg-[#0099FF]" label="Streamed" />
              <LegendItem color="bg-[#9D5BD2]" label="Indexed" />
              <LegendItem color="bg-[#FFB02E]" label="Consolidated" />
              <LegendItem color="bg-[#00C896]" label="Finalized" />
            </div>

            {/* Network Status Badge */}
            <div className="relative h-9 pl-3 pr-4 rounded-xl flex items-center gap-2 sm:gap-3 bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              <div className="w-2 h-2 rounded-full shadow-lg bg-emerald-500 animate-pulse shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold tracking-wide text-emerald-400 whitespace-nowrap">
                  LIVE FEED
                </span>
                <span className="text-[9px] text-emerald-300/60 font-medium truncate">
                  {networkConfig.chainName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 group cursor-default min-w-0">
      <div
        className={`p-2 rounded-lg bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-colors shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5 truncate">
          {label}
        </div>
        <div
          className={`text-xs sm:text-sm font-bold font-mono ${color} flex items-baseline gap-1 whitespace-nowrap`}
        >
          {value}
          <span className="text-[10px] text-gray-500 font-sans font-medium">
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors cursor-default">
      <div
        className={`w-1.5 h-1.5 rounded-full ${color} shadow-[0_0_8px_rgba(0,0,0,0.3)]`}
      />
      <span className="text-[10px] font-medium text-gray-400">{label}</span>
    </div>
  );
}
