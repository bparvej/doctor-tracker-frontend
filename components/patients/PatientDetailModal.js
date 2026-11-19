'use client';

import React from 'react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatDate, formatPhone } from '../../utils/formatters';
import { Mail, Phone, Calendar, Stethoscope, User, HeartPulse, Edit2, FileText } from 'lucide-react';

export default function PatientDetailModal({
  isOpen,
  onClose,
  patient,
  onEdit,
}) {
  if (!patient) return null;

  const doctorName =
    patient.doctorId?.name ||
    patient.doctorName ||
    patient.doctor?.name ||
    'Unassigned';

  const doctorSpecialization =
    patient.doctorId?.specialization ||
    patient.doctor?.specialization ||
    '';

  const getConditionVariant = (cond) => {
    switch (cond?.toLowerCase()) {
      case 'critical':
        return 'danger';
      case 'stable':
        return 'success';
      case 'under observation':
        return 'warning';
      case 'recovering':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Patient Clinical Profile"
      subtitle={`Patient Record ID: ${patient._id || patient.id || '—'}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        {/* Header Summary Card */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-700 font-bold text-xl flex items-center justify-center border border-brand-200">
            {patient.name ? patient.name[0].toUpperCase() : 'P'}
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">{patient.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getConditionVariant(patient.condition)} size="sm">
                {patient.condition || 'General'}
              </Badge>
              <span className="text-xs text-slate-500 font-medium">
                {patient.age ? `${patient.age} years old` : ''} • {patient.gender || 'Not specified'}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Attending Doctor */}
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 block font-medium mb-1">Attending Doctor</span>
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
              <Stethoscope className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
              <span>{doctorName}</span>
            </div>
            {doctorSpecialization && (
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {doctorSpecialization}
              </span>
            )}
          </div>

          {/* Registration Date */}
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 block font-medium mb-1">Registration Date</span>
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
              <span>{formatDate(patient.createdAt || patient.registrationDate)}</span>
            </div>
          </div>

          {/* Contact Phone */}
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 block font-medium mb-1">Contact Phone</span>
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <Phone className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
              <span>{patient.phone ? formatPhone(patient.phone) : '—'}</span>
            </div>
          </div>

          {/* Contact Email */}
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 block font-medium mb-1">Email Address</span>
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
              <Mail className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
              <span>{patient.email || '—'}</span>
            </div>
          </div>
        </div>

        {/* Clinical Notes */}
        {patient.notes && (
          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Clinical Observations & Notes</span>
            </div>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {patient.notes}
            </p>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="brand"
            size="sm"
            icon={Edit2}
            onClick={() => {
              onClose();
              onEdit(patient);
            }}
          >
            Edit Record
          </Button>
        </div>
      </div>
    </Modal>
  );
}

