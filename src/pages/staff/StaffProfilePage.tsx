import React, { useState } from 'react';
import { ArrowLeft, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminModal } from '../../components/admin/AdminModal';
import { useAuth } from '../../context/AuthContext';
import { formatBorrowingToday } from '../../utils/borrowingDates';

export const StaffProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    setIsSigningOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[13px] text-brand-slate">
        <span>Staff panel / My profile</span>
        <span>{formatBorrowingToday()}</span>
      </div>

      <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <span className="w-11 h-11 rounded-[11px] bg-brand-teal text-white flex items-center justify-center shrink-0">
            <UserRound className="w-5 h-5 stroke-[1.8]" />
          </span>
          <div>
            <h1 className="font-serif text-[32px] leading-[40px] font-semibold text-brand-ink">
              My profile
            </h1>
            <p className="mt-1 text-[14px] text-brand-slate">
              View your school-issued account and session details.
            </p>
          </div>
        </div>

        <Link
          to="/staff"
          className="h-10 px-4 rounded-md border border-brand-border bg-white inline-flex items-center gap-2 text-[13px] font-semibold text-brand-teal hover:border-brand-teal shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </Link>
      </div>

      <div className="mt-6 max-w-[720px]">
        <section className="rounded-[10px] border border-brand-border bg-white p-6">
          <h2 className="text-[17px] font-semibold text-brand-ink">
            {user?.fullName}
          </h2>
          <p className="mt-0.5 text-[13px] text-brand-slate">
            Westbridge School Library
          </p>

          <dl className="mt-4">
            <div className="min-h-[42px] grid grid-cols-[124px_1fr] sm:grid-cols-[175px_1fr] items-center">
              <dt className="text-[13px] text-brand-slate">
                School account ID
              </dt>
              <dd className="text-[14px] font-semibold text-brand-ink">
                {user?.accountId}
              </dd>
            </div>
            <div className="min-h-[42px] grid grid-cols-[124px_1fr] sm:grid-cols-[175px_1fr] items-center">
              <dt className="text-[13px] text-brand-slate">Assigned role</dt>
              <dd className="text-[14px] font-semibold text-brand-ink">
                Staff
              </dd>
            </div>
            <div className="min-h-[42px] grid grid-cols-[124px_1fr] sm:grid-cols-[175px_1fr] items-center">
              <dt className="text-[13px] text-brand-slate">Account access</dt>
              <dd className="text-[14px] font-semibold text-brand-ink">
                {user?.status}
              </dd>
            </div>
          </dl>

          <div className="mt-4 pt-4 border-t border-brand-border">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="h-10 px-5 rounded-md border border-brand-border text-[13px] font-semibold text-brand-teal hover:border-brand-teal"
            >
              Sign out
            </button>
          </div>
        </section>
      </div>

      {modalOpen && (
        <AdminModal
          title="Sign out of Chapter?"
          description="This ends your current staff session on this device."
          confirmLabel="Sign out"
          isSubmitting={isSigningOut}
          onCancel={() => setModalOpen(false)}
          onConfirm={() => void signOut()}
        />
      )}
    </div>
  );
};
