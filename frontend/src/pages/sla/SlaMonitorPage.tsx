import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Batch } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ClockAlert, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SlaMonitorPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchSlaData();
  }, []);

  const fetchSlaData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sla/monitor');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load SLA monitor:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <ClockAlert className="w-6 h-6 text-amber-600" />
            <span>SLA Monitoring & Escalation Dashboard</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tracks turnaround benchmarks per workflow stage: District (24h), Quality (12h), State (24h).
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>Overdue Batches: {data?.summary?.overdueCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Target Benchmarks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="font-bold uppercase text-slate-400">District Review SLA</span>
          <p className="text-xl font-black text-slate-900 mt-1">24 Hours</p>
          <p className="text-slate-500 text-[11px] mt-0.5">Mandates two distinct district officer approvals</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="font-bold uppercase text-slate-400">Quality Audit SLA</span>
          <p className="text-xl font-black text-slate-900 mt-1">12 Hours</p>
          <p className="text-slate-500 text-[11px] mt-0.5">Applies to cohorts &gt; 50 candidates</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="font-bold uppercase text-slate-400">State Final Approval SLA</span>
          <p className="text-xl font-black text-slate-900 mt-1">24 Hours</p>
          <p className="text-slate-500 text-[11px] mt-0.5">Final authorization before background issuance</p>
        </div>
      </div>

      {/* In-Flight Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-base font-bold text-slate-900">
            Active Review Queues ({data?.batches?.length || 0} Batches in Process)
          </h2>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading SLA monitor...</div>
        ) : !data?.batches || data.batches.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-medium">No active review batches.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Batch ID & Title</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4">Elapsed Time</th>
                  <th className="py-3 px-4">SLA Target</th>
                  <th className="py-3 px-4">Remaining Window</th>
                  <th className="py-3 px-4">SLA Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.batches.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{b.batchNumber}</div>
                      <div className="text-[11px] text-slate-500">{b.title}</div>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={b.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {b.elapsedHours}h
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {b.slaTargetHours}h max
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold">
                      {b.remainingHours > 0 ? (
                        <span className="text-slate-700">{b.remainingHours}h remaining</span>
                      ) : (
                        <span className="text-rose-700 font-bold">0h (Overdue)</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {b.isOverdue ? (
                        <span className="inline-flex items-center text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                          <AlertTriangle className="w-3 h-3 mr-1" /> OVERDUE
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> ON TRACK
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/batches/${b.id}`}
                        className="inline-flex items-center space-x-1 font-bold text-blue-700 hover:text-blue-900 text-xs"
                      >
                        <span>Audit</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

