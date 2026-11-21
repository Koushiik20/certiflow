import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Batch } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import {
  FolderPlus,
  Search,
  Filter,
  ArrowRight,
  Users,
  AlertTriangle,
  RotateCcw,
  Clock,
  Building2,
  Calendar
} from 'lucide-react';

export const BatchListPage: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Create Batch Form State
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
          status: statusFilter,
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

  const filteredBatches = batches.filter((b) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.batchNumber.toLowerCase().includes(term) ||
      b.title.toLowerCase().includes(term) ||
      b.courseName.toLowerCase().includes(term) ||
      b.courseCode.toLowerCase().includes(term)
    );
  });

  const statuses = [
    'ALL',
    'DRAFT',
    'DISTRICT_REVIEW',
    'QUALITY_REVIEW',
    'STATE_REVIEW',
    'ISSUED',
    'RETURNED',
    'REJECTED'
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Skilling Candidate Batches</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage batches through creation, validation, multi-tier approvals, and issuance.
          </p>
        </div>

        {user?.role === 'TRAINING_CENTRE' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-700/20 transition"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create New Batch</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Status Pill Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, title, course..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading batches...</div>
        ) : filteredBatches.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-slate-400 font-medium">No candidate batches found for this criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Batch ID & Title</th>
                  <th className="py-3 px-4">Course & Centre</th>
                  <th className="py-3 px-4">Candidates</th>
                  <th className="py-3 px-4">Revision</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-blue-700 transition">
                        {b.batchNumber}
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-1">{b.title}</div>
                      {b.isOverdue && (
                        <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded mt-1 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 mr-0.5" /> SLA Overdue
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 text-xs">{b.courseName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {b.courseCode} • {b.trainingCentre?.name || 'District TC'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.candidateCount}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        Rev {b.currentRevision}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/batches/${b.id}`}
                        className="inline-flex items-center space-x-1 font-bold text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition"
                      >
                        <span>Inspect</span>
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

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-black text-slate-900">Create New Candidate Batch</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Batch Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solar PV Installer Cohort 1"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Certified Solar PV Installer"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="SOL-201"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Training Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Completion Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newCompletionDate}
                    onChange={(e) => setNewCompletionDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 text-sm font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-md transition disabled:opacity-50"
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

