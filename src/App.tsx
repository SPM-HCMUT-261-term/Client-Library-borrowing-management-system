import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BookCoverGraphic } from './components/BookCoverGraphic';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MockDevToolbar } from './components/MockDevToolbar';
import {
  getFeaturedBooksApi,
  getBooksApi,
  getBookByIdApi,
  getMyBorrowingApi,
} from './api/endpoints';
import { FeaturedBookItem } from './types/api';

const Milestone2NetworkPreview: React.FC<{ routeTitle: string }> = ({
  routeTitle,
}) => {
  const { user, login, logout } = useAuth();
  const [featured, setFeatured] = useState<FeaturedBookItem[]>([]);
  const [apiOutput, setApiOutput] = useState<string>(
    'Click any endpoint button below to fire a real fetch() call through MSW...',
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void getFeaturedBooksApi(4).then(setFeatured).catch(console.error);
  }, []);

  const runProbe = async (label: string, fn: () => Promise<unknown>) => {
    setLoading(true);
    try {
      const res = await fn();
      setApiOutput(`// ${label}\n` + JSON.stringify(res, null, 2));
    } catch (err) {
      setApiOutput(
        `// ERROR in ${label}\n` +
          JSON.stringify(
            err instanceof Error
              ? { name: err.name, message: err.message, ...(err as object) }
              : err,
            null,
            2,
          ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-10 space-y-8">
      <div className="bg-brand-beige rounded-2xl p-8 border border-brand-border space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-brand-teal">
              MILESTONE 2 · MSW v2 NETWORK LAYER &amp; API CLIENT READY
            </span>
            <h1 className="font-serif text-[32px] text-brand-ink mt-1">
              {routeTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="px-4 py-2 rounded-lg bg-white border border-brand-border text-xs font-semibold text-brand-ink hover:bg-red-50 hover:text-red-700"
              >
                Sign out ({user.fullName} · {user.accountId})
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  void runProbe('POST /api/v1/auth/login (S10428)', () =>
                    login({
                      accountId: 'S10428',
                      password: 'password123',
                      role: 'student',
                    }),
                  )
                }
                className="px-4 py-2 rounded-lg bg-brand-teal text-white text-xs font-semibold hover:bg-brand-tealHover"
              >
                Test Login as Maya Chen (S10428)
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              void runProbe('GET /api/v1/books/featured?limit=4', () =>
                getFeaturedBooksApi(4),
              )
            }
            className="px-3 py-1.5 rounded-lg bg-white border border-brand-border text-xs font-medium hover:border-brand-teal"
          >
            GET /books/featured
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              void runProbe('GET /api/v1/books?category=Fiction&q=fiction', () =>
                getBooksApi({ category: 'Fiction', q: 'fiction' }),
              )
            }
            className="px-3 py-1.5 rounded-lg bg-white border border-brand-border text-xs font-medium hover:border-brand-teal"
          >
            GET /books?category=Fiction
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              void runProbe('GET /api/v1/books/book-midnight-library', () =>
                getBookByIdApi('book-midnight-library'),
              )
            }
            className="px-3 py-1.5 rounded-lg bg-white border border-brand-border text-xs font-medium hover:border-brand-teal"
          >
            GET /books/:id (Midnight Library)
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              void runProbe('GET /api/v1/me/borrowing', () =>
                getMyBorrowingApi(),
              )
            }
            className="px-3 py-1.5 rounded-lg bg-white border border-brand-border text-xs font-medium hover:border-brand-teal"
          >
            GET /me/borrowing
          </button>
        </div>

        <pre className="bg-brand-ink text-brand-mint p-4 rounded-xl text-xs overflow-x-auto max-h-72 leading-relaxed">
          {apiOutput}
        </pre>
      </div>

      {/* Live Featured Books from GET /api/v1/books/featured */}
      <div className="space-y-4">
        <h2 className="font-serif text-[24px] text-brand-ink">
          Live Featured Books (from <code>GET /api/v1/books/featured</code>)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((book) => (
            <div
              key={book._id}
              className="rounded-xl border border-brand-border bg-white overflow-hidden flex flex-col"
            >
              <div className="bg-brand-beige py-7 flex items-center justify-center">
                <BookCoverGraphic
                  title={book.title}
                  author={book.author}
                  size="md"
                />
              </div>
              <div className="p-5 space-y-1.5">
                <h3 className="font-serif font-semibold text-[17px] text-brand-ink">
                  {book.title}
                </h3>
                <p className="text-[13px] text-brand-slate">{book.author}</p>
                <p className="text-[12px] text-brand-teal font-medium">
                  {book.genre || book.category}
                </p>
              </div>
            </div>
          ))}
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
          element={
            <Milestone2NetworkPreview routeTitle="Home Route (/)" />
          }
        />
        <Route
          path="/login"
          element={
            <Milestone2NetworkPreview routeTitle="Login Route (/login)" />
          }
        />
        <Route
          path="/books"
          element={
            <Milestone2NetworkPreview routeTitle="Book Catalog Route (/books)" />
          }
        />
        <Route
          path="/books/:id"
          element={
            <Milestone2NetworkPreview routeTitle="Book Detail Route (/books/:id)" />
          }
        />
        <Route
          path="/holds/:id/confirmed"
          element={
            <Milestone2NetworkPreview routeTitle="Hold Confirmed Route (/holds/:id/confirmed)" />
          }
        />
        <Route
          path="/my-borrowing"
          element={
            <Milestone2NetworkPreview routeTitle="My Borrowing Route (/my-borrowing)" />
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
