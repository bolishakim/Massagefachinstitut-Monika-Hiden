import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/hooks/useTheme';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { useBreadcrumbs } from '@/components/layout/Breadcrumb';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/Dashboard';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { SettingsPage } from '@/pages/Settings';
import { AssistantPage } from '@/pages/AssistantPage';
import { Role } from '@/types';
import '@/styles/markdown.css';

// Layout wrapper component that provides breadcrumbs and user context
function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const breadcrumbs = useBreadcrumbs(location.pathname);
  const { user: authUser } = useAuth();
  
  // Transform auth user to match AppLayout user interface
  const user = authUser ? {
    id: authUser.id,
    name: `${authUser.firstName} ${authUser.lastName}`,
    email: authUser.email,
    avatar: authUser.avatar,
    role: authUser.role.toLowerCase()
  } : undefined;

  return (
    <AppLayout
      user={user}
      currentPath={location.pathname}
      breadcrumbs={breadcrumbs}
    >
      {children}
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <DashboardPage user={{ name: 'John Doe', role: 'admin' }} />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/assistant"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <AssistantPage />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRoles={[Role.ADMIN, Role.MODERATOR]}>
                  <LayoutWrapper>
                    <UserManagementPage />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <div className="space-y-6">
                      <h1 className="text-3xl font-bold">Profile</h1>
                      <p className="text-muted-foreground">Profile page coming soon...</p>
                    </div>
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <SettingsPage user={{ id: '1', name: 'John Doe', email: 'john.doe@example.com', role: 'admin' }} />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />
            
            {/* Additional routes for demo */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute requiredRoles={[Role.ADMIN, Role.MODERATOR]}>
                  <LayoutWrapper>
                    <div className="space-y-6">
                      <h1 className="text-3xl font-bold">Analytics</h1>
                      <p className="text-muted-foreground">Analytics page coming soon...</p>
                    </div>
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <div className="space-y-6">
                      <h1 className="text-3xl font-bold">Products</h1>
                      <p className="text-muted-foreground">Products page coming soon...</p>
                    </div>
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <div className="space-y-6">
                      <h1 className="text-3xl font-bold">Orders</h1>
                      <p className="text-muted-foreground">Orders page coming soon...</p>
                    </div>
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;