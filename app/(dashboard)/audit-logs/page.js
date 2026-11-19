'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Pagination from '../../../components/common/Pagination';
import ErrorBanner from '../../../components/common/ErrorBanner';
import EmptyState from '../../../components/common/EmptyState';
import { TableSkeleton } from '../../../components/common/Skeleton';
import AuditTable from '../../../components/audit/AuditTable';
import AuditDetailModal from '../../../components/audit/AuditDetailModal';
import { auditService } from '../../../services/audit.service';
import { useDebounce } from '../../../hooks/useDebounce';
import { AUDIT_ACTIONS, AUDIT_ENTITIES, APP_CONFIG } from '../../../constants/config';
import { ShieldCheck, Search, RefreshCw, X, ShieldAlert } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(APP_CONFIG.pagination.defaultLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch || undefined,
        action: actionFilter && actionFilter !== 'ALL' ? actionFilter : undefined,
        entityType: entityFilter && entityFilter !== 'ALL' ? entityFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await auditService.getAuditLogs(params);
      setLogs(res.logs || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, actionFilter, entityFilter, startDate, endDate]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, actionFilter, entityFilter, startDate, endDate]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setActionFilter('');
    setEntityFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    (actionFilter && actionFilter !== 'ALL') ||
    (entityFilter && entityFilter !== 'ALL') ||
    startDate ||
    endDate
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Audit Trail & Activity Logs
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
              Read-Only
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of administrative transactions, entity mutations, and authentication events.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={fetchAuditLogs}
          isLoading={isLoading}
        >
          Refresh Logs
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <ErrorBanner
          error={error}
          onRetry={fetchAuditLogs}
          isRetrying={isLoading}
        />
      )}

      {/* Search and Filters Card */}
      <Card noPadding className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Search user, IP, or summary..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>

          {/* Action Filter */}
          <div>
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              options={AUDIT_ACTIONS}
              placeholder="All Actions"
            />
          </div>

          {/* Entity Filter */}
          <div>
            <Select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              options={AUDIT_ENTITIES}
              placeholder="All Entities"
            />
          </div>

          {/* Date Range Start */}
          <div>
            <Input
              type="date"
              placeholder="Logged from..."
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Date Range End & Reset */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="date"
                placeholder="Logged to..."
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-slate-500 hover:text-rose-600"
                title="Clear all filters"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Audit Table Card */}
      <Card noPadding>
        {isLoading ? (
          <TableSkeleton rows={6} columns={7} />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No Audit Records Found"
            description={
              hasActiveFilters
                ? 'No audit log entries match your specified filter criteria. Try resetting filters.'
                : 'No audit records have been generated or captured yet.'
            }
            icon={ShieldAlert}
            actionLabel={hasActiveFilters ? 'Reset Filters' : undefined}
            onAction={hasActiveFilters ? handleClearFilters : undefined}
          />
        ) : (
          <>
            <AuditTable
              logs={logs}
              onViewDetails={(log) => setSelectedLog(log)}
            />

            <div className="px-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={limit}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setLimit(newSize);
                  setPage(1);
                }}
              />
            </div>
          </>
        )}
      </Card>

      {/* Audit Detail Modal */}
      <AuditDetailModal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </div>
  );
}

