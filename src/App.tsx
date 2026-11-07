import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Link,
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

const PlaceholderSignedInView: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => {
  return (
    <div className="py-12">
      <div className="rounded-2xl bg-brand-beige border border-brand-border p-8 space-y-4">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-brand-teal">
          UPCOMING MILESTONE ROUTE
        </span>
        <h1 className="font-serif text-[32px] text-brand-ink">{title}</h1>
        <p className="text-[14px] text-brand-slate max-w-xl">{subtitle}</p>
        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
          <Link
            to="/books"
            className="px-3.5 py-1.5 rounded-lg bg-brand-teal text-white font-semibold hover:bg-brand-tealHover"
          >
            ← Back to Book catalog (/books)
          </Link>
          <Link
            to="/"
            className="px-3.5 py-1.5 rounded-lg bg-white border border-brand-border text-brand-ink font-medium hover:border-brand-teal"
          >
            Home (/)
          </Link>
        </div>
      </div>
    </div>
  );
};

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
        <Route
          path="/my-borrowing"
          element={
            <PlaceholderSignedInView
              title="My Borrowing (/my-borrowing)"
              subtitle="Ready for Milestone 6 implementation."
            />
          }
        />
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
