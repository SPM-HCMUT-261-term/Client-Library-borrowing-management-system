import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from 'react-router-dom';
import { AUTH_FORBIDDEN_EVENT } from './api/client';
import { Layout } from './components/Layout';
import { MockDevToolbar } from './components/MockDevToolbar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
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
import { StaffLayout } from './components/staff/StaffLayout';
import { StaffHomePage } from './pages/staff/StaffHomePage';
import { StaffInventoryPage } from './pages/staff/StaffInventoryPage';
import { StaffBookDetailPage } from './pages/staff/StaffBookDetailPage';
import { StaffIssueBooksPage } from './pages/staff/StaffIssueBooksPage';
import { StaffReturnBookPage } from './pages/staff/StaffReturnBookPage';

const AppRoutes: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleForbidden = () => {
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    };
    window.addEventListener(AUTH_FORBIDDEN_EVENT, handleForbidden);
    return () => window.removeEventListener(AUTH_FORBIDDEN_EVENT, handleForbidden);
  }, [location.pathname, navigate]);

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

  if (location.pathname.startsWith('/staff')) {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'staff') return <Navigate to="/" replace />;

    return (
      <StaffLayout>
        <MockDevToolbar />
        <Routes>
          <Route path="/staff" element={<StaffHomePage />} />
          <Route path="/staff/issue" element={<StaffIssueBooksPage />} />
          <Route path="/staff/return" element={<StaffReturnBookPage />} />
          <Route path="/staff/books" element={<StaffInventoryPage />} />
          <Route path="/staff/books/:id" element={<StaffBookDetailPage />} />
          <Route path="/staff/*" element={<Navigate to="/staff" replace />} />
        </Routes>
      </StaffLayout>
    );
  }

  if (user?.role === 'admin' && location.pathname !== '/login') {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === 'staff' && location.pathname !== '/login') {
    return <Navigate to="/staff" replace />;
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
        <Route
          path="/books"
          element={user ? <BookCatalogPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/books/:id"
          element={user ? <BookDetailPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/holds/:id/confirmed"
          element={
            user ? <HoldConfirmedPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/my-borrowing"
          element={user ? <MyBorrowingPage /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
