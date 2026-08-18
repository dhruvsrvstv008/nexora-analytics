import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { lazy, Suspense, type ReactNode } from 'react';

const LoginPage          = lazy(() => import('@/pages/LoginPage'));
const ExecutivePage      = lazy(() => import('@/pages/ExecutivePage'));
const SalesPage          = lazy(() => import('@/pages/SalesPage'));
const ManagersPage       = lazy(() => import('@/pages/ManagersPage'));
const ManagerDetailPage  = lazy(() => import('@/pages/ManagerDetailPage'));
const WorkforcePage      = lazy(() => import('@/pages/WorkforcePage'));
const SalaryPage         = lazy(() => import('@/pages/SalaryPage'));
const InventoryPage      = lazy(() => import('@/pages/InventoryPage'));
const FinancePage        = lazy(() => import('@/pages/FinancePage'));
const HrPage             = lazy(() => import('@/pages/HrPage'));
const HierarchyPage      = lazy(() => import('@/pages/HierarchyPage'));
const PlaceholderPage    = lazy(() => import('@/pages/PlaceholderPage'));

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center"><span className="text-muted text-sm">Loading…</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-muted text-sm">Loading…</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><ExecutivePage /></PrivateRoute>} />
        <Route path="/sales"     element={<PrivateRoute><SalesPage /></PrivateRoute>} />
        <Route path="/managers"           element={<PrivateRoute><ManagersPage /></PrivateRoute>} />
        <Route path="/managers/:id"       element={<PrivateRoute><ManagerDetailPage /></PrivateRoute>} />
        <Route path="/workforce"          element={<PrivateRoute><WorkforcePage /></PrivateRoute>} />
        <Route path="/salary"             element={<PrivateRoute><SalaryPage /></PrivateRoute>} />
        <Route path="/inventory"          element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
        <Route path="/finance"            element={<PrivateRoute><FinancePage /></PrivateRoute>} />
        <Route path="/hr"                 element={<PrivateRoute><HrPage /></PrivateRoute>} />
        <Route path="/hierarchy"          element={<PrivateRoute><HierarchyPage /></PrivateRoute>} />
        <Route path="/settings"  element={<PrivateRoute><PlaceholderPage title="Settings" /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
