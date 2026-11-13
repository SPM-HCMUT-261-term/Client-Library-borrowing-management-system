import React, { useCallback, useEffect, useState } from 'react';
import { UsersRound } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AccountSecurityModal } from '../../components/admin/AccountSecurityModal';
import { useAuth } from '../../context/AuthContext';
import { getAdminUserApi, updateAdminUserApi } from '../../api/admin';
import { ApiClientError } from '../../api/client';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminUser, UserRole } from '../../types/api';

const roleNames: Record<UserRole, string> = { student: 'Student', staff: 'Staff', admin: 'Admin' };
const rolePermissions: Record<UserRole, string> = {
  student: 'Browse the catalog, view personal loans, and request eligible renewals.',
  staff: 'Manage books and copies, issue and return loans, and resolve violations.',
  admin: 'Manage school accounts, assigned roles, and library oversight.',
};

function borrowingLabel(account: AdminUser) {
  if (account.role !== 'student') return 'Student borrowing unavailable';
  if (account.overdueLoansCount > 0) return 'Restricted · Overdue loan';
  if (account.unpaidFines > 0) return 'Restricted · Unpaid fine';
  return 'Eligible';
}

export const AdminAccountDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [securityAction, setSecurityAction] = useState<'reset' | 'delete' | null>(null);
  const { id = '' } = useParams();
  const [account, setAccount] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(location.state?.message || null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAccount = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminUserApi(id);
      setAccount(data);
      setSelectedRole(data.role);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load this account.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadAccount(); }, [loadAccount]);

  const saveUpdate = async (role: UserRole, status: 'Active' | 'Inactive') => {
    if (!account) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await updateAdminUserApi(account.accountId, {
        fullName: account.fullName,
        role,
        yearGroup: role === 'student' ? account.yearGroup : null,
        status,
      });
      setAccount(updated);
      setSelectedRole(updated.role);
      setSuccessMessage(
        role !== account.role
          ? `Role updated to ${roleNames[role]}.`
          : status === 'Active'
            ? 'Account unlocked.'
            : 'Account locked.',
      );
      setRoleModalOpen(false);
      setAccessModalOpen(false);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to update this account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="py-24 text-center text-brand-slate">Loading account details…</div>;

  return (
    <div>
      <AdminPageHeader
        breadcrumb={`Home / Accounts / ${account?.accountId || id}`}
        title="Account details"
        description="Review assigned permissions and access for this school account."
        icon={UsersRound}
        action={<Link to="/admin/accounts" className="h-10 px-5 rounded-md border border-brand-border bg-white inline-flex items-center text-[13px] font-semibold text-brand-teal">All accounts</Link>}
      />

      {error && !account && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5 text-[13px] text-red-800">{error}<button onClick={() => void loadAccount()} className="ml-3 font-semibold underline">Try again</button></div>}

      {account && (
        <div className="mt-[23px] grid grid-cols-1 lg:grid-cols-[1.36fr_1fr] gap-4">
          <section className="min-h-[493px] rounded-[10px] border border-brand-border bg-white p-6">
            <div>
              <h2 className="text-[17px] font-semibold">{account.fullName}</h2>
              <p className="mt-0.5 text-[13px] text-brand-slate">{account.accountId} · School-issued account</p>
            </div>

            {successMessage && <div role="status" className="mt-4 rounded-md bg-[#E8F5EF] px-3 py-3 text-[13px] text-brand-teal"><strong>{successMessage}</strong><div className="mt-0.5 text-[12px]">This change has been saved.</div></div>}
            {error && <div role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-3 text-[13px] text-red-800">{error}</div>}

            <dl className="mt-4">
              <div className="min-h-[42px] grid grid-cols-[124px_1fr] sm:grid-cols-[175px_1fr] items-center"><dt className="text-[13px] text-brand-slate">Assigned role</dt><dd className="text-[14px] font-semibold">{roleNames[account.role]}</dd></div>
              <div className="min-h-[42px] grid grid-cols-[124px_1fr] sm:grid-cols-[175px_1fr] items-center"><dt className="text-[13px] text-brand-slate">Account access</dt><dd className="text-[14px] font-semibold">{account.status === 'Active' ? 'Active' : 'Locked · Manual'}</dd></div>
              <div className="min-h-[42px] grid grid-cols-[124px_1fr] sm:grid-cols-[175px_1fr] items-center"><dt className="text-[13px] text-brand-slate">Borrowing access</dt><dd className="text-[14px] font-semibold">{borrowingLabel(account)}</dd></div>
            </dl>

            <div className="mt-2 pt-3 border-t border-brand-border flex flex-wrap gap-3">
              <button type="button" onClick={() => setSecurityAction('reset')} className="h-10 px-5 rounded-md border border-brand-border text-[13px] font-semibold text-brand-teal hover:border-brand-teal">Reset password</button>
              <button type="button" onClick={() => { setSelectedRole(account.role); setRoleModalOpen(true); }} className="h-10 px-5 rounded-md border border-brand-border text-[13px] font-semibold text-brand-teal hover:border-brand-teal">Change role</button>
              <button type="button" onClick={() => setAccessModalOpen(true)} className={`h-10 px-5 rounded-md text-[13px] font-semibold ${account.status === 'Active' ? 'bg-[#A1372B] text-white' : 'border border-brand-border text-brand-teal'}`}>{account.status === 'Active' ? 'Lock account' : 'Unlock account'}</button>
            </div>
            <div className="mt-4">
              <p className="text-[13px] text-brand-slate">Accounts with borrowing or reservation history cannot be deleted.</p>
              <button type="button" onClick={() => setSecurityAction('delete')} className="mt-2 h-10 px-5 rounded-md bg-[#A1372B] hover:bg-[#842D23] text-[13px] font-semibold text-white">Delete account</button>
            </div>
          </section>

          <aside className="min-h-[493px] rounded-[10px] border border-brand-border bg-white p-6">
            <h2 className="text-[17px] font-semibold">Access details</h2>
            <p className="mt-0.5 text-[13px] text-brand-slate">Sign-in access and borrowing eligibility are tracked separately.</p>

            {account.role === 'student' && (account.overdueLoansCount > 0 || account.unpaidFines > 0) ? (
              <div className="mt-4 rounded-md bg-[#FFF4E6] p-3 text-brand-amberText">
                <p className="text-[13px] font-semibold">Borrowing restricted</p>
                <p className="mt-1 text-[12px] leading-5">This student has an overdue loan or unpaid charge. New borrowing is blocked.</p>
              </div>
            ) : account.role !== 'student' && account.hasBorrowingHistory ? (
              <div className="mt-4 rounded-md bg-[#FFF4E6] p-3 text-brand-amberText">
                <p className="text-[13px] font-semibold">Previous student borrowing record</p>
                <p className="mt-1 text-[12px] leading-5">The existing borrowing history remains on record after the role change.</p>
              </div>
            ) : (
              <div className="mt-4 rounded-md bg-brand-mint p-3 text-brand-teal">
                <p className="text-[13px] font-semibold">Access available</p>
                <p className="mt-1 text-[12px] leading-5">No current borrowing restriction is recorded for this account.</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-brand-border">
              <h3 className="text-[13px] font-semibold">Role permissions</h3>
              <p className="mt-3 text-[13px] leading-5 text-brand-slate">{rolePermissions[account.role]}</p>
            </div>
          </aside>
        </div>
      )}

      {account && securityAction && <AccountSecurityModal account={account} action={securityAction} onCancel={() => setSecurityAction(null)} onSuccess={() => {
        setSecurityAction(null);
        if (securityAction === 'reset') { setSuccessMessage('Password reset successfully.'); return; }
        if (account.accountId === user?.accountId) { void logout().then(() => navigate('/login', { replace: true })); return; }
        navigate('/admin/accounts', { replace: true, state: { message: `Account ${account.accountId} deleted successfully.` } });
      }} />}

      {account && roleModalOpen && (
        <AdminModal title={`Change ${account.fullName}’s role`} description={`This changes the permissions assigned to ${account.fullName} (${account.accountId}).`} confirmLabel="Save role" isSubmitting={isSubmitting} onCancel={() => setRoleModalOpen(false)} onConfirm={() => void saveUpdate(selectedRole, account.status)}>
          <p className="text-[13px] font-semibold">New role · Current role: {roleNames[account.role]}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {(['student', 'staff', 'admin'] as UserRole[]).map((role) => <label key={role} className={`h-[38px] rounded-md border px-2.5 flex items-center gap-2 text-[13px] cursor-pointer ${selectedRole === role ? 'border-brand-teal bg-brand-mint font-semibold text-brand-teal' : 'border-brand-border'}`}><input type="radio" name="role" value={role} checked={selectedRole === role} onChange={() => setSelectedRole(role)} className="accent-[#17645F]" />{roleNames[role]}</label>)}
          </div>
        </AdminModal>
      )}

      {account && accessModalOpen && (
        <AdminModal title={`${account.status === 'Active' ? 'Lock' : 'Unlock'} ${account.fullName}’s account?`} description={account.status === 'Active' ? 'This blocks sign-in for this school account. Existing borrowing records remain unchanged.' : 'This restores sign-in access. Existing borrowing restrictions remain unchanged.'} confirmLabel={account.status === 'Active' ? 'Lock account' : 'Unlock account'} isSubmitting={isSubmitting} onCancel={() => setAccessModalOpen(false)} onConfirm={() => void saveUpdate(account.role, account.status === 'Active' ? 'Inactive' : 'Active')} />
      )}
    </div>
  );
};
