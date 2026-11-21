import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Batch } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Send,
  CheckCircle,
  RotateCcw,
  AlertTriangle,
  Award,
  Users,
  ArrowLeft,
  XCircle,
  Flag,
  ShieldCheck,
  Activity
} from 'lucide-react';

export const BatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [forensics, setForensics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'candidates' | 'history' | 'upload'>('candidates');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  // Action modals
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [actionReason, setActionReason] = useState<string>('');
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchBatchDetail();
  }, [id]);

  const fetchBatchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/batches/${id}`);
      setBatch(res.data.batch);
      setForensics(res.data.forensics);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to load batch.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setErrorMsg('');
    setSuccessMsg('');
    setValidationErrors([]);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const res = await api.post(`/batches/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMsg(res.data.message);
      setUploadFile(null);
      setActiveTab('candidates');
      fetchBatchDetail();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
        setErrorMsg(err.response.data.error || 'Validation errors detected.');
      } else {
        setErrorMsg(err.response?.data?.error || 'Failed to upload spreadsheet.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitBatch = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/batches/${id}/submit`);
      setSuccessMsg(res.data.message);
      fetchBatchDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit batch.');
    }
  };

  const handleResubmitBatch = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/batches/${id}/resubmit`);
      setSuccessMsg(res.data.message);
      fetchBatchDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to resubmit batch.');
    }
  };

  const handleDistrictApprove = async () => {
    setActionSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.post(`/batches/${id}/approve`, { comments: actionReason });
      setSuccessMsg(res.data.message);
      setShowApproveModal(false);
      setActionReason('');
      fetchBatchDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to approve batch.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleQualityApprove = async () => {
    setActionSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.post(`/quality/batches/${id}/review`, {
        decision: 'APPROVED',
        comments: actionReason || 'Quality audit cleared.'
      });
      setSuccessMsg(res.data.message);
      setShowApproveModal(false);
      setActionReason('');
      fetchBatchDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to approve quality review.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleStateFinalApprove = async () => {
    setActionSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.post(`/state/batches/${id}/final-approve`, { comments: actionReason });
      setSuccessMsg(res.data.message);
      setShowApproveModal(false);
      setActionReason('');
      fetchBatchDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to provide final approval.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleReturnForCorrection = async () => {
    if (!actionReason || actionReason.trim().length < 5) {
      setErrorMsg('Please enter a return reason (at least 5 characters).');
      return;
    }

    setActionSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.post(`/batches/${id}/return`, { reason: actionReason });
      setSuccessMsg(res.data.message);
      setShowReturnModal(false);
      setActionReason('');
      fetchBatchDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to return batch.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleRejectBatch = async () => {
    if (!actionReason || actionReason.trim().length < 5) {
      setErrorMsg('Please enter a rejection reason.');
      return;
    }

    setActionSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.post(`/batches/${id}/reject`, { reason: actionReason });
      setSuccessMsg(res.data.message);
      setShowRejectModal(false);
      setActionReason('');
      fetchBatchDetail();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to reject batch.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleFlagCandidate = async (candidateId: string) => {
    try {
      await api.put(`/quality/batches/${id}/candidates/${candidateId}/flag`, {
        status: 'FLAGGED',
        reason: 'Flagged for quality audit anomaly.'
      });
      fetchBatchDetail();
    } catch (err) {
      setErrorMsg('Failed to flag candidate.');
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400 text-xs">Loading batch details...</div>;
  }

  if (!batch) {
    return (
      <div className="p-8 text-center">
        <p className="text-rose-600 font-bold text-sm">Batch not found.</p>
        <Link to="/batches" className="text-blue-600 underline text-xs mt-2 inline-block">Back to Batches</Link>
      </div>
    );
  }

  const currentApprovals = (batch.approvals || []).filter(
    (a) => a.revision === batch.currentRevision && !a.isSuperseded && a.decision === 'APPROVED'
  );
  const districtApprovals = currentApprovals.filter((a) => a.role === 'DISTRICT_OFFICER');
  const userHasApproved = districtApprovals.some((a) => a.officerId === user?.id);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      {/* Back button */}
      <div>
        <Link to="/batches" className="text-slate-500 hover:text-slate-800 text-xs flex items-center space-x-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Batches</span>
        </Link>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-rose-600 font-bold ml-2">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Batch Header Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900">{batch.batchNumber}</h1>
              <StatusBadge status={batch.status} size="sm" />
              <span className="text-[11px] font-mono text-slate-500">Rev {batch.currentRevision}</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">{batch.title} • {batch.courseName} ({batch.courseCode})</p>
          </div>

          {/* Quick Action Button for the current role */}
          <div className="flex items-center space-x-2">
            {user?.role === 'TRAINING_CENTRE' && batch.status === 'DRAFT' && (
              <button
                onClick={handleSubmitBatch}
                disabled={batch.candidateCount === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Approval</span>
              </button>
            )}

            {user?.role === 'TRAINING_CENTRE' && batch.status === 'RETURNED' && (
              <button
                onClick={handleResubmitBatch}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs shadow-sm transition flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resubmit Batch</span>
              </button>
            )}

            {user?.role === 'DISTRICT_OFFICER' && batch.status === 'DISTRICT_REVIEW' && (
              <>
                {!userHasApproved ? (
                  <button
                    onClick={() => { setActionReason(''); setShowApproveModal(true); }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition"
                  >
                    Approve ({districtApprovals.length + 1}/2)
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    Approved by you (1/2)
                  </span>
                )}
                <button
                  onClick={() => { setActionReason(''); setShowReturnModal(true); }}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition"
                >
                  Return
                </button>
                <button
                  onClick={() => { setActionReason(''); setShowRejectModal(true); }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition"
                >
                  Reject
                </button>
              </>
            )}

            {user?.role === 'QUALITY_TEAM' && batch.status === 'QUALITY_REVIEW' && (
              <>
                <button
                  onClick={() => { setActionReason(''); setShowApproveModal(true); }}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs shadow-sm transition"
                >
                  Approve Quality Audit
                </button>
                <button
                  onClick={() => { setActionReason(''); setShowReturnModal(true); }}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition"
                >
                  Return
                </button>
              </>
            )}

            {user?.role === 'STATE_OFFICE' && batch.status === 'STATE_REVIEW' && (
              <>
                <button
                  onClick={() => { setActionReason(''); setShowApproveModal(true); }}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-1.5 rounded-lg text-xs shadow-sm transition flex items-center space-x-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Final Approve & Issue</span>
                </button>
                <button
                  onClick={() => { setActionReason(''); setShowReturnModal(true); }}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition"
                >
                  Return
                </button>
              </>
            )}
          </div>
        </div>

        {/* Return Notice if Returned */}
        {batch.status === 'RETURNED' && batch.returnReason && (
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-900 text-xs">
            <span className="font-bold">Returned for Correction:</span> {batch.returnReason}
            <span className="block text-[11px] text-orange-700 mt-0.5">
              (Revision incremented to Rev {batch.currentRevision}. Upload corrected candidates and click Resubmit).
            </span>
          </div>
        )}

        {/* Clean Info Row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Centre: <strong className="text-slate-800">{batch.trainingCentre?.name}</strong></span>
          <span>District: <strong className="text-slate-800">{batch.district?.name}</strong></span>
          <span>Candidates: <strong className="text-slate-800">{batch.candidateCount}</strong></span>
          <span>Dates: <strong className="text-slate-800">{new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.completionDate).toLocaleDateString()}</strong></span>
        </div>
      </div>

      {/* Autonomous AI Fraud & Anomaly Sentinel */}
      {forensics && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                AI Fraud & Anomaly Sentinel
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                forensics.riskLevel === 'HIGH'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : forensics.riskLevel === 'MEDIUM'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                Risk Level: {forensics.riskLevel} (Score: {forensics.riskScore}/100)
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Integrity Confidence: <strong className="text-emerald-700">{forensics.integrityConfidencePercent}%</strong>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80 text-[11px] space-y-1">
            {forensics.findings?.map((finding: string, idx: number) => (
              <div key={idx} className="flex items-start space-x-1.5 text-slate-700">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>{finding}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 text-xs font-medium">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`py-2 px-3 border-b-2 transition ${
            activeTab === 'candidates'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Candidates ({batch.candidates?.length || 0})
        </button>

        {user?.role === 'TRAINING_CENTRE' && ['DRAFT', 'RETURNED'].includes(batch.status) && (
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-3 border-b-2 transition flex items-center space-x-1 ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Spreadsheet</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 px-3 border-b-2 transition ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Approval History ({batch.approvals?.length || 0})
        </button>
      </div>

      {/* TAB 1: Candidates Table */}
      {activeTab === 'candidates' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {(!batch.candidates || batch.candidates.length === 0) ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <p>No candidates uploaded yet.</p>
              {user?.role === 'TRAINING_CENTRE' && ['DRAFT', 'RETURNED'].includes(batch.status) && (
                <button
                  onClick={() => setActiveTab('upload')}
                  className="mt-2 text-blue-600 hover:underline font-semibold text-xs"
                >
                  Upload Excel spreadsheet
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Candidate ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Status</th>
                  {user?.role === 'QUALITY_TEAM' && batch.status === 'QUALITY_REVIEW' && (
                    <th className="py-2.5 px-3 text-right">Audit</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batch.candidates.map((bc, idx) => (
                  <tr key={bc.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{bc.candidate.candidateIdentifier}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{bc.candidate.fullName}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{bc.candidate.phone}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{bc.marks}%</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${bc.result === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {bc.result}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {bc.status === 'FLAGGED' ? (
                        <span className="text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded text-[10px] font-bold">FLAGGED</span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">{bc.status}</span>
                      )}
                    </td>
                    {user?.role === 'QUALITY_TEAM' && batch.status === 'QUALITY_REVIEW' && (
                      <td className="py-2.5 px-3 text-right">
                        {bc.status !== 'FLAGGED' && (
                          <button
                            onClick={() => handleFlagCandidate(bc.candidateId)}
                            className="text-amber-700 hover:text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-medium"
                          >
                            Flag
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 2: Upload Spreadsheet */}
      {activeTab === 'upload' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Upload Spreadsheet (.xlsx, .csv)</h2>
              <p className="text-xs text-slate-500">Atomic validation: zero partial records saved on errors.</p>
            </div>
            
            {/* Quick Sample Downloads */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">Test Samples:</span>
              <a
                href="/samples/sample_valid_candidates.xlsx"
                download="sample_valid_candidates.xlsx"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-medium flex items-center space-x-1"
                title="Download 10 valid passing candidates"
              >
                <Download className="w-3 h-3 text-blue-600" />
                <span>Valid (10)</span>
              </a>
              <a
                href="/samples/sample_large_cohort_55.xlsx"
                download="sample_large_cohort_55.xlsx"
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium flex items-center space-x-1"
                title="Download 55 candidates (triggers Quality Team review)"
              >
                <Download className="w-3 h-3 text-purple-600" />
                <span>Large (55)</span>
              </a>
              <a
                href="/samples/sample_with_validation_errors.xlsx"
                download="sample_with_validation_errors.xlsx"
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1 rounded font-medium flex items-center space-x-1"
                title="Download sample with phone, score & date errors"
              >
                <Download className="w-3 h-3 text-rose-600" />
                <span>With Errors</span>
              </a>
            </div>
          </div>

          <form onSubmit={handleFileUpload} className="space-y-3">
            <div className="border border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50 cursor-pointer hover:bg-slate-100/50 transition">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                id="file-input"
                className="hidden"
              />
              <label htmlFor="file-input" className="cursor-pointer block text-xs">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="font-semibold text-slate-800">
                  {uploadFile ? uploadFile.name : 'Choose spreadsheet file'}
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5">Columns: Name, Phone, Marks, Result, Dates</p>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!uploadFile || uploading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-sm transition disabled:opacity-50"
              >
                {uploading ? 'Validating...' : 'Upload & Validate'}
              </button>
            </div>
          </form>

          {validationErrors.length > 0 && (
            <div className="border border-rose-200 rounded-lg p-3 bg-rose-50 text-xs">
              <p className="font-bold text-rose-800 mb-2">Errors ({validationErrors.length}):</p>
              <ul className="space-y-1 text-slate-700 max-h-40 overflow-y-auto">
                {validationErrors.map((err, i) => (
                  <li key={i}>
                    <strong>Row {err.rowNumber}:</strong> {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Approval Timeline</h2>
          {(!batch.approvals || batch.approvals.length === 0) ? (
            <p className="text-xs text-slate-400">No approvals recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {batch.approvals.map((app) => (
                <div
                  key={app.id}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                    app.isSuperseded ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">{app.officer?.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Rev {app.revision}</span>
                      {app.isSuperseded && (
                        <span className="text-[10px] text-slate-400 italic">(Superseded on return)</span>
                      )}
                    </div>
                    <p className="text-slate-600 mt-0.5">{app.comments || 'No comments'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-[11px] ${app.decision === 'APPROVED' ? 'text-emerald-700' : 'text-orange-700'}`}>
                      {app.decision}
                    </span>
                    <p className="text-[10px] text-slate-400">{new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-slate-900">Confirm Approval</h2>
            <p className="text-slate-600">Approve batch <strong>{batch.batchNumber}</strong> as {user?.role.replace(/_/g, ' ')}?</p>
            <textarea
              rows={2}
              placeholder="Comments (optional)..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-600 outline-none"
            />
            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button onClick={() => setShowApproveModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button
                disabled={actionSubmitting}
                onClick={
                  user?.role === 'DISTRICT_OFFICER'
                    ? handleDistrictApprove
                    : user?.role === 'QUALITY_TEAM'
                    ? handleQualityApprove
                    : handleStateFinalApprove
                }
                className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg shadow-sm"
              >
                {actionSubmitting ? 'Approving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-orange-900">Return for Correction</h2>
            <p className="text-slate-600">Batch revision will increment to Rev {batch.currentRevision + 1}.</p>
            <textarea
              rows={3}
              required
              placeholder="Reason for return..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-orange-600 outline-none"
            />
            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button onClick={() => setShowReturnModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button
                disabled={actionSubmitting}
                onClick={handleReturnForCorrection}
                className="px-3 py-1.5 bg-orange-600 text-white font-bold rounded-lg shadow-sm"
              >
                {actionSubmitting ? 'Returning...' : 'Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-rose-900">Reject Batch</h2>
            <textarea
              rows={3}
              required
              placeholder="Rejection reason..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-rose-600 outline-none"
            />
            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button onClick={() => setShowRejectModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
              <button
                disabled={actionSubmitting}
                onClick={handleRejectBatch}
                className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg shadow-sm"
              >
                {actionSubmitting ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
