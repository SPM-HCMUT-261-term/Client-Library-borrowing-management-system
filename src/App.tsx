import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { Layout } from './components/Layout';
import { MockDevToolbar } from './components/MockDevToolbar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GuestLandingPage } from './pages/GuestLandingPage';
import { LoginPage } from './pages/LoginPage';
import { StudentHomePage } from './pages/StudentHomePage';
import { BookCatalogPage } from './pages/BookCatalogPage';
import { BookDetailPage } from './pages/BookDetailPage';
import { HoldConfirmedPage } from './pages/HoldConfirmedPage';
import { MyBorrowingPage } from './pages/MyBorrowingPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminHomePage } from './pages/admin/AdminHomePage';
import { AdminAccountsPage } from './pages/admin/AdminAccountsPage';
import { AdminAccountDetailsPage } from './pages/admin/AdminAccountDetailsPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';

const AppRoutes: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-canvas flex items-center justify-center text-[14px] text-brand-slate">
        Restoring your session…
      </div>
    );
  }

  if (location.pathname.startsWith('/admin')) {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/" replace />;

    return (
      <AdminLayout>
        <MockDevToolbar />
        <Routes>
          <Route path="/admin" element={<AdminHomePage />} />
          <Route path="/admin/accounts" element={<AdminAccountsPage />} />
          <Route path="/admin/accounts/:id" element={<AdminAccountDetailsPage />} />
          <Route path="/admin/profile" element={<AdminProfilePage />} />
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminLayout>
    );
  }

  if (user?.role === 'admin' && location.pathname !== '/login') {
    return <Navigate to="/admin" replace />;
  }

  const variant =
    location.pathname === '/login'
      ? 'auth'
      : user
        ? 'student'
        : 'guest';

  return (
    <Layout variant={variant} user={user} onLogout={() => void logout()}>
      <MockDevToolbar />
      <Routes>
        <Route
          path="/"
          element={user ? <StudentHomePage /> : <GuestLandingPage />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/books" element={<BookCatalogPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/holds/:id/confirmed" element={<HoldConfirmedPage />} />
        <Route path="/my-borrowing" element={<MyBorrowingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
