'use client';

import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

export default function UserFormModal({ isOpen, onClose, onSubmit, user = null, isLoading = false, currentUserId }) {
  const isEditing = Boolean(user);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'VIEWER', isActive: true });

  useEffect(() => {
    setForm(user ? { name: user.name || '', email: user.email || '', password: '', role: String(user.role || 'VIEWER').toUpperCase(), isActive: user.isActive !== false } : { name: '', email: '', password: '', role: 'VIEWER', isActive: true });
  }, [user, isOpen]);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  const id = user?._id || user?.id;
  const isSelf = Boolean(id && currentUserId && String(id) === String(currentUserId));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit User' : 'Create User'} subtitle={isEditing ? 'Update account details and access.' : 'Add a new administrator or viewer.'}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
        <Input label="Full Name" name="name" placeholder="Alex Morgan" value={form.name} onChange={change} required />
        <Input label="Email" name="email" type="email" placeholder="alex.morgan@hospital.org" value={form.email} onChange={change} required />
        <Input
          label={isEditing ? 'Password (leave blank to keep current)' : 'Password'}
          name="password"
          type="password"
          placeholder={isEditing ? 'Enter a new password or leave blank' : 'Create a secure password'}
          value={form.password}
          onChange={change}
          required={!isEditing}
        />
        <Select label="Role" name="role" value={form.role} onChange={change} disabled={isSelf} options={[{ value: 'ADMIN', label: 'Admin' }, { value: 'VIEWER', label: 'Viewer' }]} />
        {isSelf && <p className="text-xs text-amber-700">You cannot change your own role.</p>}
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input type="checkbox" name="isActive" checked={form.isActive} onChange={change} disabled={isSelf} className="h-4 w-4 rounded border-slate-300 text-primary-600" />
          Active account
        </label>
        {isSelf && <p className="text-xs text-amber-700">You cannot deactivate your own account.</p>}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>{isEditing ? 'Save Changes' : 'Create User'}</Button>
        </div>
      </form>
    </Modal>
  );
}