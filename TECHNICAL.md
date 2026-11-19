# Doctor Tracker — Technical Architecture & Specification

## 1. System Architecture Overview

```
+---------------------------------------------------------------------------------+
|                                 CLIENT TIER                                     |
|                                                                                 |
|  Next.js 14 App Router (React 18 + JavaScript ES6 + Tailwind CSS + Recharts)    |
|                                                                                 |
|   +-------------------------------------------------------------------------+   |
|   |                       Contexts & Global State                           |   |
|   |  - AuthProvider (Session, JWT, Server Health Listener)                  |   |
|   |  - ToastProvider (Notifications Queue)                                  |   |
|   +-------------------------------------------------------------------------+   |
|                                     │                                           |
|   +─────────────────────────────────┼───────────────────────────────────────+   |
|   |                        Centralized Services                             |   |
|   |  - api.js (Fetch wrapper, AbortController, 401 Interceptor, Down check) |   |
|   |  - auth.service.js   - doctor.service.js    - patient.service.js        |   |
|   |  - dashboard.service.js                     - audit.service.js          |   |
|   +─────────────────────────────────┼───────────────────────────────────────+   |
+─────────────────────────────────────┼───────────────────────────────────────────+
                                      │ HTTPS / REST JSON (Bearer / Cookies)
                                      ▼
+---------------------------------------------------------------------------------+
|                                 BACKEND TIER                                    |
|                                                                                 |
|  Fastify Node.js Application + MongoDB Database (Separate Repository)           |
|                                                                                 |
|  Endpoints:                                                                     |
|  - /api/auth/login, /api/auth/logout, /api/auth/me                              |
|  - /api/doctors (CRUD, /doctors/:id/patients)                                   |
|  - /api/patients (CRUD, filters by doctor, condition, date)                     |
|  - /api/dashboard (aggregate stats)                                             |
|  - /api/audit-logs (read-only audit trail)                                      |
+---------------------------------------------------------------------------------+
```

---

## 2. Frontend Architecture & Folder Structure

Doctor Tracker follows a clean separation of concerns:

- **`app/`**: Next.js 14 App Router routes organized via Route Groups:
  - `(auth)/login`: Authentication and credential submission.
  - `(dashboard)/*`: Protected admin sections wrapped in `DashboardShell`.
- **`components/`**: Reusable React presentation components:
  - `common/`: Atomic components (`Button`, `Input`, `Select`, `Card`, `Badge`, `Modal`, `ConfirmModal`, `Skeleton`, `EmptyState`, `ErrorBanner`, `ErrorBoundary`).
  - `layout/`: Structural layout (`Sidebar`, `Header`, `DashboardShell`).
  - `dashboard/`: Visual widgets and charts (`StatCard`, `PatientsPerDoctorChart`, `PatientTrendsChart`, etc.).
  - `doctors/`: Doctor table, modals, and patient assignment interfaces.
  - `patients/`: Patient table, modals, and clinical profiles.
  - `audit/`: Audit records table and payload inspection modal.
- **`services/`**: Pure API communication layer. No component directly invokes `fetch`. All HTTP operations pass through `services/api.js`.
- **`contexts/`**: Shared state (`AuthContext`, `ToastContext`).
- **`hooks/`**: Custom hooks (`useAuth`, `useToast`, `useDebounce`).
- **`utils/`**: Safe storage, formatters, and form validation utilities.
- **`constants/`**: Medical specializations, conditions, pagination defaults, and route constants.

---

## 3. Routing & Authorization Strategy

### Route Groups & Route Guards
1. **Public Route**:
   - `/login`: Accessible to unauthenticated users. If an authenticated user visits `/login`, `LoginPage` automatically redirects them to `/dashboard`.
2. **Root Redirector**:
   - `/`: Evaluates authentication state on mount; forwards authenticated sessions to `/dashboard` and unauthenticated sessions to `/login`.
3. **Protected Routes**:
   - `/dashboard`: High-level summary metrics, chart analytics, and recent activity.
   - `/doctors`: Doctor listing, CRUD, search, and patient assignment.
   - `/patients`: Patient listing, CRUD, and medical condition filtering.
   - `/audit-logs`: System audit trail (read-only).
4. **Auth Guard Implementation**:
   - Implemented within `components/layout/DashboardShell.js`.
   - Checks `isAuthenticated` and `isLoading`.
   - Displays a clean session verification loader before rendering child routes.
   - If unauthorized, forces client navigation to `/login`.

---

## 4. Centralized API Integration (`services/api.js`)

All outbound HTTP calls flow through an `ApiClient` singleton with built-in resilience:

### Key Features:
1. **Dynamic URL Resolution**:
   - Reads `process.env.NEXT_PUBLIC_API_URL` (default: `http://localhost:5000/api`). Never hardcodes absolute URLs.
2. **Automatic Header & Token Injection**:
   - Automatically retrieves Bearer token from `safeStorage` and attaches `Authorization: Bearer <token>`.
   - Supports cross-origin credential forwarding (`credentials: 'include'`) for environments using HttpOnly session cookies.
3. **Request Timeout with AbortController**:
   - Enforces configurable timeout (default 15,000ms via `NEXT_PUBLIC_API_TIMEOUT`).
   - Distinguishes user abortions from network timeouts (`408 Request Timeout`).
4. **Backend Server Down / Unreachable Detection**:
   - Intercepts `TypeError: Failed to fetch` (DNS failures, connection refused, offline host).
   - Translates raw network exceptions into structured `ApiError` instances with status code `0` and `isNetworkError = true`.
   - Dispatches a custom window event `window.dispatchEvent(new CustomEvent('api:health', { detail: { online: false } }))` to update the global Header connectivity pill in real time.
5. **Session Expiry (401 Interceptor)**:
   - When a 401 is received, removes cached tokens and dispatches `'auth:unauthorized'`.
   - `AuthProvider` catches this event, notifies the user with a warning toast, and navigates to `/login?expired=true`.
6. **Defensive Response Parsing**:
   - Inspects `Content-Type` header before parsing. If an upstream proxy or cloud gateway returns HTML (e.g. 502 Bad Gateway), safely reads text rather than throwing JSON parse crashes.

---

## 5. State Management & Data Fetching

### Context Architecture
- **`AuthContext`**:
  - Properties: `user`, `token`, `isAuthenticated`, `isLoading`, `backendOnline`, `backendStatusReason`.
  - Methods: `login(credentials)`, `logout()`.
- **`ToastContext`**:
  - Ephemeral notification queue rendered in an accessible floating portal.
  - Methods: `success(msg)`, `error(msg)`, `warning(msg)`, `info(msg)`.

### Server-Side Pagination & Filtering
To prevent performance degradation with large medical databases:
- Queries execute server-side through standardized parameters:
  - `page`: Active page index (1-based).
  - `limit`: Number of records per page (default: 10).
  - `search`: Debounced text query.
  - `specialization` / `condition` / `doctorId`: Exact entity filters.
  - `startDate` / `endDate`: Date range filters.
- Debounced search inputs utilize `useDebounce(searchTerm, 400)` to eliminate request thrashing while the administrator types.

---

## 6. Security Considerations

1. **Authentication Token Storage**:
   - Stored using `safeStorage` (which wraps `window.localStorage` with exception guards to handle private browsing and SSR).
   - Header tokens are transmitted via HTTPS Bearer authorization.
   - For backend architectures configured with HttpOnly session cookies, `api.js` enables `credentials: 'include'` by default.
2. **Audit Log Sanitization**:
   - Audit trail payloads are sanitized recursively before rendering (`components/audit/AuditDetailModal.js`).
   - Keys matching `password`, `token`, `secret`, `auth`, or `key` are automatically replaced with `[REDACTED]`.
3. **Frontend vs. Backend Authorization**:
   - Frontend route guarding is treated solely as a UX convenience. Backend API controllers enforce token authenticity, role verification, and database query scoping on every request.
4. **XSS Protection**:
   - React JSX inherently escapes content before injection, preventing script execution.
   - User inputs are validated both client-side and server-side.

---

## 7. Technical Decisions & Tradeoffs

| Decision | Rationale |
| :--- | :--- |
| **JavaScript ES6 over TypeScript** | Explicit mandate from project constraints. Modular structure and comprehensive JSDoc ensure code clarity. |
| **Next.js App Router (14.2.15)** | Robust static prerendering, clean folder-based layout architecture, and native standalone Docker packaging. |
| **Recharts Visualization** | Lightweight, SVG-based responsive charting tailored for React with zero DOM footprint leaks. |
| **Centralized Fetch Wrapper** | Avoids external HTTP dependencies (e.g., Axios), minimizing bundle size while offering full control over timeouts, headers, and custom network error events. |
| **Standalone Output Mode (`output: 'standalone'`)** | Trims Docker container image size from >1GB to ~160MB by bundling only necessary production node_modules traces. |

