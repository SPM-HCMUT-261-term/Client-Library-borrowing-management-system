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

const PlaceholderSignedInView: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => {
  const { user, logout } = useAuth();
  return (
    <div className="py-12">
      <div className="rounded-2xl bg-brand-beige border border-brand-border p-8 space-y-4">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-brand-teal">
          AUTHENTICATED SESSION ACTIVE
        </span>
        <h1 className="font-serif text-[32px] text-brand-ink">{title}</h1>
        <p className="text-[14px] text-brand-slate max-w-xl">{subtitle}</p>
        {user && (
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-white border border-brand-border font-medium text-brand-ink">
              Signed in as: {user.fullName} ({user.accountId} · {user.role})
            </span>
            <Link
              to="/books"
              className="px-3.5 py-1.5 rounded-lg bg-brand-teal text-white font-semibold hover:bg-brand-tealHover"
            >
              Book catalog (/books)
            </Link>
            <Link
              to="/my-borrowing"
              className="px-3.5 py-1.5 rounded-lg bg-white border border-brand-border text-brand-ink font-medium hover:border-brand-teal"
            >
              My borrowing (/my-borrowing)
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-brand-border text-red-700 font-medium hover:bg-red-50"
            >
              Sign out to return to Guest Landing
            </button>
          </div>
        )}
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
          element={
            user ? (
              <PlaceholderSignedInView
                title={`Good morning, ${user.fullName.split(' ')[0]}.`}
                subtitle="Student Home Page & Book Catalog will be implemented in Milestone 4."
              />
            ) : (
              <GuestLandingPage />
            )
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/books"
          element={
            <PlaceholderSignedInView
              title="The Book Catalog (/books)"
              subtitle="Ready for Milestone 4 implementation."
            />
          }
        />
        <Route
          path="/books/:id"
          element={
            <PlaceholderSignedInView
              title="Book Detail (/books/:id)"
              subtitle="Ready for Milestone 5 implementation."
            />
          }
        />
        <Route
          path="/holds/:id/confirmed"
          element={
            <PlaceholderSignedInView
              title="Hold Request Confirmed (/holds/:id/confirmed)"
              subtitle="Ready for Milestone 5 implementation."
            />
          }
        />
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
