'use client';

import React from 'react';
import Badge from '../common/Badge';
import { Eye, Edit2, Trash2, Mail, Phone, Stethoscope, User } from 'lucide-react';
import { formatDate, formatPhone } from '../../utils/formatters';

export default function PatientTable({
  patients = [],
  onView,
  onEdit,
  onDelete,
  readOnly = false,
}) {
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
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
          <tr>
            <th className="py-3 px-4">Patient</th>
            <th className="py-3 px-4">Demographics</th>
            <th className="py-3 px-4">Condition</th>
            <th className="py-3 px-4">Assigned Doctor</th>
            <th className="py-3 px-4">Contact</th>
            <th className="py-3 px-4">Registered</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {patients.map((patient) => {
            const patId = patient._id || patient.id;
            const doctorName =
              patient.doctorId?.name ||
              patient.doctorName ||
              patient.doctor?.name ||
              'Unassigned';

            return (
              <tr
                key={patId}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Patient Name */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">
                    {patient.name}
                  </div>
                  {patient.email && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <Mail className="w-3 h-3" />
                      <span>{patient.email}</span>
                    </div>
                  )}
                </td>

                {/* Age & Gender */}
                <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                  {patient.age ? `${patient.age} yrs` : '—'} • {patient.gender || '—'}
                </td>

                {/* Medical Condition */}
                <td className="py-3.5 px-4">
                  <Badge variant={getConditionVariant(patient.condition)} size="sm">
                    {patient.condition || 'General'}
                  </Badge>
                </td>

                {/* Assigned Doctor */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 text-slate-800 font-medium text-xs">
                    <Stethoscope className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                    <span className="truncate max-w-[150px]">{doctorName}</span>
                  </div>
                </td>

                {/* Contact Phone */}
                <td className="py-3.5 px-4 text-slate-600 text-xs">
                  {patient.phone ? (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{formatPhone(patient.phone)}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* Registered Date */}
                <td className="py-3.5 px-4 text-slate-500 text-xs">
                  {formatDate(patient.createdAt || patient.registrationDate)}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(patient)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="View Patient Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {!readOnly && (
                      <button
                        onClick={() => onEdit(patient)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Edit Patient"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {!readOnly && (
                    <button
                      onClick={() => onDelete(patient)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Patient"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

