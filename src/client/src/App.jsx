import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme.js';
import { AuthProvider, useAuth } from './store/AuthContext.jsx';
import { I18nProvider } from './i18n/I18nContext.jsx';
import MainLayout from './components/Layout/MainLayout.jsx';
import LoadingSpinner from './components/common/LoadingSpinner.jsx';

// Lazy-loaded pages
const Login = lazy(() => import('./pages/Login.jsx'));
const ChangePassword = lazy(() => import('./pages/ChangePassword.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const CompaniesList = lazy(() => import('./pages/Companies/CompaniesList.jsx'));
const CompanyDetail = lazy(() => import('./pages/Companies/CompanyDetail.jsx'));
const CompanyForm = lazy(() => import('./pages/Companies/CompanyForm.jsx'));
const ContactsList = lazy(() => import('./pages/Contacts/ContactsList.jsx'));
const ContactDetail = lazy(() => import('./pages/Contacts/ContactDetail.jsx'));
const ContactForm = lazy(() => import('./pages/Contacts/ContactForm.jsx'));
const ProjectsList = lazy(() => import('./pages/Projects/ProjectsList.jsx'));
const ProjectDetail = lazy(() => import('./pages/Projects/ProjectDetail.jsx'));
const ProjectForm = lazy(() => import('./pages/Projects/ProjectForm.jsx'));
const LeadsList = lazy(() => import('./pages/Leads/LeadsList.jsx'));
const LeadDetail = lazy(() => import('./pages/Leads/LeadDetail.jsx'));
const LeadForm = lazy(() => import('./pages/Leads/LeadForm.jsx'));
const CalendarPage = lazy(() => import('./pages/Calendar/CalendarPage.jsx'));
const ReportsPage = lazy(() => import('./pages/Reports/ReportsPage.jsx'));
const UsersAdmin = lazy(() => import('./pages/Admin/UsersAdmin.jsx'));
const RolesAdmin = lazy(() => import('./pages/Admin/RolesAdmin.jsx'));
const GroupsAdmin = lazy(() => import('./pages/Admin/GroupsAdmin.jsx'));
const TranslationsAdmin = lazy(() => import('./pages/Admin/TranslationsAdmin.jsx'));
const SettingsAdmin = lazy(() => import('./pages/Admin/SettingsAdmin.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword || user.force_password_change) return <Navigate to="/change-password" replace />;
  if (requireAdmin && !isAdmin()) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="companies" element={<CompaniesList />} />
          <Route path="companies/new" element={<CompanyForm />} />
          <Route path="companies/:id" element={<CompanyDetail />} />
          <Route path="companies/:id/edit" element={<CompanyForm />} />
          <Route path="contacts" element={<ContactsList />} />
          <Route path="contacts/new" element={<ContactForm />} />
          <Route path="contacts/:id" element={<ContactDetail />} />
          <Route path="contacts/:id/edit" element={<ContactForm />} />
          <Route path="projects" element={<ProjectsList />} />
          <Route path="projects/new" element={<ProjectForm />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="projects/:id/edit" element={<ProjectForm />} />
          <Route path="leads" element={<LeadsList />} />
          <Route path="leads/new" element={<LeadForm />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="leads/:id/edit" element={<LeadForm />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admin/users" element={<ProtectedRoute requireAdmin><UsersAdmin /></ProtectedRoute>} />
          <Route path="admin/roles" element={<ProtectedRoute requireAdmin><RolesAdmin /></ProtectedRoute>} />
          <Route path="admin/groups" element={<ProtectedRoute requireAdmin><GroupsAdmin /></ProtectedRoute>} />
          <Route path="admin/translations" element={<ProtectedRoute requireAdmin><TranslationsAdmin /></ProtectedRoute>} />
          <Route path="admin/settings" element={<ProtectedRoute requireAdmin><SettingsAdmin /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <I18nProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </I18nProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
