'use client';

import React from 'react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatDate, formatDateTime, formatPhone } from '../../utils/formatters';
import { Mail, Phone, Building, Stethoscope, Calendar, Users, Edit2 } from 'lucide-react';

export default function DoctorDetailModal({
  isOpen,
  onClose,
  doctor,
  onEdit,
  onManagePatients,
}) {
  if (!doctor) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Doctor Profile Details"
      subtitle={`ID: ${doctor._id || doctor.id || '—'}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 font-bold text-xl flex items-center justify-center border border-primary-200">
            {doctor.name ? doctor.name[0].toUpperCase() : 'D'}
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">{doctor.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="primary" size="sm">
                {doctor.specialization}
              </Badge>
              <span className="text-xs text-slate-500 font-medium">
                {doctor.hospital}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 block font-medium mb-1">Email Address</span>
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
              <Mail className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
              <span>{doctor.email}</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 block font-medium mb-1">Contact Phone</span>
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <Phone className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
              <span>{formatPhone(doctor.phone)}</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 block font-medium mb-1">Affiliated Hospital</span>
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
              <Building className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
              <span>{doctor.hospital}</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 block font-medium mb-1">Date Enrolled</span>
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
              <span>{formatDate(doctor.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            icon={Users}
            onClick={() => {
              onClose();
              onManagePatients(doctor);
            }}
          >
            Manage Patients
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              variant="brand"
              size="sm"
              icon={Edit2}
              onClick={() => {
                onClose();
                onEdit(doctor);
              }}
            >
              Edit Details
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

