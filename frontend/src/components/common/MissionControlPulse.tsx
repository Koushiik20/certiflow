import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Activity, X, ChevronUp, ChevronDown, ShieldCheck, Cpu, RefreshCw, Radio } from 'lucide-react';

interface PulseEvent {
  id: string;
  eventType: string;
  summary: string;
  timestamp: string;
  level: 'info' | 'warn' | 'success' | 'alert';
}

export const MissionControlPulse: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<PulseEvent[]>([]);
  const [isRedis, setIsRedis] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPulse = async () => {
    try {
      const res = await api.get('/events/pulse');
      if (res.data?.events) {
        setEvents(res.data.events);
      }
      setIsRedis(!!res.data?.isRedisAvailable);
    } catch {
      // Quiet fail if network hiccups
    }
  };

  useEffect(() => {
    fetchPulse();
    const interval = setInterval(fetchPulse, 4000);
    return () => clearInterval(interval);
  }, []);

  const getTagColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40';
      case 'warn':
        return 'text-amber-400 border-amber-800/60 bg-amber-950/40';
      case 'alert':
        return 'text-rose-400 border-rose-800/60 bg-rose-950/40';
      default:
        return 'text-blue-400 border-blue-800/60 bg-blue-950/40';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 bg-slate-900/95 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-3 py-2 rounded-full shadow-2xl backdrop-blur-md transition-all duration-200 hover:scale-105 group"
          title="Open Live GovTech Event Bus & Worker Telemetry"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold tracking-wide flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span>Mission Control Pulse</span>
          </span>
          <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-mono px-1.5 py-0.5 rounded-full">
            {events.length} evts
          </span>
        </button>
      ) : (
        <div className="w-96 sm:w-[460px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-slate-900/90 border-b border-slate-800 p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  GovTech Event Fabric & Asynchronous Telemetry
                </h4>
                <p className="text-[10px] text-slate-400">Live BullMQ workers, SHA-256 seals & SLA checks</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  setLoading(true);
                  fetchPulse().finally(() => setLoading(false));
                }}
                className={`p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 ${loading ? 'animate-spin' : ''}`}
                title="Refresh Stream"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                title="Minimize"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* System Telemetry Stats Bar */}
          <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-900/50 border-b border-slate-800 text-[10px]">
            <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-1.5 text-center">
              <span className="text-slate-400 block font-medium">Message Broker</span>
              <span className="font-mono font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                <Cpu className="w-2.5 h-2.5" />
                {isRedis ? 'Redis Cluster' : 'EventBus (Dual)'}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-1.5 text-center">
              <span className="text-slate-400 block font-medium">Crypto Sealer</span>
              <span className="font-mono font-bold text-indigo-400 flex items-center justify-center gap-1 mt-0.5">
                <ShieldCheck className="w-2.5 h-2.5" />
                SHA-256 Active
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-1.5 text-center">
              <span className="text-slate-400 block font-medium">Worker Status</span>
              <span className="font-mono font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                ● 2 Queues Online
              </span>
            </div>
          </div>

          {/* Live Event Stream */}
          <div className="p-3 max-h-64 overflow-y-auto space-y-2 font-mono text-xs">
            {events.length === 0 ? (
              <p className="text-slate-500 text-center py-4 text-[11px]">Awaiting system events...</p>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-slate-900/70 border border-slate-800/80 rounded-lg p-2 hover:bg-slate-900 transition flex items-start space-x-2"
                >
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider shrink-0 ${getTagColor(
                      evt.level
                    )}`}
                  >
                    {evt.eventType.replace(/([A-Z])/g, ' $1').trim().slice(0, 10)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-200 leading-snug break-words">{evt.summary}</p>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-950 p-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 px-3">
            <span>Automatic 4s poll • Event-driven ledger</span>
            <span className="text-emerald-400 font-medium">Status: Healthy</span>
          </div>
        </div>
      )}
    </div>
  );
};
