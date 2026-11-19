'use client';

import React from 'react';
import Link from 'next/link';
import Badge from '../common/Badge';
import { formatDate } from '../../utils/formatters';
import { Stethoscope, ArrowRight } from 'lucide-react';

export default function RecentDoctorsTable({ doctors = [] }) {
  if (!doctors || doctors.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-slate-500">
        No recent doctors recorded.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
          <tr>
            <th className="py-2.5 px-3">Doctor</th>
            <th className="py-2.5 px-3">Specialization</th>
            <th className="py-2.5 px-3">Hospital</th>
            <th className="py-2.5 px-3">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {doctors.map((doc) => (
            <tr key={doc._id || doc.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-3">
                <div className="font-semibold text-slate-800">{doc.name}</div>
                <div className="text-[11px] text-slate-400">{doc.email}</div>
              </td>
              <td className="py-3 px-3">
                <Badge variant="primary" size="sm">
                  {doc.specialization}
                </Badge>
              </td>
              <td className="py-3 px-3 text-slate-600 font-medium">
                {doc.hospital}
              </td>
              <td className="py-3 px-3 text-slate-400">
                {formatDate(doc.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pt-3 border-t border-slate-100 flex justify-end">
        <Link
          href="/doctors"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
        >
          <span>View all doctors</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

