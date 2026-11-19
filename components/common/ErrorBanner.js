'use client';

import React from 'react';
import { AlertCircle, RefreshCw, WifiOff, ServerCrash } from 'lucide-react';
import Button from './Button';
import { APP_CONFIG } from '../../constants/config';

export default function ErrorBanner({
  error,
  message,
  onRetry,
  isRetrying = false,
  className = '',
}) {
  const isNetworkError =
    error?.isNetworkError ||
    error?.status === 0 ||
    error?.status === 408 ||
    (typeof message === 'string' && (message.includes('reach') || message.includes('Failed to fetch') || message.includes('timed out')));

  const displayMessage =
    message ||
    error?.message ||
    'An unexpected error occurred while communicating with the server.';

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isNetworkError
          ? 'bg-amber-50/90 border-amber-300 text-amber-900'
          : 'bg-rose-50/90 border-rose-300 text-rose-900'
      } ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {isNetworkError ? (
            <ServerCrash className="w-5 h-5 text-amber-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold">
            {isNetworkError ? 'Backend Connection Problem' : 'Request Error'}
          </h4>
          <p className="text-xs mt-1 leading-relaxed">{displayMessage}</p>

          {isNetworkError && (
            <div className="mt-2 text-[11px] bg-white/70 rounded p-2 border border-amber-200 text-amber-800">
              <span className="font-semibold">Target API URL:</span>{' '}
              <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">
                {APP_CONFIG.apiUrl}
              </code>
              <div className="mt-1 text-slate-600">
                Ensure your Express backend server is running and accessible at this address.
              </div>
            </div>
          )}
        </div>

        {onRetry && (
          <div className="flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetry}
              isLoading={isRetrying}
              icon={RefreshCw}
              className="bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm"
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

