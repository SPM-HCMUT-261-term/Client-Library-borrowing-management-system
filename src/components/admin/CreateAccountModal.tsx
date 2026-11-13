import React, { useState } from 'react';
import { createAdminUserApi } from '../../api/admin';
import { ApiClientError } from '../../api/client';
import { AdminUser, UserRole } from '../../types/api';
import { AdminModal } from './AdminModal';

export const adminInputClass = 'mt-[9px] h-12 w-full rounded-lg border border-brand-border bg-white px-[14px] text-[14px] font-normal text-brand-ink outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal disabled:opacity-60';

export const CreateAccountModal: React.FC<{ onCancel: () => void; onCreated: (user: AdminUser) => void }> = ({ onCancel, onCreated }) => {
  const [accountId, setAccountId] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [yearGroup, setYearGroup] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const create = async () => {
    if (isSubmitting) return;
    if (!accountId.trim() || !fullName.trim()) { setError('Enter a school account ID and full name.'); return; }
    if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(fullName.trim())) { setError('Full name must contain only English or Vietnamese letters and spaces.'); return; }
    if (password !== confirmation) { setError('Passwords do not match.'); return; }
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await createAdminUserApi({ accountId: accountId.trim(), fullName: fullName.trim(), role, yearGroup: role === 'student' ? yearGroup.trim() || null : null, password });
      setPassword(''); setConfirmation('');
      onCreated(user);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to create this account. Please try again.');
    } finally { setIsSubmitting(false); }
  };

  return <AdminModal title="Create school account" description="Add a school-issued account and assign its initial role." confirmLabel="Create account" isSubmitting={isSubmitting} onCancel={onCancel} onConfirm={() => void create()}>
    <fieldset disabled={isSubmitting} className="space-y-[14px] text-[13px] leading-4 font-semibold">
      <label className="block">School account ID<input required autoComplete="off" value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="e.g. S10429" className={adminInputClass} /></label>
      <label className="block">Full name<input required autoComplete="off" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Jamie Wilson" className={adminInputClass} /></label>
      <label className="block">Assigned role<select value={role} onChange={e => setRole(e.target.value as UserRole)} className={adminInputClass}><option value="student">Student</option><option value="staff">Staff</option><option value="admin">Admin</option></select></label>
      {role === 'student' && <label className="block">Year group <span className="font-normal text-brand-slate">(optional)</span><input value={yearGroup} onChange={e => setYearGroup(e.target.value)} placeholder="e.g. Year 10" className={adminInputClass} /></label>}
      <label className="block">Initial password<input required type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className={adminInputClass} /></label>
      <label className="block">Confirm password<input required type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className={adminInputClass} /></label>
    </fieldset>
    {error && <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-[13px] text-red-800">{error}</p>}
  </AdminModal>;
};
