import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DeliveryJob } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Send, RefreshCw, AlertCircle, CheckCircle, Smartphone, Clock, WifiOff } from 'lucide-react';

export const DeliveryConsolePage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DeliveryJob[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/deliveries', {
        params: { status: statusFilter !== 'ALL' ? statusFilter : undefined }
      });
      setDeliveries(res.data.deliveries);
      setSummary(res.data.summary || {});
    } catch (err) {
      console.error('Error fetching deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRetry = async (jobId: string) => {
    setRetryingId(jobId);
    setFeedbackMsg('');
    try {
      const res = await api.post(`/deliveries/${jobId}/retry`);
      setFeedbackMsg(res.data.message);
      setTimeout(fetchDeliveries, 1500);
    } catch (err: any) {
      setFeedbackMsg(err.response?.data?.error || 'Failed to trigger retry.');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Send className="w-6 h-6 text-emerald-600" />
            <span>Simulated WhatsApp Delivery Console</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitors real-world delivery simulations with exponential backoff (2s, 4s, 8s), webhook timeouts, and manual retry.
          </p>
        </div>

        <button
          onClick={fetchDeliveries}
          className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl font-semibold">
          {feedbackMsg}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Jobs</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{deliveries.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Delivered</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{summary.DELIVERED || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Retrying (Backoff)</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{summary.RETRYING || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Definitive Failed</span>
          <p className="text-2xl font-black text-rose-700 mt-1">{summary.FAILED || 0}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {['ALL', 'DELIVERED', 'RETRYING', 'FAILED', 'PENDING'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === st
                ? 'bg-slate-900 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-600 border'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading delivery queue...</div>
        ) : deliveries.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-medium">No delivery jobs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Candidate & Phone</th>
                  <th className="py-3 px-4">Certificate ID</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Status & Failure Type</th>
                  <th className="py-3 px-4">Last Error / Simulation Diagnostic</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{job.candidate?.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-1">
                        <Smartphone className="w-3 h-3 text-slate-400" />
                        <span>{job.phone}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {job.certificate?.certificateNumber}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {job.attemptCount} / {job.maxAttempts}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={job.status} size="sm" />
                      {job.failureType !== 'NONE' && (
                        <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                          Type: {job.failureType}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      {job.status === 'DELIVERED' ? (
                        <span className="text-emerald-700 font-medium flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Delivered {job.deliveredAt ? new Date(job.deliveredAt).toLocaleTimeString() : ''}</span>
                        </span>
                      ) : job.lastError ? (
                        <div>
                          <p className="text-[11px] text-rose-800 font-medium">{job.lastError}</p>
                          {job.nextRetryAt && (
                            <p className="text-[10px] text-amber-700 mt-0.5 flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Next attempt: {new Date(job.nextRetryAt).toLocaleTimeString()}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">In queue</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {job.status === 'FAILED' && (
                        <button
                          disabled={retryingId === job.id}
                          onClick={() => handleManualRetry(job.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition"
                        >
                          {retryingId === job.id ? 'Retrying...' : 'Manual Retry'}
                        </button>
                      )}
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

