import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Batch, BatchCandidate, Approval } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Send,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Award,
  Users,
  ShieldCheck,
  Flag,
  ArrowLeft,
  Calendar,
  Building,
  MapPin,
  Clock
} from 'lucide-react';

export const BatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
      fetchBatchDetail();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
        setErrorMsg(err.response.data.error || 'Validation errors detected in spreadsheet.');
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
        comments: actionReason || 'Quality standards audit verified.'
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
      setErrorMsg('Please provide a specific justification reason for returning the batch (at least 5 characters).');
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
      setErrorMsg('Please provide a specific justification reason for rejecting the batch.');
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
        reason: 'Flagged for suspicious marks or attendance anomaly.'
      });
      fetchBatchDetail();
    } catch (err: any) {
      setErrorMsg('Failed to flag candidate.');
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading batch details...</div>;
  }

  if (!batch) {
    return (
      <div className="p-8 text-center">
        <p className="text-rose-600 font-bold">Batch not found.</p>
        <Link to="/batches" className="text-blue-600 underline text-sm mt-2 inline-block">
          Return to Batches
        </Link>
      </div>
    );
  }

  // Calculate current revision approvals
  const currentApprovals = (batch.approvals || []).filter(
    (a) => a.revision === batch.currentRevision && !a.isSuperseded && a.decision === 'APPROVED'
  );
  const districtApprovals = currentApprovals.filter((a) => a.role === 'DISTRICT_OFFICER');
  const userHasApproved = districtApprovals.some((a) => a.officerId === user?.id);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-slate-500">
        <Link to="/batches" className="hover:text-blue-700 flex items-center space-x-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Batches Directory</span>
        </Link>
        <span>/</span>
        <span className="font-mono font-bold text-slate-800">{batch.batchNumber}</span>
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-bold">Action Alert</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start space-x-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <p className="font-bold">Success</p>
            <p>{successMsg}</p>
          </div>
        </div>
      )}

      {/* Main Batch Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{batch.batchNumber}</h1>
              <StatusBadge status={batch.status} size="lg" />
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border">
                Revision {batch.currentRevision}
              </span>
            </div>
            <p className="text-base text-slate-700 font-semibold mt-1">{batch.title}</p>
          </div>

          {/* Role-Specific Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* TRAINING CENTRE ACTIONS */}
            {user?.role === 'TRAINING_CENTRE' && batch.status === 'DRAFT' && (
              <button
                onClick={handleSubmitBatch}
                disabled={batch.candidateCount === 0}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Submit for District Review</span>
              </button>
            )}

            {user?.role === 'TRAINING_CENTRE' && batch.status === 'RETURNED' && (
              <button
                onClick={handleResubmitBatch}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-md transition flex items-center space-x-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Resubmit Corrected Batch</span>
              </button>
            )}

            {/* DISTRICT OFFICER ACTIONS */}
            {user?.role === 'DISTRICT_OFFICER' && batch.status === 'DISTRICT_REVIEW' && (
              <>
                {!userHasApproved ? (
                  <button
                    onClick={() => {
                      setActionReason('');
                      setShowApproveModal(true);
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-md transition flex items-center space-x-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve Batch (Officer {districtApprovals.length + 1}/2)</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-300 flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>You Approved this Revision. Awaiting 2nd Officer.</span>
                  </span>
                )}

                <button
                  onClick={() => {
                    setActionReason('');
                    setShowReturnModal(true);
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-2 rounded-xl text-sm shadow-sm transition flex items-center space-x-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Return for Correction</span>
                </button>

                <button
                  onClick={() => {
                    setActionReason('');
                    setShowRejectModal(true);
                  }}
                  className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-3 py-2 rounded-xl text-sm shadow-sm transition flex items-center space-x-1"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </>
            )}

            {/* QUALITY TEAM ACTIONS */}
            {user?.role === 'QUALITY_TEAM' && batch.status === 'QUALITY_REVIEW' && (
              <>
                <button
                  onClick={() => {
                    setActionReason('');
                    setShowApproveModal(true);
                  }}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-md transition flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approve Quality Audit</span>
                </button>

                <button
                  onClick={() => {
                    setActionReason('');
                    setShowReturnModal(true);
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-2 rounded-xl text-sm shadow-sm transition flex items-center space-x-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Return for Correction</span>
                </button>
              </>
            )}

            {/* STATE OFFICE ACTIONS */}
            {user?.role === 'STATE_OFFICE' && batch.status === 'STATE_REVIEW' && (
              <>
                <button
                  onClick={() => {
                    setActionReason('');
                    setShowApproveModal(true);
                  }}
                  className="bg-blue-800 hover:bg-blue-900 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-blue-900/20 transition flex items-center space-x-2"
                >
                  <Award className="w-5 h-5 text-amber-300" />
                  <span>Provide Final State Approval & Issue</span>
                </button>

                <button
                  onClick={() => {
                    setActionReason('');
                    setShowReturnModal(true);
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-2 rounded-xl text-sm shadow-sm transition flex items-center space-x-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Return for Correction</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Return Notice Banner if Returned */}
        {batch.status === 'RETURNED' && batch.returnReason && (
          <div className="mt-4 p-4 rounded-xl bg-orange-50 border border-orange-300 text-orange-950 text-xs">
            <span className="font-bold uppercase tracking-wider text-orange-800 flex items-center gap-1 mb-1">
              <RotateCcw className="w-4 h-4" /> Batch Returned for Correction by Officer:
            </span>
            <p className="font-medium text-sm text-slate-800 bg-white p-2.5 rounded border border-orange-200">
              "{batch.returnReason}"
            </p>
            <p className="text-[11px] text-orange-800 mt-2">
              ⚠️ <strong>Revision Rule:</strong> The revision count was incremented to Rev {batch.currentRevision}. Previous officer approvals are invalidated in history. Please upload the corrected spreadsheet and click Resubmit to initiate fresh reviews.
            </p>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Course Code & Name</span>
            <p className="font-bold text-slate-900 mt-0.5">{batch.courseName}</p>
            <p className="font-mono text-slate-500">{batch.courseCode}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Training Centre</span>
            <p className="font-bold text-slate-900 mt-0.5">{batch.trainingCentre?.name}</p>
            <p className="text-slate-500 font-mono">{batch.trainingCentre?.code}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px]">District & State</span>
            <p className="font-bold text-slate-900 mt-0.5">{batch.district?.name}</p>
            <p className="text-slate-500 font-mono">{batch.district?.code}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Training Window</span>
            <p className="font-bold text-slate-900 mt-0.5">
              {new Date(batch.startDate).toLocaleDateString()} — {new Date(batch.completionDate).toLocaleDateString()}
            </p>
            <p className="text-slate-500 font-semibold">{batch.candidateCount} enrolled candidates</p>
          </div>
        </div>

        {/* Governance Multi-Tier Progress Stepper */}
        <div className="mt-6 pt-5 border-t">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Approval & Issuance Pipeline (Revision {batch.currentRevision})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {/* Step 1: Submission */}
            <div className={`p-3 rounded-xl border ${batch.status !== 'DRAFT' ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">1. TC Submission</span>
                {batch.status !== 'DRAFT' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <p className="text-slate-600 text-[11px]">
                {batch.candidateCount > 0 ? `${batch.candidateCount} candidates staged` : 'Spreadsheet required'}
              </p>
            </div>

            {/* Step 2: District Approval */}
            <div className={`p-3 rounded-xl border ${districtApprovals.length >= 2 ? 'bg-emerald-50 border-emerald-300' : batch.status === 'DISTRICT_REVIEW' ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">2. District Approvals</span>
                <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border text-[10px]">
                  {districtApprovals.length}/2 Distinct
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                {districtApprovals.length === 0 && 'Awaiting 2 district officers'}
                {districtApprovals.length === 1 && `Approved by ${districtApprovals[0].officer.name}`}
                {districtApprovals.length >= 2 && 'Cleared by 2 distinct officers'}
              </p>
            </div>

            {/* Step 3: Quality Review */}
            <div className={`p-3 rounded-xl border ${batch.status === 'QUALITY_REVIEW' ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-200' : ['STATE_REVIEW', 'APPROVED', 'ISSUING', 'ISSUED'].includes(batch.status) ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">3. Quality Audit</span>
                <span className="text-[10px] text-slate-500 font-semibold">(&gt;50 Cohort)</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                {batch.candidateCount > 50 ? (
                  ['STATE_REVIEW', 'APPROVED', 'ISSUING', 'ISSUED'].includes(batch.status) ? 'Quality review approved' : 'Audit required'
                ) : (
                  'Bypassed (Cohort <= 50)'
                )}
              </p>
            </div>

            {/* Step 4: State Final Issuance */}
            <div className={`p-3 rounded-xl border ${['ISSUED', 'APPROVED'].includes(batch.status) ? 'bg-emerald-50 border-emerald-300' : batch.status === 'STATE_REVIEW' ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">4. State Final & Issue</span>
                {batch.status === 'ISSUED' && <Award className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-slate-600 text-[11px]">
                {batch.status === 'ISSUED' ? 'Certificates Generated & Dispatched' : 'Awaiting State Directorate'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Spreadsheet Upload Zone (For TC in DRAFT or RETURNED) */}
      {user?.role === 'TRAINING_CENTRE' && ['DRAFT', 'RETURNED'].includes(batch.status) && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-700" />
                <span>Candidate Data Spreadsheet Upload</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload student Excel (.xlsx/.xls) or CSV sheet. Atomic validation guarantees zero partial records saved on failure.
              </p>
            </div>

            <a
              href="/api/batches/template"
              download
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel Template</span>
            </a>
          </div>

          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50 transition cursor-pointer">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="hidden"
                id="spreadsheet-input"
              />
              <label htmlFor="spreadsheet-input" className="cursor-pointer block">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-sm font-bold text-slate-800">
                  {uploadFile ? uploadFile.name : 'Click to select Excel / CSV candidate spreadsheet'}
                </span>
                <p className="text-xs text-slate-500 mt-1">Expected: Name, Phone, Marks, Result, Dates</p>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!uploadFile || uploading}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition disabled:opacity-50"
              >
                {uploading ? 'Validating & Parsing Spreadsheet...' : 'Validate & Ingest Spreadsheet'}
              </button>
            </div>
          </form>

          {/* Validation Error Report Table */}
          {validationErrors.length > 0 && (
            <div className="mt-6 border border-rose-300 rounded-xl overflow-hidden bg-rose-50/50">
              <div className="bg-rose-100 px-4 py-2.5 border-b border-rose-300 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-rose-900 tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                  Spreadsheet Ingestion Rejected ({validationErrors.length} Critical Errors)
                </span>
                <span className="text-[11px] font-bold text-rose-800">No Partial Data Saved</span>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-rose-50 text-[10px] uppercase font-bold text-rose-800">
                    <tr>
                      <th className="py-2 px-3">Row #</th>
                      <th className="py-2 px-3">Column</th>
                      <th className="py-2 px-3">Validation Rule Failure Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-200">
                    {validationErrors.map((err, i) => (
                      <tr key={i} className="hover:bg-rose-100/50">
                        <td className="py-2 px-3 font-mono font-bold text-rose-900">Row {err.rowNumber}</td>
                        <td className="py-2 px-3 font-semibold text-rose-800">{err.column || '-'}</td>
                        <td className="py-2 px-3 text-slate-800">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Candidates Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-700" />
            <span>Candidate Enrollment Roster ({batch.candidates?.length || 0})</span>
          </h2>
        </div>

        {(!batch.candidates || batch.candidates.length === 0) ? (
          <div className="py-16 text-center text-slate-400">
            <p>No candidates uploaded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Candidate Identifier</th>
                  <th className="py-2.5 px-4">Full Name</th>
                  <th className="py-2.5 px-4">Mobile</th>
                  <th className="py-2.5 px-4">Score</th>
                  <th className="py-2.5 px-4">Result</th>
                  <th className="py-2.5 px-4">Status</th>
                  {user?.role === 'QUALITY_TEAM' && batch.status === 'QUALITY_REVIEW' && (
                    <th className="py-2.5 px-4 text-right">Audit Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batch.candidates.map((bc, idx) => (
                  <tr key={bc.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{bc.candidate.candidateIdentifier}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{bc.candidate.fullName}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{bc.candidate.phone}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{bc.marks}%</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${bc.result === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {bc.result}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      {bc.status === 'FLAGGED' ? (
                        <span className="inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          <Flag className="w-3 h-3 mr-1 text-amber-600" /> FLAGGED
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px] font-medium">{bc.status}</span>
                      )}
                      {bc.flagReason && (
                        <p className="text-[10px] text-amber-900 mt-0.5 italic">{bc.flagReason}</p>
                      )}
                    </td>
                    {user?.role === 'QUALITY_TEAM' && batch.status === 'QUALITY_REVIEW' && (
                      <td className="py-2.5 px-4 text-right">
                        {bc.status !== 'FLAGGED' && (
                          <button
                            onClick={() => handleFlagCandidate(bc.candidateId)}
                            className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 font-bold px-2 py-1 rounded text-[10px] transition"
                          >
                            Flag Record
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approval & Revision Audit Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Governance & Revision Approval Ledger ({batch.approvals?.length || 0} Records)
        </h2>

        {(!batch.approvals || batch.approvals.length === 0) ? (
          <p className="text-xs text-slate-400">No approvals or decisions recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {batch.approvals.map((app) => (
              <div
                key={app.id}
                className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  app.isSuperseded
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : app.decision === 'APPROVED'
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : app.decision === 'RETURNED'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{app.officer?.name}</span>
                    <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded font-semibold text-slate-700">
                      {app.role.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-slate-500 font-bold">Rev {app.revision}</span>
                    {app.isSuperseded && (
                      <span className="text-[10px] bg-slate-300 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                        Superseded (Invalidated upon return)
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 mt-1 font-medium">{app.comments || 'No comments provided.'}</p>
                </div>

                <div className="text-right sm:flex-shrink-0">
                  <span
                    className={`font-bold text-[11px] px-2 py-0.5 rounded ${
                      app.decision === 'APPROVED'
                        ? 'bg-emerald-200 text-emerald-900'
                        : app.decision === 'RETURNED'
                        ? 'bg-orange-200 text-orange-900'
                        : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    {app.decision}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(app.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-black text-slate-900">Confirm Official Approval</h2>
            <p className="text-xs text-slate-600">
              You are approving Batch <strong>{batch.batchNumber}</strong> under your official capacity as{' '}
              <strong>{user?.role.replace(/_/g, ' ')}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Audit Comments / Observations
              </label>
              <textarea
                rows={3}
                placeholder="Audit observations or clearance remarks..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionSubmitting}
                onClick={
                  user?.role === 'DISTRICT_OFFICER'
                    ? handleDistrictApprove
                    : user?.role === 'QUALITY_TEAM'
                    ? handleQualityApprove
                    : handleStateFinalApprove
                }
                className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-md transition"
              >
                {actionSubmitting ? 'Recording...' : 'Grant Official Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return For Correction Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-black text-slate-900 text-orange-900">Return Batch for Correction</h2>
            <p className="text-xs text-slate-600">
              Returning this batch will increment the batch revision to <strong>Rev {batch.currentRevision + 1}</strong>.
              All existing officer approvals will be archived as <em>superseded</em>, and fresh reviews will be required.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Mandatory Correction Justification Reason *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Detailed reason for returning this batch to the training centre..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-600"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionSubmitting}
                onClick={handleReturnForCorrection}
                className="px-4 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md transition"
              >
                {actionSubmitting ? 'Returning...' : 'Return to Training Centre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-black text-rose-900">Reject Candidate Batch</h2>
            <p className="text-xs text-slate-600">
              This will permanently transition the batch to <strong>REJECTED</strong>. It cannot be issued.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Formal rejection justification..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-600"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                disabled={actionSubmitting}
                onClick={handleRejectBatch}
                className="px-4 py-2 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white rounded-xl shadow-md transition"
              >
                {actionSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

