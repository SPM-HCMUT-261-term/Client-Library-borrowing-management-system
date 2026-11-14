import React, { useState } from 'react';
import { UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { useAuth } from '../../context/AuthContext';

export const AdminProfilePage: React.FC = () => {
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
    <div>
      <AdminPageHeader breadcrumb="Home / My profile" title="My profile" description="View your school-issued account and session details." icon={UserRound} iconClassName="bg-[#3B6EF5]" />
      <div className="mt-[23px] grid grid-cols-1 lg:grid-cols-[1.36fr_1fr] gap-4">
        <section className="min-h-[430px] rounded-[10px] border border-brand-border bg-white p-6">
          <h2 className="text-[17px] font-semibold">{user?.fullName}</h2>
          <p className="mt-0.5 text-[13px] text-brand-slate">Westbridge School Library</p>
          <dl className="mt-4">
            <div className="min-h-[42px] grid grid-cols-[124px_1fr] sm:grid-cols-[175px_1fr] items-center"><dt className="text-[13px] text-brand-slate">School account ID</dt><dd className="text-[14px] font-semibold">{user?.accountId}</dd></div>
            <div className="min-h-[42px] grid grid-cols-[124px_1fr] sm:grid-cols-[175px_1fr] items-center"><dt className="text-[13px] text-brand-slate">Assigned role</dt><dd className="text-[14px] font-semibold">Admin</dd></div>
            <div className="min-h-[42px] grid grid-cols-[124px_1fr] sm:grid-cols-[175px_1fr] items-center"><dt className="text-[13px] text-brand-slate">Account access</dt><dd className="text-[14px] font-semibold">{user?.status}</dd></div>
          </dl>
          <div className="mt-2 pt-3 border-t border-brand-border">
            <button type="button" onClick={() => setModalOpen(true)} className="h-10 px-5 rounded-md border border-brand-border text-[13px] font-semibold text-brand-teal hover:border-brand-teal">Sign out</button>
          </div>
        </section>

        <aside className="min-h-[193px] lg:min-h-0 lg:h-[193px] rounded-[10px] border border-brand-border bg-white p-6">
          <h2 className="text-[17px] font-semibold">Account access</h2>
          <p className="mt-0.5 text-[13px] leading-5 text-brand-slate">Manage your password through the school account recovery process.</p>
          <button type="button" disabled className="mt-4 h-10 px-5 rounded-md border border-brand-border text-[13px] font-semibold text-brand-teal opacity-60 cursor-not-allowed">Password recovery</button>
        </aside>
      </div>

      {modalOpen && <AdminModal title="Sign out of Chapter?" description="This ends your current admin session on this device." confirmLabel="Sign out" isSubmitting={isSigningOut} onCancel={() => setModalOpen(false)} onConfirm={() => void signOut()} />}
    </div>
  );
};
