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
import Analytics from './components/Analytics';        
import AdminScreen from './components/AdminScreen';

import { OverlayProvider } from './overlays/OverlayProvider';
import AppShell from './components/AppShell';

import './App.css';
import ClerkRoster from './components/ClerkRoster';

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

  if (isLoading && !clerk) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!clerk) {
    return <Navigate to="/login" />;
  }

  return children;
};

// ============================================================================
// Admin Route Wrapper
// ============================================================================
const AdminRoute = ({ children }) => {
  const { clerk } = useSelector((state) => state.auth);
  const isAdmin = Boolean(clerk?.isAdmin || clerk?.role === 'admin');

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

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
                      <Analytics />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              {/* ADMIN ONLY ROUTE */}

               <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <AppShell>
                          <AdminScreen />
                        </AppShell>
                      </AdminRoute>
                    </ProtectedRoute>
                    
                  }
                />
                <Route
                  path="/admin/clerks"
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <AppShell>
                          <ClerkRoster />
                        </AppShell>
                      </AdminRoute>
                    </ProtectedRoute>
                    
                  }
                />


              {/* CATCH ALL */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>

        <ReactQueryDevtools initialIsOpen={false} />

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
