# Doctor Tracker — Developer Onboarding & Contribution Guide

Welcome to the **Doctor Tracker** frontend development team! This guide will get you up and running within 10 minutes and provide concrete conventions for extending the codebase.

---

## 1. Required Software & Prerequisites

Before setting up the project, install:
- **Node.js**: `v18.17+` or `v20.x` LTS ([Download Node.js](https://nodejs.org/))
- **npm** (comes with Node) or **pnpm**
- **Git**
- **Docker Desktop** (optional, for containerized local workflows)
- **VS Code** (recommended editor) with extensions:
  - *Tailwind CSS IntelliSense*
  - *ESLint*

---

## 2. Fast Setup & Starting Locally

```bash
# 1. Clone repository
git clone <repo-url>
cd doctor-tracker-frontend

# 2. Setup local environment file
cp .env.example .env.local

# 3. Install dependencies
npm install

# 4. Start Next.js development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Environment Configuration

All environment variables must be declared in `.env.local` for local development and in the host provider dashboard (Vercel, Render) for production:

```env
# URL pointing to the running Fastify backend
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Request timeout in milliseconds (default 15000)
NEXT_PUBLIC_API_TIMEOUT=15000

# Environment flag
NEXT_PUBLIC_ENV=development
```

> **IMPORTANT**: In Next.js, variables accessible in client-side code must begin with `NEXT_PUBLIC_`. Never place private secrets (database passwords, private keys) in frontend environment variables.

---

## 4. How-To Guides for Common Tasks

### A. How to Add a New Page to the Dashboard

1. Create a directory inside `app/(dashboard)/<your-route>`:
   ```text
   app/(dashboard)/schedules/page.js
   ```
2. Write your client component with standard layout conventions:
   ```jsx
   'use client';

   import React, { useState, useEffect } from 'react';
   import Card from '../../../components/common/Card';
   import Button from '../../../components/common/Button';

   export default function SchedulesPage() {
     return (
       <div className="space-y-6">
         <div className="pb-2 border-b border-slate-200">
           <h2 className="text-xl font-bold text-slate-900">Schedules</h2>
         </div>
         <Card>
           <p className="text-sm text-slate-600">Schedule list content...</p>
         </Card>
       </div>
     );
   }
   ```
3. Add the navigation item to `components/layout/Sidebar.js`:
   ```javascript
   { name: 'Schedules', href: '/schedules', icon: Calendar }
   ```

### B. How to Create a Reusable Component

1. Place common UI components in `components/common/`.
2. Follow standard component signature:
   ```jsx
   'use client';

   import React from 'react';

   export default function ToggleSwitch({ label, checked, onChange, disabled = false }) {
     return (
       <label className="inline-flex items-center gap-2 cursor-pointer">
         <input
           type="checkbox"
           checked={checked}
           onChange={(e) => onChange(e.target.checked)}
           disabled={disabled}
           className="sr-only peer"
         />
         <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
         {label && <span className="text-xs font-medium text-slate-700">{label}</span>}
       </label>
     );
   }
   ```

### C. How to Integrate a New Backend API

1. Define service methods inside `services/<entity>.service.js`.
2. Always leverage the centralized `api` client from `services/api.js`:
   ```javascript
   import { api } from './api';

   export const scheduleService = {
     async getSchedules(params = {}) {
       try {
         const response = await api.get('/schedules', params);
         return response.data || response;
       } catch (error) {
         console.error('[scheduleService.getSchedules] Error:', error);
         throw error;
       }
     },

     async createSchedule(payload) {
       return await api.post('/schedules', payload);
     },
   };
   ```
3. Use the service in your component with `try/catch` and `useToast()`:
   ```jsx
   import { scheduleService } from '../../services/schedule.service';
   import { useToast } from '../../hooks/useToast';

   const { success, error } = useToast();

   try {
     await scheduleService.createSchedule(data);
     success('Schedule successfully created!');
   } catch (err) {
     error(err.message || 'Failed to save schedule');
   }
   ```

---

## 5. Coding Conventions & Strict Rules

1. **JavaScript ES6 Only**:
   - Strict rule: **No TypeScript**. Do not create `.ts` or `.tsx` files. Use `.js` and `.jsx`.
2. **Component Structure**:
   - Add `'use client';` at the top of components utilizing hooks (`useState`, `useEffect`, router).
   - Use named functional component exports or standard `export default function ComponentName()`.
3. **Tailwind CSS Styling**:
   - Adhere to the established palette: `primary-*` for medical teal accents, `brand-*` for deep blues, `slate-*` for neutrals.
   - Use rounded corners (`rounded-lg`, `rounded-xl`, `rounded-2xl`) and subtle borders (`border-slate-200/80`).
4. **Error Handling Rules**:
   - Never leave unhandled promise rejections.
   - Do not silently swallow errors with empty catch blocks.
   - Always present user-friendly error banners or toast alerts.
   - Wrap interactive content in `ErrorBoundary` to prevent white screens.

---

## 6. Git Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/doctor-specialization-filter
   ```
2. Commit with conventional commit messages:
   - `feat: add hospital filter to doctor management`
   - `fix: resolve pagination offset calculation on patients page`
   - `docs: update deployment instructions in README`
3. Verify production build passes before pushing:
   ```bash
   npm run build
   ```
4. Submit your Pull Request.

---

## 7. Common Troubleshooting

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| **"Backend API Offline" warning in header** | Fastify backend is not running or wrong port in `.env.local` | Check if backend is active. Verify `NEXT_PUBLIC_API_URL=http://localhost:5000/api`. |
| **`useSearchParams()` prerender warning** | Client component calling `useSearchParams()` not enclosed in Suspense | Wrap the consuming component inside a `<Suspense fallback={...}>` block. |
| **401 Unauthorized redirect loop** | Stored JWT token has expired or is invalid | Cleared automatically by `api.js` on 401; log in with valid credentials. |
| **EPERM error during local build on Windows** | Node process file lock on `.next` directory | Delete `.next` folder (`rm -rf .next` or `Remove-Item -Recurse .next`) and rebuild. |

