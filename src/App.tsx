import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Layout, LayoutUser } from './components/Layout';
import { BookCoverGraphic } from './components/BookCoverGraphic';

const DEMO_MAYA: LayoutUser = {
  _id: '671a9b2c8f1b2c0015a4e901',
  accountId: 'S10428',
  fullName: 'Maya Chen',
  initials: 'MC',
  role: 'student',
  yearGroup: 'Year 10',
  activeLoansCount: 2,
  maxLoansLimit: 5,
};

const ScaffoldPreview: React.FC<{
  title: string;
  subtitle: string;
  navVariant: 'guest' | 'auth' | 'student';
  onToggleMode: (mode: 'guest' | 'auth' | 'student') => void;
}> = ({ title, subtitle, navVariant, onToggleMode }) => {
  const sampleBooks = [
    { title: 'The Midnight Library', author: 'Matt Haig' },
    { title: 'The Book Thief', author: 'Markus Zusak' },
    { title: 'The Hobbit', author: 'J.R.R. Tolkien' },
    { title: 'The House on Mango Street', author: 'Sandra Cisneros' },
    { title: 'A Wrinkle in Time', author: "Madeleine L'Engle" },
    { title: 'The Giver', author: 'Lois Lowry' },
  ];

  return (
    <div className="py-10 space-y-10">
      <div className="bg-brand-beige rounded-2xl p-8 border border-brand-border flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-brand-teal">
            MILESTONE 1 · DESIGN SYSTEM &amp; SHELL READY
          </span>
          <h1 className="font-serif text-[36px] leading-tight text-brand-ink">
            {title}
          </h1>
          <p className="text-[15px] text-brand-slate leading-relaxed">
            {subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-medium text-brand-slate mr-1">
              Preview Header Mode:
            </span>
            {(['guest', 'auth', 'student'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onToggleMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  navVariant === m
                    ? 'bg-brand-teal text-white'
                    : 'bg-white text-brand-ink border border-brand-border hover:bg-brand-mint'
                }`}
              >
                {m} Header
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2 text-xs">
            <Link
              to="/"
              className="px-3 py-1.5 rounded-md bg-white border border-brand-border hover:border-brand-teal"
            >
              / (Home)
            </Link>
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-md bg-white border border-brand-border hover:border-brand-teal"
            >
              /login
            </Link>
            <Link
              to="/books"
              className="px-3 py-1.5 rounded-md bg-white border border-brand-border hover:border-brand-teal"
            >
              /books
            </Link>
            <Link
              to="/books/9781786892737"
              className="px-3 py-1.5 rounded-md bg-white border border-brand-border hover:border-brand-teal"
            >
              /books/:id
            </Link>
            <Link
              to="/holds/HLD-1042/confirmed"
              className="px-3 py-1.5 rounded-md bg-white border border-brand-border hover:border-brand-teal"
            >
              /holds/:id/confirmed
            </Link>
            <Link
              to="/my-borrowing"
              className="px-3 py-1.5 rounded-md bg-white border border-brand-border hover:border-brand-teal"
            >
              /my-borrowing
            </Link>
          </div>
        </div>

        <div className="relative rounded-xl overflow-hidden w-full lg:w-[360px] h-[240px] shrink-0 shadow-sm">
          <img
            src="/images/reading-room.png"
            alt="Westbridge School Library reading room"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-md text-[12px] font-medium text-brand-ink shadow-sm">
            A little curiosity goes a long way.
          </div>
        </div>
      </div>

      {/* Figma Vector Book Covers Showcase */}
      <div className="space-y-4">
        <h2 className="font-serif text-[24px] text-brand-ink">
          Figma Book Cover Vector Graphics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
          {sampleBooks.map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-brand-border bg-white overflow-hidden flex flex-col"
            >
              <div className="bg-brand-beige py-6 flex items-center justify-center">
                <BookCoverGraphic title={b.title} author={b.author} size="sm" />
              </div>
              <div className="p-3.5 space-y-1">
                <p className="font-serif font-semibold text-[14px] text-brand-ink line-clamp-1">
                  {b.title}
                </p>
                <p className="text-[12px] text-brand-slate">{b.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [navVariant, setNavVariant] = useState<'guest' | 'auth' | 'student'>('guest');

  return (
    <BrowserRouter>
      <Layout
        variant={navVariant}
        user={navVariant === 'student' ? DEMO_MAYA : null}
        onLogout={() => setNavVariant('guest')}
      >
        <Routes>
          <Route
            path="/"
            element={
              <ScaffoldPreview
                title="Guest Landing & Student Home Shell"
                subtitle="Route `/` is wired up with Lora & Inter typography, Figma color tokens, reading room photography, and vector book covers."
                navVariant={navVariant}
                onToggleMode={setNavVariant}
              />
            }
          />
          <Route
            path="/login"
            element={
              <ScaffoldPreview
                title="2-Step Role & Credentials Login Route (/login)"
                subtitle="Ready for Milestone 3 implementation."
                navVariant="auth"
                onToggleMode={setNavVariant}
              />
            }
          />
          <Route
            path="/books"
            element={
              <ScaffoldPreview
                title="Book Catalog Route (/books)"
                subtitle="Ready for Milestone 4 implementation."
                navVariant="student"
                onToggleMode={setNavVariant}
              />
            }
          />
          <Route
            path="/books/:id"
            element={
              <ScaffoldPreview
                title="Book Detail Route (/books/:id)"
                subtitle="Ready for Milestone 5 implementation."
                navVariant="student"
                onToggleMode={setNavVariant}
              />
            }
          />
          <Route
            path="/holds/:id/confirmed"
            element={
              <ScaffoldPreview
                title="Hold Confirmed Route (/holds/:id/confirmed)"
                subtitle="Ready for Milestone 5 implementation."
                navVariant="student"
                onToggleMode={setNavVariant}
              />
            }
          />
          <Route
            path="/my-borrowing"
            element={
              <ScaffoldPreview
                title="My Borrowing Route (/my-borrowing)"
                subtitle="Ready for Milestone 6 implementation."
                navVariant="student"
                onToggleMode={setNavVariant}
              />
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
