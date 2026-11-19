'use client';

import React from 'react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { Eye, Edit2, Trash2, Users, Phone, Mail, Building } from 'lucide-react';
import { formatPhone } from '../../utils/formatters';

export default function DoctorTable({
  doctors = [],
  onView,
  onEdit,
  onDelete,
  onManagePatients,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
          <tr>
            <th className="py-3 px-4">Doctor</th>
            <th className="py-3 px-4">Specialization</th>
            <th className="py-3 px-4">Hospital / Clinic</th>
            <th className="py-3 px-4">Contact Details</th>
            <th className="py-3 px-4 text-center">Patients</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {doctors.map((doctor) => {
            const docId = doctor._id || doctor.id;
            const patientCount = doctor.patientCount ?? doctor.patients?.length ?? 0;

            return (
              <tr
                key={docId}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Doctor Name & Email */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">
                    {doctor.name}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{doctor.email}</span>
                  </div>
                </td>

                {/* Specialization */}
                <td className="py-3.5 px-4">
                  <Badge variant="primary" size="sm">
                    {doctor.specialization}
                  </Badge>
                </td>

                {/* Hospital */}
                <td className="py-3.5 px-4 text-slate-700 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate max-w-[180px]">{doctor.hospital}</span>
                  </div>
                </td>

                {/* Phone */}
                <td className="py-3.5 px-4 text-slate-600 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{formatPhone(doctor.phone)}</span>
                  </div>
                </td>

                {/* Patient Count & Quick Link */}
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => onManagePatients(doctor)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-700 transition-colors border border-slate-200"
                    title="View and manage assigned patients"
                  >
                    <Users className="w-3.5 h-3.5 text-primary-600" />
                    <span>{patientCount}</span>
                  </button>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(doctor)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="View Doctor Details"
                      aria-label="View doctor details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onEdit(doctor)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="Edit Doctor"
                      aria-label="Edit doctor"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDelete(doctor)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Doctor"
                      aria-label="Delete doctor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

