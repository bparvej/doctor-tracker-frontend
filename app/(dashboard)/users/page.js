'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import Pagination from '../../../components/common/Pagination';
import ConfirmModal from '../../../components/common/ConfirmModal';
import ErrorBanner from '../../../components/common/ErrorBanner';
import EmptyState from '../../../components/common/EmptyState';
import { TableSkeleton } from '../../../components/common/Skeleton';
import UserTable from '../../../components/users/UserTable';
import UserFormModal from '../../../components/users/UserFormModal';
import { userService } from '../../../services/user.service';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { useDebounce } from '../../../hooks/useDebounce';
import { APP_CONFIG } from '../../../constants/config';
import { Plus, Search, RefreshCw, Users as UsersIcon } from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, isAdmin, isLoading: authLoading } = useAuth();
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(APP_CONFIG.pagination.defaultLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/dashboard');
  }, [authLoading, isAdmin, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await userService.getUsers({ page, limit, search: debouncedSearch || undefined, role: role || undefined, isActive: status === '' ? undefined : status === 'active' });
      setUsers(result.users); setTotal(result.total); setTotalPages(result.totalPages); setPage(result.page);
    } catch (err) {
      setError(err);
      if (err.status === 403) toastError('Administrator access is required.');
    } finally { setLoading(false); }
  }, [page, limit, debouncedSearch, role, status, toastError]);

  useEffect(() => { if (isAdmin) fetchUsers(); }, [fetchUsers, isAdmin]);
  useEffect(() => setPage(1), [debouncedSearch, role, status]);

  const currentId = currentUser?._id || currentUser?.id;
  const isSelf = (target) => String(target?._id || target?.id) === String(currentId);

  const saveUser = async (form) => {
    setSaving(true);
    try {
      if (selected) await userService.updateUser(selected._id || selected.id, form);
      else await userService.createUser(form);
      success(selected ? 'User updated successfully.' : 'User created successfully.');
      setFormOpen(false); setSelected(null); await fetchUsers();
    } catch (err) { toastError(err.message || 'Failed to save user.'); }
    finally { setSaving(false); }
  };

  const confirmAction = async () => {
    if (!confirm) return;
    if (isSelf(confirm.user)) return;
    setConfirmLoading(true);
    try {
      if (confirm.type === 'delete') {
        await userService.deleteUser(confirm.user._id || confirm.user.id);
        success('User deleted successfully.');
      } else {
        await userService.updateUser(confirm.user._id || confirm.user.id, { name: confirm.user.name, email: confirm.user.email, role: String(confirm.user.role).toUpperCase(), isActive: !confirm.user.isActive });
        success(confirm.user.isActive ? 'User deactivated successfully.' : 'User activated successfully.');
      }
      setConfirm(null); await fetchUsers();
    } catch (err) { toastError(err.message || 'Action failed.'); }
    finally { setConfirmLoading(false); }
  };

  if (authLoading || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div><h2 className="text-xl font-bold text-slate-900">User Management</h2><p className="text-xs text-slate-500 mt-0.5">Manage administrators and viewer accounts.</p></div>
        <div className="flex gap-2"><Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchUsers} isLoading={loading}>Refresh</Button><Button size="sm" icon={Plus} onClick={() => { setSelected(null); setFormOpen(true); }}>Add User</Button></div>
      </div>
      {error && <ErrorBanner error={error} onRetry={fetchUsers} isRetrying={loading} />}
      <Card noPadding className="p-4 bg-white"><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><Input placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} icon={Search} /><Select value={role} onChange={(e) => setRole(e.target.value)} placeholder="All roles" options={[{ value: 'ADMIN', label: 'Admin' }, { value: 'VIEWER', label: 'Viewer' }]} /><Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} /></div></Card>
      <Card noPadding>{loading ? <TableSkeleton rows={6} columns={4} /> : users.length === 0 ? <EmptyState title="No Users Found" description="No users match the selected filters." icon={UsersIcon} /> : <><UserTable users={users} currentUserId={currentId} onEdit={(target) => { setSelected(target); setFormOpen(true); }} onToggleActive={(target) => { if (!isSelf(target)) setConfirm({ type: 'toggle', user: target }); }} onDelete={(target) => { if (!isSelf(target)) setConfirm({ type: 'delete', user: target }); }} /><Pagination currentPage={page} totalPages={totalPages} totalItems={total} pageSize={limit} onPageChange={setPage} onPageSizeChange={(value) => { setLimit(value); setPage(1); }} /></>}</Card>
      <UserFormModal isOpen={formOpen} onClose={() => { setFormOpen(false); setSelected(null); }} onSubmit={saveUser} user={selected} isLoading={saving} currentUserId={currentId} />
      <ConfirmModal isOpen={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={confirmAction} isLoading={confirmLoading} title={confirm?.type === 'delete' ? 'Delete User?' : confirm?.user?.isActive ? 'Deactivate User?' : 'Activate User?'} message={confirm?.type === 'delete' ? `Delete ${confirm?.user?.name || 'this user'}? This action cannot be undone.` : `${confirm?.user?.isActive ? 'Deactivate' : 'Activate'} ${confirm?.user?.name || 'this user'}?`} confirmText={confirm?.type === 'delete' ? 'Delete' : confirm?.user?.isActive ? 'Deactivate' : 'Activate'} confirmVariant={confirm?.type === 'delete' || confirm?.user?.isActive ? 'danger' : 'primary'} />
    </div>
  );
}