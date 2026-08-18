import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { lazy, Suspense, type ReactNode } from 'react';

const LoginPage    = lazy(() => import('@/pages/LoginPage'));
const ExecutivePage = lazy(() => import('@/pages/ExecutivePage'));
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage'));

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
        <Route path="/sales"     element={<PrivateRoute><PlaceholderPage title="Sales Analytics" /></PrivateRoute>} />
        <Route path="/managers"  element={<PrivateRoute><PlaceholderPage title="Manager Performance" /></PrivateRoute>} />
        <Route path="/workforce" element={<PrivateRoute><PlaceholderPage title="Workforce Analytics" /></PrivateRoute>} />
        <Route path="/salary"    element={<PrivateRoute><PlaceholderPage title="Salary Analytics" /></PrivateRoute>} />
        <Route path="/inventory" element={<PrivateRoute><PlaceholderPage title="Inventory Analytics" /></PrivateRoute>} />
        <Route path="/finance"   element={<PrivateRoute><PlaceholderPage title="Finance Analytics" /></PrivateRoute>} />
        <Route path="/hr"        element={<PrivateRoute><PlaceholderPage title="HR Analytics" /></PrivateRoute>} />
        <Route path="/hierarchy" element={<PrivateRoute><PlaceholderPage title="Org Hierarchy" /></PrivateRoute>} />
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
