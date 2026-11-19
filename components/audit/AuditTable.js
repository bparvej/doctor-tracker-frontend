'use client';

import React from 'react';
import Badge from '../common/Badge';
import { Eye, Shield, User, Globe, Clock, FileCode } from 'lucide-react';
import { formatDateTime, truncateText } from '../../utils/formatters';

export default function AuditTable({ logs = [], onViewDetails }) {
  const getActionVariant = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('DELETE') || act.includes('REMOVE')) return 'danger';
    if (act.includes('CREATE') || act.includes('ADD')) return 'success';
    if (act.includes('UPDATE') || act.includes('ASSIGN')) return 'info';
    if (act.includes('LOGIN')) return 'primary';
    if (act.includes('LOGOUT')) return 'warning';
    return 'default';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
          <tr>
            <th className="py-3 px-4">Timestamp</th>
            <th className="py-3 px-4">Actor / User</th>
            <th className="py-3 px-4">Action</th>
            <th className="py-3 px-4">Entity</th>
            <th className="py-3 px-4">Summary</th>
            <th className="py-3 px-4">IP Address</th>
            <th className="py-3 px-4 text-right">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {logs.map((log) => {
            const logId = log._id || log.id;
            const actorName =
              log.actor?.name ||
              log.actor?.email ||
              log.user?.email ||
              log.user ||
              log.actor ||
              'System';

            const entityType = log.entityType || log.entity || log.targetType || 'SYSTEM';
            const entityId = log.entityId || log.targetId || '—';
            const summary =
              log.summary ||
              log.description ||
              log.message ||
              (log.details ? JSON.stringify(log.details) : '—');

            return (
              <tr
                key={logId}
                className="hover:bg-slate-50/70 transition-colors"
              >
                {/* Timestamp */}
                <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                  {formatDateTime(log.timestamp || log.createdAt)}
                </td>

                {/* Actor */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{actorName}</span>
                  </div>
                </td>

                {/* Action Badge */}
                <td className="py-3 px-4">
                  <Badge variant={getActionVariant(log.action)} size="sm">
                    {log.action}
                  </Badge>
                </td>

                {/* Entity Type & ID */}
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-800">{entityType}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                    {entityId}
                  </div>
                </td>

                {/* Summary */}
                <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={summary}>
                  {truncateText(summary, 60)}
                </td>

                {/* IP Address */}
                <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                  {log.ipAddress || log.ip || '—'}
                </td>

                {/* Details Button */}
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onViewDetails(log)}
                    className="p-1.5 text-slate-400 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                    title="View Full Audit Record"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

