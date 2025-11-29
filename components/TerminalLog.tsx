/**
 * TerminalLog Component - Somnia SDS Edition
 * Redesigned as a Premium System Activity Feed
 */

'use client';

import { useEffect, useRef } from 'react';
import { StreamPacket } from '@/types/stream';
import { Terminal } from 'lucide-react';

interface TerminalLogProps {
    streams: StreamPacket[];
}

export function TerminalLog({ streams }: TerminalLogProps) {
    const logEndRef = useRef<HTMLDivElement>(null);
    const logEntriesRef = useRef<Array<{ time: string; stream: StreamPacket }>>([]);
    const loggedEventsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        // Add new streams to log
        streams.forEach(stream => {
            const eventKey = `${stream.id}-${stream.status}`;

            if (!loggedEventsRef.current.has(eventKey)) {
                loggedEventsRef.current.add(eventKey);

                logEntriesRef.current.unshift({
                    time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    stream: { ...stream }, // Snapshot the stream state
                });
            }
        });

        // Keep only last 50 entries
        if (logEntriesRef.current.length > 50) {
            logEntriesRef.current = logEntriesRef.current.slice(0, 50);
        }
    }, [streams]);

    return (
        <div className="h-full flex flex-col bg-[#050507] border-l border-white/5">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                    <Terminal size={14} className="text-indigo-400" />
                    <span className="text-xs font-bold tracking-wider text-gray-300 uppercase">System Activity</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-medium text-emerald-500">LIVE</span>
                </div>
            </div>

            {/* Log Content */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="flex flex-col-reverse gap-2">
                    {/* Active Cursor Line */}
                    <div className="flex items-center gap-2 text-gray-600 opacity-50 mb-2 px-2">
                        <span>➜</span>
                        <span className="cursor-blink w-1.5 h-4 bg-indigo-500 block" />
                    </div>

                    {logEntriesRef.current.map((entry, index) => (
                        <LogEntry key={`${entry.stream.id}-${index}`} entry={entry} />
                    ))}

                    <div ref={logEndRef} />
                </div>
            </div>
        </div>
    );
}

function LogEntry({ entry }: { entry: { time: string; stream: StreamPacket } }) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'streamed': return 'text-[#0099FF] bg-[#0099FF]/10 border-[#0099FF]/20';
            case 'indexed': return 'text-[#9D5BD2] bg-[#9D5BD2]/10 border-[#9D5BD2]/20';
            case 'consolidated': return 'text-[#FFB02E] bg-[#FFB02E]/10 border-[#FFB02E]/20';
            case 'finalized': return 'text-[#00C896] bg-[#00C896]/10 border-[#00C896]/20';
            default: return 'text-gray-400 bg-gray-800/50 border-gray-700';
        }
    };

    const statusStyle = getStatusColor(entry.stream.status);

    return (
        <div className="group flex items-center gap-2 p-1.5 hover:bg-white/[0.03] transition-all duration-200 border border-transparent hover:border-white/5 animate-fade-in font-mono text-xs leading-relaxed">
            {/* Time */}
            <div className="text-gray-500 shrink-0 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                [{entry.time}]
            </div>

            {/* Status */}
            <div className={`font-bold uppercase shrink-0 ${statusStyle} drop-shadow-[0_0_8px_currentColor]`}>
                [{entry.stream.status}]
            </div>

            {/* Event Type */}
            <div className="font-medium text-gray-300 shrink-0 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                [{entry.stream.eventType}]
            </div>

            {/* ID */}
            <div className="text-indigo-400/80 shrink-0 drop-shadow-[0_0_5px_rgba(129,140,248,0.4)]">
                [ID:{entry.stream.id.slice(-6)}]
            </div>

            {/* Data */}
            <div className="text-gray-500 truncate min-w-0 flex-1 opacity-60 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_3px_rgba(255,255,255,0.2)]">
                {JSON.stringify(entry.stream.data)}
            </div>
        </div>
    );
}
