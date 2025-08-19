import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/hooks/useTheme';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { useBreadcrumbs } from '@/components/layout/Breadcrumb';
import { CookieConsentBanner } from '@/components/gdpr/CookieConsentBanner';
import { SessionTimeoutProvider } from '@/components/auth/SessionTimeoutProvider';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/Dashboard';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { SettingsPage } from '@/pages/Settings';
import { AssistantPage } from '@/pages/AssistantPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import { PatientsPage, PatientDetailPage, PatientFormPage, PatientHistoryPage } from '@/pages/patients';
import { PackagesPage, PackageFormPage, PackageDetailPage } from '@/pages/packages';
import { ServicesManagementPage } from '@/pages/ServicesManagementPage';
import { RoomsManagementPage } from '@/pages/RoomsManagementPage';
import { StaffProfilePage } from '@/pages/StaffProfilePage';
import { AuditLogsPage } from '@/pages/AuditLogsPage';
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
          <SessionTimeoutProvider
            timeoutDuration={15 * 60 * 1000} // 15 minutes
            warningDuration={2 * 60 * 1000}  // 2 minutes warning
          >
            <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            
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

            {/* Patient Management Routes */}
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <PatientsPage />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/patients/new"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <PatientFormPage />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/patients/history"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <PatientHistoryPage />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/patients/history/new"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <PatientHistoryPage />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/patients/:id"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <PatientDetailPage />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/patients/:id/edit"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <PatientFormPage />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            {/* Package Management Routes */}
            <Route
              path="/packages"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <PackagesPage />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/packages/new"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <PackageFormPage />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/packages/:id"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <PackageDetailPage />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/packages/:id/edit"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <PackageFormPage />
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
              path="/settings/users"
              element={
                <ProtectedRoute requiredRoles={[Role.ADMIN, Role.MODERATOR]}>
                  <LayoutWrapper>
                    <UserManagementPage />
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
            
            <Route
              path="/settings/security"
              element={
                <ProtectedRoute requiredRoles={[Role.ADMIN]}>
                  <LayoutWrapper>
                    <AuditLogsPage />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/settings/services"
              element={
                <ProtectedRoute requiredRoles={[Role.ADMIN, Role.MODERATOR]}>
                  <LayoutWrapper>
                    <ServicesManagementPage />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/settings/rooms"
              element={
                <ProtectedRoute requiredRoles={[Role.ADMIN, Role.MODERATOR]}>
                  <LayoutWrapper>
                    <RoomsManagementPage />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />
            
            {/* Medical Center Routes - Placeholders */}
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <div className="space-y-6">
                      <h1 className="text-3xl font-bold">Terminkalender</h1>
                      <p className="text-muted-foreground">Terminkalender in Kürze verfügbar...</p>
                    </div>
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/appointments/*"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <div className="space-y-6">
                      <h1 className="text-3xl font-bold">Termine</h1>
                      <p className="text-muted-foreground">Terminverwaltung in Kürze verfügbar...</p>
                    </div>
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/services/*"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <div className="space-y-6">
                      <h1 className="text-3xl font-bold">Behandlungen</h1>
                      <p className="text-muted-foreground">Behandlungsverwaltung in Kürze verfügbar...</p>
                    </div>
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff/profile"
              element={
                <ProtectedRoute>
                  <LayoutWrapper>
                    <StaffProfilePage />
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff/*"
              element={
                <ProtectedRoute requiredRoles={[Role.ADMIN, Role.MODERATOR]}>
                  <LayoutWrapper>
                    <div className="space-y-6">
                      <h1 className="text-3xl font-bold">Personal</h1>
                      <p className="text-muted-foreground">Personalverwaltung in Kürze verfügbar...</p>
                    </div>
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/rooms"
              element={
                <ProtectedRoute requiredRoles={[Role.ADMIN, Role.MODERATOR]}>
                  <LayoutWrapper>
                    <div className="space-y-6">
                      <h1 className="text-3xl font-bold">Behandlungsräume</h1>
                      <p className="text-muted-foreground">Raumverwaltung in Kürze verfügbar...</p>
                    </div>
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/payments"
              element={
                <ProtectedRoute requiredRoles={[Role.ADMIN, Role.MODERATOR]}>
                  <LayoutWrapper>
                    <div className="space-y-6">
                      <h1 className="text-3xl font-bold">Abrechnung</h1>
                      <p className="text-muted-foreground">Abrechnungsverwaltung in Kürze verfügbar...</p>
                    </div>
                  </LayoutWrapper>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/analytics"
              element={
                <ProtectedRoute requiredRoles={[Role.ADMIN, Role.MODERATOR]}>
                  <LayoutWrapper>
                    <div className="space-y-6">
                      <h1 className="text-3xl font-bold">Berichte</h1>
                      <p className="text-muted-foreground">Berichtssystem in Kürze verfügbar...</p>
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
            
            {/* Global components */}
            <CookieConsentBanner />
          </SessionTimeoutProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;