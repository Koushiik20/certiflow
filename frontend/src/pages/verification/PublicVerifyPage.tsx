import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Download,
  Building2,
  Calendar,
  Award,
  ShieldAlert,
  ArrowLeft,
  Hash,
  ExternalLink
} from 'lucide-react';

export const PublicVerifyPage: React.FC = () => {
  const { certificateId } = useParams<{ certificateId?: string }>();
  const navigate = useNavigate();

  const [inputCertId, setInputCertId] = useState<string>(certificateId || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (certificateId) {
      setInputCertId(certificateId);
      performVerification(certificateId);
    }
  }, [certificateId]);

  const performVerification = async (certId: string) => {
    if (!certId.trim()) return;
    setLoading(true);
    setErrorMessage('');
    setVerifyResult(null);

    try {
      const res = await axios.get(`/api/verify/${certId.trim()}`);
      setVerifyResult(res.data);
    } catch (err: any) {
      if (err.response?.data) {
        setVerifyResult(err.response.data);
      } else {
        setErrorMessage('Could not connect to verification registry. Please check network.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCertId.trim()) {
      navigate(`/verify/${inputCertId.trim()}`);
      performVerification(inputCertId.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Directorate Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white py-4 px-6 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center font-serif font-black text-xl text-white shadow-md">
              CF
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">State Skilling Registry</h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Public Certificate Authenticity & Anti-Fraud Verification Portal
              </p>
            </div>
          </div>

          <Link
            to="/login"
            className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            Staff Login
          </Link>
        </div>
      </header>

      {/* Main Verification Container */}
      <main className="max-w-3xl mx-auto w-full p-4 sm:p-6 my-auto">
        {/* Search Bar Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 mb-6">
          <h2 className="text-base font-bold text-slate-800 mb-1">Verify Candidate Credential</h2>
          <p className="text-xs text-slate-500 mb-4">
            Enter the unique Certificate ID (e.g. <span className="font-mono font-semibold">CERT-2026-800001</span>) or scan the certificate QR code.
          </p>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={inputCertId}
                onChange={(e) => setInputCertId(e.target.value)}
                placeholder="Enter Certificate ID..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-600 outline-none uppercase"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Now'}
            </button>
          </form>

          {/* Quick Demo Pre-fill links */}
          <div className="mt-3 flex items-center space-x-2 text-[11px] text-slate-500">
            <span className="font-semibold">Quick Test IDs:</span>
            <button
              type="button"
              onClick={() => {
                setInputCertId('CERT-2026-800001');
                navigate('/verify/CERT-2026-800001');
              }}
              className="font-mono text-blue-700 hover:underline font-bold"
            >
              CERT-2026-800001 (Valid)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setInputCertId('CERT-2026-000099');
                navigate('/verify/CERT-2026-000099');
              }}
              className="font-mono text-rose-700 hover:underline font-bold"
            >
              CERT-2026-000099 (Revoked)
            </button>
          </div>
        </div>

        {/* Verification Result Card */}
        {verifyResult && (
          <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
            {/* Status 1: VALID */}
            {verifyResult.status === 'VALID' && (
              <div>
                <div className="bg-emerald-600 text-white p-6 text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-wider">
                    Official Credential Verified
                  </h3>
                  <p className="text-emerald-100 text-xs mt-0.5">
                    This certificate is genuine, active, and officially recorded in the State Skilling Registry.
                  </p>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  <div className="border-b pb-4 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Conferred Upon
                    </span>
                    <h4 className="text-2xl font-black text-slate-900 mt-0.5">
                      {verifyResult.certificate.candidateName}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Course of Study</span>
                      <p className="font-bold text-slate-900 mt-0.5 text-sm">
                        {verifyResult.certificate.courseName}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Training Centre</span>
                      <p className="font-bold text-slate-900 mt-0.5 text-sm">
                        {verifyResult.certificate.trainingCentre}
                      </p>
                      <p className="text-slate-500 text-[11px]">{verifyResult.certificate.districtName}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Assessment Completion</span>
                      <p className="font-bold text-slate-900 mt-0.5 text-sm">
                        {new Date(verifyResult.certificate.completionDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Issue Date</span>
                      <p className="font-bold text-slate-900 mt-0.5 text-sm">
                        {new Date(verifyResult.certificate.issueDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 text-slate-300 rounded-xl font-mono text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Certificate ID:</span>
                      <span className="font-bold text-white">{verifyResult.certificate.certificateNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Issuing Authority:</span>
                      <span className="text-slate-200">{verifyResult.certificate.issuingAuthority}</span>
                    </div>
                    <div className="flex justify-between truncate" title={verifyResult.certificate.certificateHash}>
                      <span className="text-slate-400">SHA-256 Hash:</span>
                      <span className="text-emerald-400">{verifyResult.certificate.certificateHash}</span>
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <a
                      href={`/api/certificates/${verifyResult.certificate.certificateNumber}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Official Vector PDF</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Status 2: CANCELLED */}
            {verifyResult.status === 'CANCELLED' && (
              <div>
                <div className="bg-rose-700 text-white p-6 text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                    <ShieldAlert className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-wider">
                    Certificate Revoked / Cancelled
                  </h3>
                  <p className="text-rose-100 text-xs mt-0.5">
                    This certificate was officially cancelled by the State Directorate and is <strong>VOID</strong>.
                  </p>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wider">
                      Official Revocation Justification
                    </span>
                    <p className="text-sm font-semibold text-rose-950 mt-1">
                      "{verifyResult.certificate.cancellationReason}"
                    </p>
                    <p className="text-[11px] text-rose-700 mt-2 font-mono">
                      Revocation Timestamp: {new Date(verifyResult.certificate.cancelledAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Candidate</span>
                      <p className="font-bold text-slate-900 mt-0.5">{verifyResult.certificate.candidateName}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Certificate ID</span>
                      <p className="font-mono font-bold text-slate-900 mt-0.5">{verifyResult.certificate.certificateNumber}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[11px]">
                    <strong>Legal Notice for Employers:</strong> This credential has been invalidated. It must not be accepted for employment, licensing, or academic credits.
                  </div>
                </div>
              </div>
            )}

            {/* Status 3: NOT_FOUND */}
            {verifyResult.status === 'NOT_FOUND' && (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-10 h-10 text-rose-600" />
                </div>
                <h3 className="text-xl font-black text-rose-900 uppercase">
                  No Authentic Record Found
                </h3>
                <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                  {verifyResult.message || `No authentic certificate record was found matching this identifier. It may be fraudulent or mistyped.`}
                </p>
                <div className="mt-6 p-3 bg-slate-100 rounded-xl text-xs text-slate-500 max-w-md mx-auto font-mono">
                  Registry Status: UNREGISTERED / NOT_ISSUED
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 border-t bg-white">
        State Directorate of Vocational Education & Skilling • CertiFlow Trust Infrastructure 2026
      </footer>
    </div>
  );
};

