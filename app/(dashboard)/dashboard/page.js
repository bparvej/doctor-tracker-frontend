'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../../components/common/Card';
import StatCard from '../../../components/dashboard/StatCard';
import PatientsPerDoctorChart from '../../../components/dashboard/PatientsPerDoctorChart';
import PatientTrendsChart from '../../../components/dashboard/PatientTrendsChart';
import RecentDoctorsTable from '../../../components/dashboard/RecentDoctorsTable';
import RecentPatientsTable from '../../../components/dashboard/RecentPatientsTable';
import ErrorBanner from '../../../components/common/ErrorBanner';
import { CardSkeleton } from '../../../components/common/Skeleton';
import { dashboardService } from '../../../services/dashboard.service';
import { Stethoscope, Users, UserCheck, Activity, RefreshCw } from 'lucide-react';
import Button from '../../../components/common/Button';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getDashboardData();
      setData(res);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time analytics and management summary from the backend database.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={fetchDashboardData}
          isLoading={isLoading}
        >
          Refresh Data
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <ErrorBanner
          error={error}
          onRetry={fetchDashboardData}
          isRetrying={isLoading}
        />
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Doctors"
              value={data?.totalDoctors ?? 0}
              subtitle="Registered healthcare professionals"
              icon={Stethoscope}
              colorScheme="teal"
            />
            <StatCard
              title="Total Patients"
              value={data?.totalPatients ?? 0}
              subtitle="Enrolled clinical patient records"
              icon={Users}
              colorScheme="blue"
            />
            <StatCard
              title="Avg. Patients / Doctor"
              value={data?.averagePatientsPerDoctor ?? 0}
              subtitle="Workload balance indicator"
              icon={UserCheck}
              colorScheme="indigo"
            />
            <StatCard
              title="Active Specializations"
              value={data?.specializationDistribution?.length ?? 0}
              subtitle="Medical fields represented"
              icon={Activity}
              colorScheme="purple"
            />
          </>
        )}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Patients Per Doctor"
          subtitle="Distribution of assigned patients across active doctors"
        >
          <PatientsPerDoctorChart data={data?.patientsPerDoctor || []} />
        </Card>

        <Card
          title="Patient Registration Trends"
          subtitle="New patient intake timeline"
        >
          <PatientTrendsChart data={data?.registrationTrends || []} />
        </Card>
      </div>

      {/* Recent Activity Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Recently Added Doctors"
          subtitle="Latest medical practitioners joined to the system"
          noPadding
        >
          <div className="p-4">
            <RecentDoctorsTable doctors={data?.recentDoctors || []} />
          </div>
        </Card>

        <Card
          title="Recently Added Patients"
          subtitle="Latest enrolled patient profiles and diagnosis status"
          noPadding
        >
          <div className="p-4">
            <RecentPatientsTable patients={data?.recentPatients || []} />
          </div>
        </Card>
      </div>
    </div>
  );
}

