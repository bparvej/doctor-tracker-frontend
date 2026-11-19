'use client';

import React from 'react';
import DashboardShell from '../../components/layout/DashboardShell';

export default function DashboardLayout({ children }) {
  return <DashboardShell>{children}</DashboardShell>;
}

