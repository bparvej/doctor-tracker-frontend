'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import EmptyState from '../common/EmptyState';
import { BarChart3 } from 'lucide-react';

export default function PatientsPerDoctorChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No Doctor-Patient Data"
        description="Patient assignments will appear here once doctors have registered patients."
        icon={BarChart3}
        className="py-12"
      />
    );
  }

  // Format data: truncate long names for axis readability
  const formattedData = data.slice(0, 10).map((item) => ({
    ...item,
    displayName: item.doctor?.length > 12 ? `${item.doctor.slice(0, 10)}...` : item.doctor,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="displayName"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            interval={0}
            angle={-20}
            textAnchor="end"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: '12px',
            }}
            formatter={(value) => [`${value} Patients`, 'Assigned']}
            labelFormatter={(label, items) => items?.[0]?.payload?.doctor || label}
          />
          <Bar
            dataKey="patients"
            fill="#0d9488"
            radius={[6, 6, 0, 0]}
            maxBarSize={45}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

