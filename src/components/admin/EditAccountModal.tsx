import React, { useState } from 'react';
import { updateAdminUserApi } from '../../api/admin';
import { ApiClientError } from '../../api/client';
import { AdminUser } from '../../types/api';
import { AdminModal } from './AdminModal';
import { adminInputClass } from './CreateAccountModal';

export const EditAccountModal: React.FC<{ account: AdminUser; onCancel: () => void; onSaved: (account: AdminUser) => void }> = ({ account, onCancel, onSaved }) => {
  const [fullName, setFullName] = useState(account.fullName);
  const [yearGroup, setYearGroup] = useState(account.yearGroup || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const save = async () => {
    if (isSubmitting) return;
    if (!fullName.trim()) { setError('Full name is required.'); return; }
    setError(null); setIsSubmitting(true);
    try {
      onSaved(await updateAdminUserApi(account.accountId, {
        fullName: fullName.trim(), yearGroup: account.role === 'student' ? yearGroup.trim() || null : null,
        role: account.role, status: account.status,
      }));
    } catch (err) { setError(err instanceof ApiClientError ? err.message : 'Unable to update this account. Please try again.'); }
    finally { setIsSubmitting(false); }
  };
  return <AdminModal title="Edit account details" description={`Update the name${account.role === 'student' ? ' and year group' : ''} for ${account.fullName} (${account.accountId}).`} confirmLabel="Save changes" isSubmitting={isSubmitting} onCancel={onCancel} onConfirm={() => void save()}>
    <fieldset disabled={isSubmitting} className="space-y-[14px] text-[13px] leading-4 font-semibold">
      <label className="block">Full name<input required autoComplete="off" value={fullName} onChange={e => setFullName(e.target.value)} className={adminInputClass} /></label>
      {account.role === 'student' && <label className="block">Year group <span className="font-normal text-brand-slate">(optional)</span><input value={yearGroup} onChange={e => setYearGroup(e.target.value)} placeholder="e.g. Year 10" className={adminInputClass} /></label>}
    </fieldset>
    {error && <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-[13px] text-red-800">{error}</p>}
  </AdminModal>;
};
