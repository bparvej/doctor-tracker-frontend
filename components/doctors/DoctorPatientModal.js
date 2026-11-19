'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import ConfirmModal from '../common/ConfirmModal';
import { TableSkeleton } from '../common/Skeleton';
import { doctorService } from '../../services/doctor.service';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';
import { PATIENT_CONDITIONS } from '../../constants/config';
import { Users, UserPlus, Trash2, HeartPulse, User } from 'lucide-react';

export default function DoctorPatientModal({
  isOpen,
  onClose,
  doctor,
  onPatientCountChanged,
}) {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientToRemove, setPatientToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    condition: 'Stable',
    phone: '',
    email: '',
  });

  const loadPatients = useCallback(async () => {
    if (!doctor) return;
    setIsLoading(true);
    try {
      const docId = doctor._id || doctor.id;
      const res = await doctorService.getDoctorPatients(docId);
      setPatients(res.patients || []);
    } catch (err) {
      toastError(err.message || 'Failed to load associated patients.');
    } finally {
      setIsLoading(false);
    }
  }, [doctor, toastError]);

  useEffect(() => {
    if (isOpen && doctor) {
      loadPatients();
      setShowAddForm(false);
    }
  }, [isOpen, doctor, loadPatients]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.age) {
      toastError('Patient name and age are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const docId = doctor._id || doctor.id;
      await doctorService.addPatientToDoctor(docId, {
        ...formData,
        age: Number(formData.age),
        doctorId: docId,
      });

      toastSuccess(`Patient ${formData.name} assigned to ${doctor.name}.`);
      setFormData({
        name: '',
        age: '',
        gender: 'Male',
        condition: 'Stable',
        phone: '',
        email: '',
      });
      setShowAddForm(false);
      await loadPatients();
      if (onPatientCountChanged) onPatientCountChanged();
    } catch (err) {
      toastError(err.message || 'Failed to add patient under this doctor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!patientToRemove || !doctor) return;
    setIsRemoving(true);
    try {
      const docId = doctor._id || doctor.id;
      const patId = patientToRemove._id || patientToRemove.id;
      await doctorService.removePatientFromDoctor(docId, patId);

      toastSuccess(`Patient removed from ${doctor.name}'s care.`);
      setPatientToRemove(null);
      await loadPatients();
      if (onPatientCountChanged) onPatientCountChanged();
    } catch (err) {
      toastError(err.message || 'Failed to remove patient.');
    } finally {
      setIsRemoving(false);
    }
  };

  if (!doctor) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Patients Under ${doctor.name}`}
        subtitle={`Specialization: ${doctor.specialization} • ${doctor.hospital}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Header Action: Add Patient Button */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-600">
              Assigned Patients ({patients.length})
            </span>
            <Button
              variant={showAddForm ? 'secondary' : 'primary'}
              size="sm"
              icon={UserPlus}
              onClick={() => setShowAddForm((prev) => !prev)}
            >
              {showAddForm ? 'Cancel Form' : 'Add Patient Under Doctor'}
            </Button>
          </div>

          {/* Add Patient Collapsible Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddPatient}
              className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3"
            >
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                New Patient Assignment
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Patient Name"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Age"
                  name="age"
                  type="number"
                  placeholder="45"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  options={['Male', 'Female', 'Other']}
                />
                <Select
                  label="Condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  options={PATIENT_CONDITIONS}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Phone (optional)"
                  name="phone"
                  placeholder="(555) 000-0000"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
                <Input
                  label="Email (optional)"
                  name="email"
                  type="email"
                  placeholder="patient@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  Save Patient
                </Button>
              </div>
            </form>
          )}

          {/* Patients Listing */}
          {isLoading ? (
            <TableSkeleton rows={3} columns={4} />
          ) : patients.length === 0 ? (
            <EmptyState
              title="No patients currently assigned"
              description={`Dr. ${doctor.name} currently has no active patient records assigned.`}
              icon={Users}
              actionLabel="Add First Patient"
              onAction={() => setShowAddForm(true)}
              className="py-8"
            />
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Condition</th>
                    <th className="py-2.5 px-3">Age/Gender</th>
                    <th className="py-2.5 px-3">Registered</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((pat) => (
                    <tr key={pat._id || pat.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {pat.name}
                        {pat.phone && (
                          <span className="block text-[11px] text-slate-400 font-normal">
                            {pat.phone}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="primary" size="sm">
                          {pat.condition || 'General'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {pat.age ? `${pat.age} yrs` : '—'} • {pat.gender || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {formatDate(pat.createdAt || pat.registrationDate)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setPatientToRemove(pat)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove patient from doctor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for removing patient */}
      <ConfirmModal
        isOpen={Boolean(patientToRemove)}
        onClose={() => setPatientToRemove(null)}
        onConfirm={handleRemoveConfirm}
        title="Remove Patient"
        message={`Are you sure you want to remove ${patientToRemove?.name} from Dr. ${doctor.name}'s care?`}
        confirmText="Remove"
        confirmVariant="danger"
        isLoading={isRemoving}
      />
    </>
  );
}

