export const APP_CONFIG = {
  name: 'Doctor Tracker',
  version: '1.0.0',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://doctor-tracker-backend-gfj8.onrender.com/api',
  apiTimeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '15000', 10),
  storageKeys: {
    token: 'doc_tracker_token',
    user: 'doc_tracker_user',
    redirectUrl: 'doc_tracker_redirect',
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    pageLimits: [5, 10, 20, 50],
  },
  routes: {
    login: '/login',
    dashboard: '/dashboard',
    doctors: '/doctors',
    patients: '/patients',
    auditLogs: '/audit-logs',
    users: '/users',
  },
};

export const MEDICAL_SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Gynecology',
  'Oncology',
  'Ophthalmology',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Surgery',
  'Urology',
  'Emergency Medicine',
  'Endocrinology',
  'Gastroenterology',
  'Nephrology',
  'Other',
];

export const PATIENT_CONDITIONS = [
  'Stable',
  'Critical',
  'Under Observation',
  'Recovering',
  'Discharged',
  'Chronic',
  'Routine Checkup',
];

export const AUDIT_ACTIONS = [
  'ALL',
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'ASSIGN_PATIENT',
  'REMOVE_PATIENT',
];

export const AUDIT_ENTITIES = [
  'ALL',
  'DOCTOR',
  'PATIENT',
  'AUTH',
  'USER',
];
