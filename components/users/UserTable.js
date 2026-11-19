'use client';

import React from 'react';
import Badge from '../common/Badge';
import { Edit2, Trash2, ToggleLeft, ToggleRight, Mail } from 'lucide-react';

export default function UserTable({ users, currentUserId, onEdit, onToggleActive, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
          <tr><th className="py-3 px-4">User</th><th className="py-3 px-4">Role</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Actions</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {users.map((user) => {
            const id = user._id || user.id;
            const isSelf = Boolean(id && currentUserId && String(id) === String(currentUserId));
            return (
              <tr key={id} className="hover:bg-slate-50/70">
                <td className="py-3.5 px-4"><div className="font-semibold text-slate-900">{user.name}</div><div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><Mail className="w-3 h-3" />{user.email}</div></td>
                <td className="py-3.5 px-4"><Badge variant={String(user.role).toUpperCase() === 'ADMIN' ? 'purple' : 'primary'} size="sm">{String(user.role).toUpperCase()}</Badge></td>
                <td className="py-3.5 px-4"><Badge variant={user.isActive !== false ? 'success' : 'danger'} size="sm">{user.isActive !== false ? 'Active' : 'Inactive'}</Badge></td>
                <td className="py-3.5 px-4 text-right"><div className="flex justify-end gap-1">
                  <button onClick={() => onEdit(user)} title="Edit user" className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => onToggleActive(user)} disabled={isSelf} title={isSelf ? 'Cannot deactivate yourself' : 'Activate or deactivate user'} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">{user.isActive !== false ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}</button>
                  <button onClick={() => onDelete(user)} disabled={isSelf} title={isSelf ? 'Cannot delete yourself' : 'Delete user'} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"><Trash2 className="w-4 h-4" /></button>
                </div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}