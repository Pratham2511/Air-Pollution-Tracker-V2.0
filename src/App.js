import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage, DashboardPage, GovernmentPortalPage } from './pages';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
