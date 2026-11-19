'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { PATIENT_CONDITIONS } from '../../constants/config';
import { validatePatientForm } from '../../utils/validators';
import { User, Phone, Mail, Stethoscope } from 'lucide-react';

export default function PatientFormModal({
  isOpen,
  onClose,
  onSubmit,
  patient = null,
  doctors = [],
  isLoading = false,
}) {
  const isEditing = Boolean(patient);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    condition: 'Stable',
    doctorId: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        age: patient.age !== undefined ? String(patient.age) : '',
        gender: patient.gender || 'Male',
        condition: patient.condition || 'Stable',
        doctorId: patient.doctorId?._id || patient.doctorId || patient.doctor?._id || patient.doctor || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        notes: patient.notes || '',
      });
      setErrors({});
    } else {
      setFormData({
        name: '',
        age: '',
        gender: 'Male',
        condition: 'Stable',
        doctorId: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
      });
      setErrors({});
    }
  }, [patient, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validatePatientForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await onSubmit({
        ...formData,
        age: Number(formData.age),
      });
    } catch (err) {
      // Handled by caller/toast
    }
  };

  const doctorOptions = doctors.map((d) => ({
    value: d._id || d.id,
    label: `${d.name} (${d.specialization})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Patient Profile' : 'Register New Patient'}
      subtitle={
        isEditing
          ? 'Modify clinical and contact details for this patient.'
          : 'Enroll a new patient record and assign a medical professional.'
      }
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <Input
          label="Patient Full Name"
          name="name"
          placeholder="Robert Chen"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          icon={User}
          required
        />

        {/* Age & Gender Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Age"
            name="age"
            type="number"
            min="0"
            max="130"
            placeholder="38"
            value={formData.age}
            onChange={handleChange}
            error={errors.age}
            required
          />

          <Select
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            options={['Male', 'Female', 'Other']}
            required
          />
        </div>

        {/* Assigned Doctor & Condition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Assigned Doctor"
            name="doctorId"
            value={formData.doctorId}
            onChange={handleChange}
            options={doctorOptions}
            placeholder="Select attending doctor..."
          />

          <Select
            label="Medical Condition"
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            options={PATIENT_CONDITIONS}
          />
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Contact Phone"
            name="phone"
            placeholder="(555) 345-6789"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            icon={Phone}
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="robert.chen@example.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            icon={Mail}
          />
        </div>

        {/* Clinical Notes / Diagnosis */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Clinical Notes / Diagnosis
          </label>
          <textarea
            name="notes"
            rows="2"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Initial symptoms, allergies, medical history..."
            className="block w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
          />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Register Patient'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

