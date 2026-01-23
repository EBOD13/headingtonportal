// frontend/src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import Login from './components/Login';
import ResidentsRooster from './components/ResidentsRooster';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Guests from './components/Guests';
import Settings from './components/Settings';

import { OverlayProvider } from './overlays/OverlayProvider';
import AppShell from './components/AppShell';   // 🔹 <-- added

import './App.css';
import Analytics from './components/Analytics';

// ============================================================================
// Query Client
// ============================================================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ============================================================================
// Protected Route Wrapper
// ============================================================================

const ProtectedRoute = ({ children }) => {
  const { clerk, isLoading } = useSelector((state) => state.auth);

  // ❗ Only show the big loading UI if we're still initializing
  // and don't know who the user is yet.
  if (isLoading && !clerk) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // After init: if there is no clerk, bounce to login.
  if (!clerk) {
    return <Navigate to="/login" />;
  }

  // If we *do* have a clerk, always render children,
  // even if isLoading might be true in the background.
  return children;
};


// ============================================================================
// App Component
// ============================================================================
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OverlayProvider>  
        <Router>
          <div className="container">
            <Routes>
              {/* PUBLIC ROUTES */}
              <Route path="/login" element={<Login />} />

              {/* PROTECTED ROUTES (wrapped with AppShell) */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Dashboard />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Dashboard />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/residents"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <ResidentsRooster />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/register-resident"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Register />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/guests"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Guests />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Settings />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Analytics /> {/* or <Analytics /> if you have that */}
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              {/* CATCH ALL */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>

        {/* DEVTOOLS */}
        <ReactQueryDevtools initialIsOpen={false} />

        {/* TOASTER */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: 'green',
                secondary: 'black',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#841620',
                color: '#fff',
              },
            },
          }}
        />
      </OverlayProvider>
    </QueryClientProvider>
  );
}

export default App;
