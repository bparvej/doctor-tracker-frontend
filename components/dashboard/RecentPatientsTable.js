'use client';

import React from 'react';
import Link from 'next/link';
import Badge from '../common/Badge';
import { formatDate } from '../../utils/formatters';
import { ArrowRight } from 'lucide-react';

export default function RecentPatientsTable({ patients = [] }) {
  if (!patients || patients.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-slate-500">
        No recent patients recorded.
      </div>
    );
  }

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
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
          <tr>
            <th className="py-2.5 px-3">Patient</th>
            <th className="py-2.5 px-3">Condition</th>
            <th className="py-2.5 px-3">Assigned Doctor</th>
            <th className="py-2.5 px-3">Registered</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {patients.map((patient) => {
            const docName =
              patient.doctorId?.name ||
              patient.doctorName ||
              patient.doctor?.name ||
              'Unassigned';

            return (
              <tr key={patient._id || patient.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-800">{patient.name}</div>
                  <div className="text-[11px] text-slate-400">
                    {patient.gender || '—'} {patient.age ? `• ${patient.age} yrs` : ''}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <Badge variant={getConditionVariant(patient.condition)} size="sm">
                    {patient.condition || 'General'}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-slate-700 font-medium">
                  {docName}
                </td>
                <td className="py-3 px-3 text-slate-400">
                  {formatDate(patient.createdAt || patient.registrationDate)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="pt-3 border-t border-slate-100 flex justify-end">
        <Link
          href="/patients"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
        >
          <span>View all patients</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

