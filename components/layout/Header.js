'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Wifi, WifiOff, Bell, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Badge from '../common/Badge';

const pageTitles = {
  '/dashboard': 'System Overview',
  '/doctors': 'Doctor Management',
  '/patients': 'Patient Management',
  '/audit-logs': 'System Audit Logs',
};

export default function Header({ onMenuClick }) {
  const pathname = usePathname();
  const { user, backendOnline, backendStatusReason } = useAuth();

  const title =
    pageTitles[pathname] ||
    (pathname.startsWith('/doctors')
      ? 'Doctor Management'
      : pathname.startsWith('/patients')
      ? 'Patient Management'
      : 'Doctor Tracker');

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Doctor & Patient Administrative System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Backend Connectivity Status Pill */}
        <div className="flex items-center">
          {backendOnline ? (
            <Badge variant="success" size="sm" className="gap-1.5 py-1 px-2.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden md:inline text-[11px]">Backend API Connected</span>
              <span className="md:hidden text-[10px]">Online</span>
            </Badge>
          ) : (
            <Badge variant="danger" size="sm" className="gap-1.5 py-1 px-2.5 shadow-xs bg-rose-100 border-rose-300 text-rose-800">
              <WifiOff className="w-3 h-3 text-rose-600" />
              <span className="text-[11px] font-semibold">
                {backendStatusReason === 'timeout' ? 'API Timed Out' : 'API Offline'}
              </span>
            </Badge>
          )}
        </div>

        {/* User avatar indicator */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-semibold text-xs border border-slate-200">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
            {user?.name || user?.email?.split('@')[0] || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  );
}

