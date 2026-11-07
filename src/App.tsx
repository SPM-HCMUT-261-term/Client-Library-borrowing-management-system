import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MockDevToolbar } from './components/MockDevToolbar';
import { GuestLandingPage } from './pages/GuestLandingPage';
import { LoginPage } from './pages/LoginPage';
import { StudentHomePage } from './pages/StudentHomePage';
import { BookCatalogPage } from './pages/BookCatalogPage';
import { BookDetailPage } from './pages/BookDetailPage';
import { HoldConfirmedPage } from './pages/HoldConfirmedPage';
import { MyBorrowingPage } from './pages/MyBorrowingPage';

const AppRoutes: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const variant =
    location.pathname === '/login'
      ? 'auth'
      : user
        ? 'student'
        : 'guest';

  return (
    <Layout variant={variant} user={user} onLogout={() => void logout()}>
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
      <MockDevToolbar />
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
