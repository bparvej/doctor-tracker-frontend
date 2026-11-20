'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import EmptyState from '../common/EmptyState';
import { TrendingUp } from 'lucide-react';

export default function PatientTrendsChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No Registration Trends"
        description="Patient registration timeline trends will appear as patients are registered."
        icon={TrendingUp}
        className="py-12"
      />
    );
  }

  const formattedData = data
    .map((item) => {
      const rawDate = item.date || item.label || item._id || item.createdAt || item.registrationDate;
      const parsedDate = rawDate ? new Date(rawDate) : null;
      const date = parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : String(rawDate || '');
      const registrations = Number(item.registrations ?? item.count ?? item.patients ?? item.total ?? 0);
      return { date, registrations: Number.isFinite(registrations) ? registrations : 0 };
    })
    .filter((item) => item.date);

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
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
            formatter={(value) => [`${value} Patients`, 'Registered']}
          />
          <Line
            type="monotone"
            dataKey="registrations"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
            activeDot={{ r: 6, fill: '#1d4ed8' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

