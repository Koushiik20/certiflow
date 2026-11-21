import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DemoBanner } from './components/common/DemoBanner';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { BatchListPage } from './pages/batches/BatchListPage';
import { BatchDetailPage } from './pages/batches/BatchDetailPage';
import { CertificateListPage } from './pages/certificates/CertificateListPage';
import { PublicVerifyPage } from './pages/verification/PublicVerifyPage';
import { DeliveryConsolePage } from './pages/delivery/DeliveryConsolePage';
import { AuditLogPage } from './pages/audit/AuditLogPage';
import { SlaMonitorPage } from './pages/sla/SlaMonitorPage';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-semibold text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <DemoBanner />
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Verification Route - NO AUTH REQUIRED */}
      <Route path="/verify" element={<PublicVerifyPage />} />
      <Route path="/verify/:certificateId" element={<PublicVerifyPage />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Portal Routes */}
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <Navigate to="/batches" replace />
          </ProtectedLayout>
        }
      />
      <Route
        path="/batches"
        element={
          <ProtectedLayout>
            <BatchListPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/batches/:id"
        element={
          <ProtectedLayout>
            <BatchDetailPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/approvals"
        element={
          <ProtectedLayout>
            <BatchListPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/quality"
        element={
          <ProtectedLayout>
            <BatchListPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/state-office"
        element={
          <ProtectedLayout>
            <BatchListPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/certificates"
        element={
          <ProtectedLayout>
            <CertificateListPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/deliveries"
        element={
          <ProtectedLayout>
            <DeliveryConsolePage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedLayout>
            <AuditLogPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/sla"
        element={
          <ProtectedLayout>
            <SlaMonitorPage />
          </ProtectedLayout>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

