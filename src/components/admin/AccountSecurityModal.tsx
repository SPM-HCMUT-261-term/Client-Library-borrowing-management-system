import React, { useState } from 'react';
import { deleteAdminUserApi, resetAdminUserPasswordApi } from '../../api/admin';
import { ApiClientError } from '../../api/client';
import { AdminUser } from '../../types/api';
import { AdminModal } from './AdminModal';
import { adminInputClass } from './CreateAccountModal';

export const AccountSecurityModal: React.FC<{
  account: AdminUser;
  action: 'reset' | 'delete';
  onCancel: () => void;
  onSuccess: () => void;
}> = ({ account, action, onCancel, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [accountConfirmation, setAccountConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyBlocked, setHistoryBlocked] = useState(account.hasBorrowingHistory);
  const deleting = action === 'delete';

  const submit = async () => {
    if (isSubmitting) return;
    if (deleting && (historyBlocked || accountConfirmation !== account.accountId)) return;
    if (!deleting && password !== confirmation) { setError('Passwords do not match.'); return; }
    setError(null); setIsSubmitting(true);
    try {
      if (deleting) await deleteAdminUserApi(account.accountId);
      else await resetAdminUserPasswordApi(account.accountId, password);
      setPassword(''); setConfirmation('');
      onSuccess();
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'USER_HAS_LOAN_HISTORY') setHistoryBlocked(true);
      setError(err instanceof ApiClientError ? err.message : 'Unable to save this change. Please try again.');
    } finally { setIsSubmitting(false); }
  };

  return <AdminModal
    title={deleting ? historyBlocked ? 'Cannot delete this account' : 'Delete account?' : 'Reset password'}
    description={deleting ? historyBlocked ? `${account.fullName} (${account.accountId}) has borrowing or reservation history.` : `Permanently delete ${account.fullName} (${account.accountId}). This action cannot be undone.` : `Set a new password for ${account.fullName} (${account.accountId}). Share it securely with the account holder.`}
    confirmLabel={deleting ? 'Delete account' : 'Reset password'} danger={deleting}
    confirmDisabled={deleting && (historyBlocked || accountConfirmation !== account.accountId)}
    isSubmitting={isSubmitting} onCancel={onCancel} onConfirm={() => void submit()}>
    <fieldset disabled={isSubmitting} className="space-y-[14px] text-[13px] leading-4">
      {deleting ? historyBlocked ? <p className="text-brand-slate leading-5">Keep the account to preserve library records. You can lock it to block sign-in.</p> : <>
        <p className="text-brand-slate leading-5">Accounts with borrowing or reservation history cannot be deleted.</p>
        <label className="block font-semibold">Type {account.accountId} to confirm<input required autoComplete="off" spellCheck={false} value={accountConfirmation} onChange={e => setAccountConfirmation(e.target.value)} className={adminInputClass} /></label>
      </> : <>
        <label className="block font-semibold">New password<input required type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className={adminInputClass} /></label>
        <label className="block font-semibold">Confirm new password<input required type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className={adminInputClass} /></label>
      </>}
    </fieldset>
    {error && <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-[13px] text-red-800">{error}</p>}
  </AdminModal>;
};
