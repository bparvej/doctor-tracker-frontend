'use client';

import React from 'react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatDateTime } from '../../utils/formatters';
import { ShieldCheck, User, Globe, Calendar, Terminal } from 'lucide-react';

export default function AuditDetailModal({ isOpen, onClose, log }) {
  if (!log) return null;

  // Sanitize data to ensure secrets, passwords, or tokens are never rendered
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const [key, val] of Object.entries(obj)) {
      const lower = key.toLowerCase();
      if (
        lower.includes('password') ||
        lower.includes('token') ||
        lower.includes('secret') ||
        lower.includes('auth') ||
        lower.includes('key')
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof val === 'object' && val !== null) {
        sanitized[key] = sanitizeObject(val);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  };

  const safeDetails = log.details ? sanitizeObject(log.details) : null;
  const safePayload = log.payload ? sanitizeObject(log.payload) : null;
  const safeDiff = log.diff ? sanitizeObject(log.diff) : null;

  const actorName =
    log.actor?.name ||
    log.actor?.email ||
    log.user?.email ||
    log.user ||
    log.actor ||
    'System';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Event Details"
      subtitle={`Audit Record ID: ${log._id || log.id || '—'}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5 text-xs">
        {/* Event Header */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
              Triggered Action
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="primary" size="md">
                {log.action}
              </Badge>
              <span className="font-semibold text-slate-700">
                on {log.entityType || log.entity || 'SYSTEM'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
              Timestamp
            </span>
            <span className="font-mono text-slate-700 text-xs mt-1 block">
              {formatDateTime(log.timestamp || log.createdAt)}
            </span>
          </div>
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">
              Actor / Initiator
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <User className="w-3.5 h-3.5 text-primary-600" />
              <span>{actorName}</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">
              Network IP Address
            </span>
            <div className="flex items-center gap-1.5 font-semibold font-mono text-slate-800">
              <Globe className="w-3.5 h-3.5 text-primary-600" />
              <span>{log.ipAddress || log.ip || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Target Entity ID */}
        <div className="p-3 bg-white rounded-lg border border-slate-200">
          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">
            Target Entity ID
          </span>
          <span className="font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-100 block truncate">
            {log.entityId || log.targetId || 'N/A'}
          </span>
        </div>

        {/* Summary Description */}
        <div className="p-3 bg-white rounded-lg border border-slate-200">
          <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">
            Change Description
          </span>
          <p className="text-slate-700 leading-relaxed">
            {log.summary || log.description || log.message || 'No additional summary recorded.'}
          </p>
        </div>

        {/* JSON Payload Inspection */}
        {(safeDetails || safePayload || safeDiff) && (
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
              <span>Event Payload & Changes</span>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed max-h-48">
              {JSON.stringify(safeDetails || safePayload || safeDiff, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

