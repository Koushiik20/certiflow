import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Certificate } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Award, Download, ExternalLink, Search, ShieldX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const CertificateListPage: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cancelModalCert, setCancelModalCert] = useState<Certificate | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/certificates');
      setCertificates(res.data.certificates);
    } catch (err) {
      console.error('Error fetching certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCertificate = async () => {
    if (!cancelModalCert || !cancelReason || cancelReason.trim().length < 5) {
      setErrorMsg('A detailed revocation reason of at least 5 characters is required.');
      return;
    }

    setCancelling(true);
    setErrorMsg('');
    try {
      const res = await api.post(`/state/certificates/${cancelModalCert.id}/cancel`, {
        reason: cancelReason
      });
      setSuccessMsg(res.data.message);
      setCancelModalCert(null);
      setCancelReason('');
      fetchCertificates();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to revoke certificate.');
    } finally {
      setCancelling(false);
    }
  };

  const filteredCerts = certificates.filter((c) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.certificateNumber.toLowerCase().includes(q) ||
      c.candidateNameSnapshot.toLowerCase().includes(q) ||
      c.courseNameSnapshot.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Issued Certificates Repository</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cryptographically sealed certificates with public QR verification and audit hashes.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, candidate, or course..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          {successMsg}
        </div>
      )}

      {/* Certificates Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading certificates...</div>
        ) : filteredCerts.length === 0 ? (
          <div className="py-20 text-center text-slate-500 space-y-2">
            <Award className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-700">No Certificates Issued Yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Certificates are generated and updated only after the State Officer (Farah) grants final approval on a batch.
            </p>
            <Link
              to="/batches"
              className="inline-block mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 transition"
            >
              Go to Batches to Review & Issue
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Certificate ID & QR</th>
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4">Course & Centre</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCerts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {c.qrCodeDataUrl ? (
                          <img
                            src={c.qrCodeDataUrl}
                            alt="QR"
                            className="w-8 h-8 rounded border border-slate-200 bg-white"
                          />
                        ) : (
                          <Award className="w-6 h-6 text-slate-400" />
                        )}
                        <div>
                          <div className="font-mono font-bold text-slate-900">{c.certificateNumber}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]" title={c.certificateHash}>
                            Hash: {c.certificateHash.substring(0, 10)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{c.candidateNameSnapshot}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{c.candidate?.phone}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{c.courseNameSnapshot}</div>
                      <div className="text-[11px] text-slate-500">{c.trainingCentreSnapshot}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {new Date(c.issueDate).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} size="sm" />
                      {c.status === 'CANCELLED' && (
                        <p className="text-[10px] text-rose-800 italic mt-0.5 max-w-[150px] truncate" title={c.cancellationReason}>
                          {c.cancellationReason}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <a
                          href={`/api/certificates/${c.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 border transition"
                          title="Download Official PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        <Link
                          to={`/verify/${c.certificateNumber}`}
                          className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 border border-emerald-200 transition"
                          title="Public Verification View"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {user?.role === 'STATE_OFFICE' && c.status === 'VALID' && (
                          <button
                            onClick={() => {
                              setCancelModalCert(c);
                              setCancelReason('');
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 transition"
                            title="Revoke / Cancel Certificate"
                          >
                            <ShieldX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revocation Modal */}
      {cancelModalCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-black text-rose-900 flex items-center gap-1.5">
              <ShieldX className="w-5 h-5 text-rose-700" />
              <span>Revoke / Cancel Certificate</span>
            </h2>
            <p className="text-xs text-slate-600">
              Revoking Certificate <strong>{cancelModalCert.certificateNumber}</strong> ({cancelModalCert.candidateNameSnapshot}) is an irreversible audit action. The public verification page will immediately show this credential as <strong>CANCELLED</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Official Justification & Inquiry Reference *
              </label>
              <textarea
                rows={3}
                required
                placeholder="State vigilance inquiry ref, false record discovery, or procedural error..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-600"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => setCancelModalCert(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                disabled={cancelling}
                onClick={handleCancelCertificate}
                className="px-4 py-2 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white rounded-xl shadow-md transition"
              >
                {cancelling ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

