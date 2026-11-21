import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Batch } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import { Plus, Search, ArrowRight } from 'lucide-react';

export const BatchListPage: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form
  const [newTitle, setNewTitle] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newCompletionDate, setNewCompletionDate] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    fetchBatches();
  }, [statusFilter]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/batches', {
        params: {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: searchTerm || undefined,
        }
      });
      setBatches(res.data.batches);
    } catch (err) {
      console.error('Error fetching batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSubmitting(true);
    try {
      await api.post('/batches', {
        title: newTitle,
        courseName: newCourseName,
        courseCode: newCourseCode,
        startDate: newStartDate,
        completionDate: newCompletionDate,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewCourseName('');
      setNewCourseCode('');
      fetchBatches();
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Failed to create batch.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const filtered = batches.filter((b) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      b.batchNumber.toLowerCase().includes(q) ||
      b.title.toLowerCase().includes(q) ||
      b.courseName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Batches</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and track skilling batches through review stages.</p>
        </div>

        {user?.role === 'TRAINING_CENTRE' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 rounded-lg text-xs shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Batch</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1">
          {['ALL', 'DRAFT', 'DISTRICT_REVIEW', 'QUALITY_REVIEW', 'STATE_REVIEW', 'ISSUED', 'RETURNED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search batches..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading batches...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">No batches found.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-4">Batch</th>
                <th className="py-2.5 px-4">Course</th>
                <th className="py-2.5 px-4">Candidates</th>
                <th className="py-2.5 px-4">Revision</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{b.batchNumber}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs">{b.title}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{b.courseName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{b.courseCode}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {b.candidateCount}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    Rev {b.currentRevision}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={b.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/batches/${b.id}`}
                      className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-sm font-bold text-slate-900">Create Batch</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {createError && <p className="text-rose-600 text-xs">{createError}</p>}

            <form onSubmit={handleCreateBatch} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Batch Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solar PV Installer Batch 1"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Course Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Certified Solar PV Installer"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="SOL-201"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg focus:ring-1 focus:ring-blue-600 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Completion Date</label>
                  <input
                    type="date"
                    required
                    value={newCompletionDate}
                    onChange={(e) => setNewCompletionDate(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-3.5 py-1.5 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
