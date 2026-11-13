import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminUsersApi } from '../../api/admin';
import { ApiClientError } from '../../api/client';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminUser, AdminUsersPage, UserRole, UserStatus } from '../../types/api';

function roleLabel(role: UserRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function borrowingAccess(user: AdminUser) {
  if (user.role !== 'student') return { label: '—', tone: '' };
  if (user.overdueLoansCount > 0 || user.unpaidFines > 0) {
    return { label: 'Restricted', tone: 'bg-brand-amberSurface text-brand-amberText' };
  }
  return { label: 'Eligible', tone: 'bg-brand-mint text-brand-teal' };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export const AdminAccountsPage: React.FC = () => {
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<'all' | UserRole>('all');
  const [status, setStatus] = useState<'all' | UserStatus>('all');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<AdminUsersPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setResult(await getAdminUsersApi({ q: query, role, status, page, limit: 6 }));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load school accounts.');
    } finally {
      setIsLoading(false);
    }
  }, [page, query, role, status]);

  useEffect(() => { void loadAccounts(); }, [loadAccounts]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setQuery(queryInput.trim());
  };

  return (
    <div>
      <AdminPageHeader breadcrumb="Home / Accounts" title="School accounts" description="Find school accounts, manage assigned roles, and review account access." icon={UsersRound} />
      <section className="mt-[23px] rounded-[10px] border border-brand-border bg-white p-6 min-h-[618px]">
        <h2 className="text-[17px] leading-[25px] font-semibold">Account directory</h2>
        <p className="mt-0.5 text-[13px] text-brand-slate">School-issued accounts and their current access.</p>

        <form onSubmit={submitSearch} className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_140px_152px_88px] gap-3">
          <label className="h-10 rounded-md border border-brand-border px-2.5 flex items-center gap-2.5 focus-within:border-brand-teal">
            <Search className="w-[17px] h-[17px] text-brand-teal" />
            <input value={queryInput} onChange={(e) => setQueryInput(e.target.value)} className="w-full outline-none text-[13px] text-brand-ink placeholder:text-brand-slate" placeholder="Search by name or school account ID" />
          </label>
          <select value={role} onChange={(e) => { setRole(e.target.value as 'all' | UserRole); setPage(1); }} className="h-10 rounded-md border border-brand-border bg-white px-3 text-[13px] font-semibold text-brand-teal outline-none">
            <option value="all">Role: All</option><option value="student">Student</option><option value="staff">Staff</option><option value="admin">Admin</option>
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value as 'all' | UserStatus); setPage(1); }} className="h-10 rounded-md border border-brand-border bg-white px-3 text-[13px] font-semibold text-brand-teal outline-none">
            <option value="all">Access: All</option><option value="Active">Active</option><option value="Inactive">Locked</option>
          </select>
          <button type="submit" className="h-10 rounded-md border border-brand-border bg-white text-[13px] font-semibold text-brand-teal hover:border-brand-teal">Search</button>
        </form>

        <div className="mt-3 rounded-md border border-brand-border overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left">
            <thead className="h-[38px] bg-brand-beige text-[10px] text-brand-slate">
              <tr><th className="px-4 font-semibold w-[24%]">ACCOUNT</th><th className="px-4 font-semibold w-[11%]">ROLE</th><th className="px-4 font-semibold w-[15%]">ACCOUNT ACCESS</th><th className="px-4 font-semibold w-[17%]">BORROWING ACCESS</th><th className="px-4 font-semibold w-[16%]">LAST CHANGE</th><th className="px-4 font-semibold">ACTION</th></tr>
            </thead>
            <tbody className="text-[13px]">
              {isLoading && <tr><td colSpan={6} className="h-[189px] text-center text-brand-slate">Loading accounts…</td></tr>}
              {!isLoading && error && <tr><td colSpan={6} className="h-[189px] text-center"><p className="text-red-700">{error}</p><button onClick={() => void loadAccounts()} className="mt-2 text-brand-teal font-semibold hover:underline">Try again</button></td></tr>}
              {!isLoading && !error && result?.items.length === 0 && <tr><td colSpan={6} className="h-[189px] text-center text-brand-slate">No accounts match these filters.</td></tr>}
              {!isLoading && !error && result?.items.map((account) => {
                const borrowing = borrowingAccess(account);
                return (
                  <tr key={account._id} className="h-[63px] border-t border-brand-border">
                    <td className="px-4"><div className="font-semibold text-brand-ink">{account.fullName}</div><div className="text-[11px] text-brand-slate mt-0.5">{account.accountId}</div></td>
                    <td className="px-4">{roleLabel(account.role)}</td>
                    <td className="px-4"><span className={`inline-flex rounded px-2.5 py-1 text-[11px] font-semibold ${account.status === 'Active' ? 'bg-brand-mint text-brand-teal' : 'bg-red-50 text-red-700'}`}>{account.status === 'Active' ? 'Active' : 'Locked'}</span></td>
                    <td className="px-4">{borrowing.tone ? <span className={`inline-flex rounded px-2.5 py-1 text-[11px] font-semibold ${borrowing.tone}`}>{borrowing.label}</span> : borrowing.label}</td>
                    <td className="px-4">{formatDate(account.updatedAt)}</td>
                    <td className="px-4"><Link to={`/admin/accounts/${encodeURIComponent(account.accountId)}`} className="font-semibold text-brand-teal hover:underline">View account</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-[12px] text-brand-slate">
          <span>Showing {result?.items.length ?? 0} of {result?.pagination.totalItems ?? 0} accounts</span>
          {(result?.pagination.totalPages ?? 0) > 1 && <div className="flex items-center gap-2"><button aria-label="Previous page" disabled={page <= 1 || isLoading} onClick={() => setPage((p) => p - 1)} className="w-8 h-8 border border-brand-border rounded flex items-center justify-center disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button><span>Page {page} of {result?.pagination.totalPages}</span><button aria-label="Next page" disabled={page >= (result?.pagination.totalPages ?? 1) || isLoading} onClick={() => setPage((p) => p + 1)} className="w-8 h-8 border border-brand-border rounded flex items-center justify-center disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button></div>}
        </div>
      </section>
    </div>
  );
};
