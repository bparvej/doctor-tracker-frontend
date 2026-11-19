'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { MEDICAL_SPECIALIZATIONS } from '../../constants/config';
import { validateDoctorForm } from '../../utils/validators';
import { User, Mail, Phone, Building, Stethoscope } from 'lucide-react';

export default function DoctorFormModal({
  isOpen,
  onClose,
  onSubmit,
  doctor = null,
  isLoading = false,
}) {
  const isEditing = Boolean(doctor);

  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    hospital: '',
    phone: '',
    email: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || '',
        specialization: doctor.specialization || '',
        hospital: doctor.hospital || '',
        phone: doctor.phone || '',
        email: doctor.email || '',
      });
      setErrors({});
    } else {
      setFormData({
        name: '',
        specialization: '',
        hospital: '',
        phone: '',
        email: '',
      });
      setErrors({});
    }
  }, [doctor, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateDoctorForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      // API error handled by parent or toast
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Doctor Profile' : 'Add New Doctor'}
      subtitle={
        isEditing
          ? 'Update the professional details of this doctor.'
          : 'Register a new doctor into the Doctor Tracker database.'
      }
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <Input
          label="Doctor Full Name"
          name="name"
          placeholder="Dr. Sarah Jenkins"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          icon={User}
          required
        />

        {/* Specialization */}
        <Select
          label="Specialization"
          name="specialization"
          value={formData.specialization}
          onChange={handleChange}
          options={MEDICAL_SPECIALIZATIONS}
          error={errors.specialization}
          placeholder="Select medical specialization..."
          required
        />

        {/* Hospital */}
        <Input
          label="Hospital / Clinic"
          name="hospital"
          placeholder="Central Valley Memorial Hospital"
          value={formData.hospital}
          onChange={handleChange}
          error={errors.hospital}
          icon={Building}
          required
        />

        {/* Email & Phone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="sarah.jenkins@hospital.org"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            icon={Mail}
            required
          />

          <Input
            label="Phone Number"
            name="phone"
            placeholder="(555) 234-5678"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            icon={Phone}
            required
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            {isEditing ? 'Save Changes' : 'Create Doctor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

