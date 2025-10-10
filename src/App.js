import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { ToastProvider } from './components/common';

const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const GovernmentPortalPage = lazy(() => import('./pages/government/GovernmentPortalPage'));
const MultiCityAnalysisPage = lazy(() => import('./pages/analysis/MultiCityAnalysisPage'));
const SingleCityAnalysisPage = lazy(() => import('./pages/analysis/SingleCityAnalysisPage'));

const PageFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-user-muted via-white to-gov-muted">
    <div className="flex h-full min-h-screen items-center justify-center px-4">
      <div className="glass-panel is-static max-w-md p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Loading</p>
        <p className="mt-3 text-lg font-medium text-slate-700">Preparing the next experience…</p>
      </div>
    </div>
  </div>
);

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <BrowserRouter>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/dashboard"
              element={(
                <ProtectedRoute allowedRoles={['citizen', 'government']}>
                  <DashboardPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/gov"
              element={(
                <ProtectedRoute allowedRoles={['government']}>
                  <GovernmentPortalPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/analysis/overview"
              element={(
                <ProtectedRoute allowedRoles={['citizen', 'government']}>
                  <MultiCityAnalysisPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/analysis/:cityId"
              element={(
                <ProtectedRoute allowedRoles={['citizen', 'government']}>
                  <SingleCityAnalysisPage />
                </ProtectedRoute>
              )}
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
);

export default App;
