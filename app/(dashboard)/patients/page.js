'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Pagination from '../../../components/common/Pagination';
import ErrorBanner from '../../../components/common/ErrorBanner';
import EmptyState from '../../../components/common/EmptyState';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { TableSkeleton } from '../../../components/common/Skeleton';
import PatientTable from '../../../components/patients/PatientTable';
import PatientFormModal from '../../../components/patients/PatientFormModal';
import PatientDetailModal from '../../../components/patients/PatientDetailModal';
import { patientService } from '../../../services/patient.service';
import { doctorService } from '../../../services/doctor.service';
import { useToast } from '../../../hooks/useToast';
import { useDebounce } from '../../../hooks/useDebounce';
import { PATIENT_CONDITIONS, APP_CONFIG } from '../../../constants/config';
import { Plus, Search, Users, RefreshCw, X } from 'lucide-react';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(APP_CONFIG.pagination.defaultLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [conditionFilter, setConditionFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  // Load doctors for filter dropdown and form assignment
  const loadDoctorsList = useCallback(async () => {
    try {
      const res = await doctorService.getDoctors({ limit: 100 });
      setDoctorsList(res.doctors || []);
    } catch (err) {
      console.warn('[PatientsPage] Could not load doctors for filter:', err.message);
    }
  }, []);

  useEffect(() => {
    loadDoctorsList();
  }, [loadDoctorsList]);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch || undefined,
        condition: conditionFilter || undefined,
        doctorId: doctorFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await patientService.getPatients(params);
      setPatients(res.patients || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, conditionFilter, doctorFilter, startDate, endDate]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, conditionFilter, doctorFilter, startDate, endDate]);

  const handleCreateOrUpdate = async (formData) => {
    setIsSaving(true);
    try {
      if (selectedPatient) {
        const id = selectedPatient._id || selectedPatient.id;
        await patientService.updatePatient(id, formData);
        toastSuccess(`Patient ${formData.name}'s profile updated successfully.`);
      } else {
        await patientService.createPatient(formData);
        toastSuccess(`Patient ${formData.name} was successfully registered.`);
      }
      setIsFormOpen(false);
      setSelectedPatient(null);
      await fetchPatients();
    } catch (err) {
      toastError(err.message || 'Failed to save patient.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    try {
      const id = patientToDelete._id || patientToDelete.id;
      await patientService.deletePatient(id);
      toastSuccess(`Patient ${patientToDelete.name} was deleted successfully.`);
      setPatientToDelete(null);
      await fetchPatients();
    } catch (err) {
      toastError(err.message || 'Failed to delete patient.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setConditionFilter('');
    setDoctorFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    searchTerm || conditionFilter || doctorFilter || startDate || endDate
  );

  const doctorFilterOptions = doctorsList.map((d) => ({
    value: d._id || d.id,
    label: `Dr. ${d.name}`,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Patient Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register, search, filter, and maintain clinical records for all patients.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={fetchPatients}
            isLoading={isLoading}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setSelectedPatient(null);
              setIsFormOpen(true);
            }}
          >
            Register Patient
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <ErrorBanner
          error={error}
          onRetry={fetchPatients}
          isRetrying={isLoading}
        />
      )}

      {/* Search and Filters Card */}
      <Card noPadding className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>

          {/* Condition Filter */}
          <div>
            <Select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              options={PATIENT_CONDITIONS}
              placeholder="All Conditions"
            />
          </div>

          {/* Doctor Filter */}
          <div>
            <Select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              options={doctorFilterOptions}
              placeholder="All Attending Doctors"
            />
          </div>

          {/* Date Registered From */}
          <div>
            <Input
              type="date"
              placeholder="From..."
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Date Registered To & Clear Button */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="date"
                placeholder="To..."
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

      {/* Main Table Card */}
      <Card noPadding>
        {isLoading ? (
          <TableSkeleton rows={6} columns={7} />
        ) : patients.length === 0 ? (
          <EmptyState
            title="No Patients Found"
            description={
              hasActiveFilters
                ? 'No patients match your active search or filter criteria. Try resetting filters.'
                : 'No patients have been registered yet. Click "Register Patient" to enroll one.'
            }
            icon={Users}
            actionLabel={hasActiveFilters ? 'Clear Filters' : 'Register First Patient'}
            onAction={
              hasActiveFilters
                ? handleClearFilters
                : () => {
                    setSelectedPatient(null);
                    setIsFormOpen(true);
                  }
            }
          />
        ) : (
          <>
            <PatientTable
              patients={patients}
              onView={(pat) => {
                setSelectedPatient(pat);
                setIsDetailOpen(true);
              }}
              onEdit={(pat) => {
                setSelectedPatient(pat);
                setIsFormOpen(true);
              }}
              onDelete={(pat) => setPatientToDelete(pat)}
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

      {/* Form Modal (Add / Edit) */}
      <PatientFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedPatient(null);
        }}
        onSubmit={handleCreateOrUpdate}
        patient={selectedPatient}
        doctors={doctorsList}
        isLoading={isSaving}
      />

      {/* Detail Modal */}
      <PatientDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
        onEdit={(pat) => {
          setSelectedPatient(pat);
          setIsFormOpen(true);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(patientToDelete)}
        onClose={() => setPatientToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Patient Record"
        message={`Are you sure you want to delete ${patientToDelete?.name}'s patient file? This action cannot be reversed.`}
        confirmText="Delete Record"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

