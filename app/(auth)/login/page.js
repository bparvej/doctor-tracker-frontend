'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, Lock, Mail, ArrowRight, ShieldCheck, Loader2, Server } from 'lucide-react';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import ErrorBanner from '../../../components/common/ErrorBanner';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { APP_CONFIG } from '../../../constants/config';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { success: toastSuccess } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check if redirected because of session expiry
  const sessionExpired = searchParams.get('expired') === 'true';

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const wakeBackend = async () => {
      try {
        await fetch(APP_CONFIG.apiUrl.replace(/\/api\/?$/, ''), {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!isCancelled) setBackendStatus('online');
      } catch (_error) {
        if (!isCancelled) setBackendStatus('offline');
      } finally {
        clearTimeout(timeoutId);
      }
    };

    wakeBackend();

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsNetworkError(false);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email/username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      toastSuccess('Successfully signed in. Welcome back!');
      router.replace('/dashboard');
    } catch (err) {
      const isNet = err.isNetworkError || err.status === 0 || err.status === 408;
      setIsNetworkError(isNet);
      setErrorMessage(
        err.message || 'Invalid login credentials. Please check your details and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
      {/* Session Expired Notice */}
      {sessionExpired && (
        <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Your session has expired. Please log in again to continue.</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-5">
          <ErrorBanner
            message={errorMessage}
            error={{ isNetworkError }}
          />
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Email Address / Username"
          type="text"
          name="email"
          id="email"
          autoComplete="username"
          placeholder="Enter your email or username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={Mail}
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          id="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={Lock}
          required
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full shadow-md shadow-primary-600/20"
            isLoading={isSubmitting}
            icon={ArrowRight}
          >
            Sign In to Dashboard
          </Button>
        </div>
      </form>

      {/* Backend Status Notice */}
      <div
        className={`mt-6 rounded-xl border p-3 text-xs leading-relaxed ${
          backendStatus === 'online'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : backendStatus === 'offline'
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}
      >
        <div className="flex items-start gap-2">
          <Server className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-semibold">
              {backendStatus === 'checking' && 'Starting backend connection'}
              {backendStatus === 'online' && 'Backend is online'}
              {backendStatus === 'offline' && 'Please enable the backend first'}
            </p>
            {backendStatus === 'checking' && (
              <p className="mt-1">Connecting to the Express server. This may take up to 60 seconds.</p>
            )}
            {backendStatus === 'online' && (
              <p className="mt-1">The backend is ready. You can sign in now.</p>
            )}
            {backendStatus === 'offline' && (
              <>
                <p className="mt-1">Open the backend link and wait for Render to wake the server:</p>
                <a
                  href="https://doctor-tracker-backend-gfj8.onrender.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block break-all font-mono font-semibold underline underline-offset-2"
                >
                  https://doctor-tracker-backend-gfj8.onrender.com
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* App Logo */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-teal-400 text-white shadow-lg shadow-primary-500/25 mb-4">
          <Activity className="w-8 h-8" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Doctor Tracker
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
          Administrative Portal for Healthcare Staff & System Administrators
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense
          fallback={
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600 mx-auto" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
