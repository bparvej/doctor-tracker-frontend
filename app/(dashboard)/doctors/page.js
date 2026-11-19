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
import DoctorTable from '../../../components/doctors/DoctorTable';
import DoctorFormModal from '../../../components/doctors/DoctorFormModal';
import DoctorDetailModal from '../../../components/doctors/DoctorDetailModal';
import DoctorPatientModal from '../../../components/doctors/DoctorPatientModal';
import { doctorService } from '../../../services/doctor.service';
import { useToast } from '../../../hooks/useToast';
import { useDebounce } from '../../../hooks/useDebounce';
import { MEDICAL_SPECIALIZATIONS, APP_CONFIG } from '../../../constants/config';
import { Plus, Search, Filter, Stethoscope, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export default function DoctorsPage() {
  const { isAdmin } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(APP_CONFIG.pagination.defaultLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch || undefined,
        specialization: specializationFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await doctorService.getDoctors(params);
      setDoctors(res.doctors || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, specializationFilter, startDate, endDate]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, specializationFilter, startDate, endDate]);

  const handleCreateOrUpdate = async (formData) => {
    setIsSaving(true);
    try {
      if (selectedDoctor) {
        const id = selectedDoctor._id || selectedDoctor.id;
        await doctorService.updateDoctor(id, formData);
        toastSuccess(`Dr. ${formData.name}'s profile updated successfully.`);
      } else {
        await doctorService.createDoctor(formData);
        toastSuccess(`Dr. ${formData.name} was successfully registered.`);
      }
      setIsFormOpen(false);
      setSelectedDoctor(null);
      await fetchDoctors();
    } catch (err) {
      toastError(err.message || 'Failed to save doctor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!doctorToDelete) return;
    setIsDeleting(true);
    try {
      const id = doctorToDelete._id || doctorToDelete.id;
      await doctorService.deleteDoctor(id);
      toastSuccess(`Dr. ${doctorToDelete.name} was deleted successfully.`);
      setDoctorToDelete(null);
      await fetchDoctors();
    } catch (err) {
      toastError(err.message || 'Failed to delete doctor.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSpecializationFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(searchTerm || specializationFilter || startDate || endDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Doctor Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register, search, update, and manage doctor profiles and patient workloads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={fetchDoctors}
            isLoading={isLoading}
          >
            Refresh
          </Button>

          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setSelectedDoctor(null);
                setIsFormOpen(true);
              }}
            >
              Add New Doctor
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <ErrorBanner
          error={error}
          onRetry={fetchDoctors}
          isRetrying={isLoading}
        />
      )}

      {/* Search and Filters Card */}
      <Card noPadding className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Input
              placeholder="Search by name, email, or hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>

          {/* Specialization Filter */}
          <div>
            <Select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              options={MEDICAL_SPECIALIZATIONS}
              placeholder="All Specializations"
            />
          </div>

          {/* Start Date */}
          <div>
            <Input
              type="date"
              placeholder="Joined from..."
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date & Reset */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="date"
                placeholder="Joined to..."
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
          <TableSkeleton rows={6} columns={6} />
        ) : doctors.length === 0 ? (
          <EmptyState
            title="No Doctors Found"
            description={
              hasActiveFilters
                ? 'No doctors match your active search or filter criteria. Try clearing filters.'
                : 'No doctors have been registered yet. Click "Add New Doctor" to get started.'
            }
            icon={Stethoscope}
            actionLabel={hasActiveFilters ? 'Clear Filters' : 'Add First Doctor'}
            onAction={
              hasActiveFilters
                ? handleClearFilters
                : () => {
                    setSelectedDoctor(null);
                    setIsFormOpen(true);
                  }
            }
          />
        ) : (
          <>
            <DoctorTable
              doctors={doctors}
              onView={(doc) => {
                setSelectedDoctor(doc);
                setIsDetailOpen(true);
              }}
              onEdit={(doc) => {
                setSelectedDoctor(doc);
                setIsFormOpen(true);
              }}
              onDelete={(doc) => setDoctorToDelete(doc)}
              readOnly={!isAdmin}
              onManagePatients={(doc) => {
                setSelectedDoctor(doc);
                setIsPatientModalOpen(true);
              }}
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
      <DoctorFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedDoctor(null);
        }}
        onSubmit={handleCreateOrUpdate}
        doctor={selectedDoctor}
        isLoading={isSaving}
      />

      {/* Detail Modal */}
      <DoctorDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedDoctor(null);
        }}
        doctor={selectedDoctor}
        onEdit={(doc) => {
          setSelectedDoctor(doc);
          setIsFormOpen(true);
        }}
        onManagePatients={(doc) => {
          setSelectedDoctor(doc);
          setIsPatientModalOpen(true);
        }}
      />

      {/* Patient Management under Doctor Modal */}
      <DoctorPatientModal
        isOpen={isPatientModalOpen}
        onClose={() => {
          setIsPatientModalOpen(false);
          setSelectedDoctor(null);
        }}
        doctor={selectedDoctor}
        onPatientCountChanged={fetchDoctors}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(doctorToDelete)}
        onClose={() => setDoctorToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Doctor"
        message={`Are you sure you want to delete Dr. ${doctorToDelete?.name}? This record will be permanently removed.`}
        confirmText="Delete Doctor"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

