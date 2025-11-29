/**
 * StreamInspector Component - Somnia SDS Edition
 * Redesigned with Premium Glassmorphism and Detail
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Hash, Database, Clock, Shield, ExternalLink } from 'lucide-react';
import { StreamPacket } from '@/types/stream';
import { useState } from 'react';

interface StreamInspectorProps {
    stream: StreamPacket | null;
    onClose: () => void;
}

export function StreamInspector({ stream, onClose }: StreamInspectorProps) {
    if (!stream) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="absolute right-0 top-0 h-full w-full md:w-[600px] glass-panel-heavy z-50 flex flex-col shadow-2xl"
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-white/5">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight font-sans">
                            Stream Details
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400">
                                ID: {stream.id}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Data Content */}
                <div className="flex-1 overflow-y-auto p-8 terminal-scrollbar">
                    <div className="space-y-8">
                        {/* Status Section */}
                        <div className="space-y-3">
                            <SectionLabel label="Current Status" />
                            <div className="flex items-center gap-3">
                                <StatusBadge status={stream.status} />
                                <a
                                    href={`https://shannon-explorer.somnia.network/tx/${stream.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 font-bold text-sm transition-all group"
                                >
                                    <span>View on Explorer</span>
                                    <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                            </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                            <InfoCard
                                icon={<Database size={16} />}
                                label="Event Type"
                                value={stream.eventType}
                            />
                            <InfoCard
                                icon={<Shield size={16} />}
                                label="Confirmations"
                                value={stream.confirmations.toString()}
                            />
                        </div>

                        {/* Technical Details */}
                        <div className="space-y-4">
                            <SectionLabel label="Technical Details" />

                            <CopyableField
                                label="Block Number"
                                value={stream.blockNumber.toString()}
                                icon={<Database size={14} />}
                            />

                            <CopyableField
                                label="Source Address"
                                value={stream.source}
                                icon={<Hash size={14} />}
                            />

                            <CopyableField
                                label="Stream Hash"
                                value={stream.hash}
                                icon={<Hash size={14} />}
                            />
                        </div>

                        {/* Payload Data */}
                        <div className="space-y-3">
                            <SectionLabel label="Payload Data" />
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative p-6 rounded-xl bg-[#050507] border border-white/10 font-mono text-xs overflow-x-auto">
                                    <pre className="text-emerald-400 leading-relaxed">
                                        {JSON.stringify(stream.data, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center justify-between text-xs font-medium text-gray-500 pt-6 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <Clock size={14} />
                                <span>Timestamp</span>
                            </div>
                            <span className="font-mono text-gray-400">{new Date(stream.timestamp).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function SectionLabel({ label }: { label: string }) {
    return (
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            {label}
        </h3>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        streamed: 'bg-[#0099FF]/10 text-[#0099FF] border-[#0099FF]/20',
        indexed: 'bg-[#9D5BD2]/10 text-[#9D5BD2] border-[#9D5BD2]/20',
        consolidated: 'bg-[#FFB02E]/10 text-[#FFB02E] border-[#FFB02E]/20',
        finalized: 'bg-[#00C896]/10 text-[#00C896] border-[#00C896]/20',
    }[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';

    return (
        <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg border ${styles}`}>
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-wide">{status}</span>
        </div>
    );
}

function InfoCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors group">
            <div className="flex items-center gap-2 text-gray-500 mb-2 group-hover:text-indigo-400 transition-colors">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <div className="font-sans text-lg font-bold text-white">{value}</div>
        </div>
    );
}

function CopyableField({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors group">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-500">
                    {icon}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="text-gray-500 hover:text-white transition-colors"
                >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
            </div>
            <div className="font-mono text-xs text-indigo-300 break-all select-all">
                {value}
            </div>
        </div>
    );
}
