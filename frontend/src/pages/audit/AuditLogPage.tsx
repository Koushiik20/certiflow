import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AuditLog } from '../../types';
import { History, Search, ShieldCheck } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [entityFilter, setEntityFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        params: { entityType: entityFilter !== 'ALL' ? entityFilter : undefined }
      });
      setLogs(res.data.auditLogs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <History className="w-6 h-6 text-blue-700" />
            <span>Immutable Audit Trail</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Append-only governance ledger recording every login, upload, approval, rejection, issuance, and revocation.
          </p>
        </div>

        <div className="flex space-x-1.5 bg-white p-1 rounded-xl border">
          {['ALL', 'BATCH', 'CERTIFICATE', 'DELIVERY_JOB', 'AUTH'].map((type) => (
            <button
              key={type}
              onClick={() => setEntityFilter(type)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                entityFilter === type ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-medium">No audit logs recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type & ID</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Details / Delta Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 font-sans">
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 text-xs">{log.entityType}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.entityId}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {log.userRole || 'SYSTEM'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-xs font-mono text-slate-600 max-w-sm truncate">
                      {log.newState || log.metadata || log.previousState || '-'}
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

