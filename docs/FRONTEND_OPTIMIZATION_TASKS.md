# Frontend Optimization Task List

> Comprehensive checklist for improving the frontend architecture of the Student Alumni System.
> Covers security, reliability, maintainability, and performance.

---

## Table of Contents

- [P0 — Critical (Must Fix Immediately)](#p0--critical-must-fix-immediately)
- [P1 — High Priority (Fix This Sprint)](#p1--high-priority-fix-this-sprint)
- [P2 — Medium Priority (Planned Refactor)](#p2--medium-priority-planned-refactor)
- [P3 — Low Priority (Nice to Have)](#p3--low-priority-nice-to-have)

---

## P0 — Critical (Must Fix Immediately)

### Task 1: Add Axios Response Interceptor with 401 Handling

**File:** `src/utils/axios.js`
**Impact:** Prevents broken sessions when tokens expire mid-use
**Status:** `[ ]`

**Problem:**
Currently only a request interceptor exists. When the access token expires, API calls fail silently with 401 errors. No automatic retry or logout occurs.

**Requirements:**
- [ ] Add a response interceptor that catches 401 status codes
- [ ] On 401, attempt to refresh the access token via `POST /auth/refresh`
- [ ] Queue all concurrent 401 requests while a refresh is in progress (prevent stampede)
- [ ] On successful refresh, retry all queued requests with the new token
- [ ] On refresh failure, clear auth state and redirect to `/auth/login`
- [ ] Add `_retry` flag to prevent infinite retry loops
- [ ] Do NOT retry the `/auth/refresh` endpoint itself

**Acceptance Criteria:**
- Expired token triggers silent refresh, user stays logged in
- Multiple simultaneous 401s result in only one refresh call
- Failed refresh logs user out cleanly

---

### Task 2: Remove `persist` Middleware from Auth Store

**File:** `src/stores/authStore.js`
**Impact:** Eliminates XSS vulnerability (access token exposed in localStorage)
**Status:** `[ ]`

**Problem:**
The Zustand auth store uses `persist` middleware with `localStorage`. Any XSS attack can read `localStorage` and steal the JWT access token.

**Requirements:**
- [ ] Remove the `persist(...)` wrapper from `useAuthStore`
- [ ] Create a token storage abstraction (`src/lib/token.js`) using in-memory storage
- [ ] Update `src/utils/axios.js` request interceptor to read from the new token storage
- [ ] Set `loading: true` as the initial state (so the app waits for auth verification on boot)
- [ ] Provide atomic `setAuth(token)` and `clearAuth()` actions instead of separate `setUser`/`setToken`

**Acceptance Criteria:**
- No auth data appears in `localStorage` or `sessionStorage`
- Token is only accessible via the in-memory store
- App correctly shows loading state on initial boot until auth is verified

---

### Task 3: Fix Duplicate `MentorshipPage` Declaration

**File:** `src/routes/index.jsx`
**Impact:** Bug fix — duplicate `const` declaration
**Status:** `[ ]`

**Problem:**
`MentorshipPage` is declared twice (lines 85 and 87–89), which causes a runtime error or shadowing depending on the bundler.

**Requirements:**
- [ ] Remove the duplicate declaration (keep only one)
- [ ] Consolidate mentorship routes under a single route tree (currently split between `/chances/mentorship` and `/development/mentorship`)
- [ ] Remove incomplete route entries that have no `element` property (`dashboard`, `calendar`, `appointment`)

**Acceptance Criteria:**
- No duplicate variable declarations
- Mentorship routes exist under one canonical path
- All route entries have an `element` or are removed/marked as TODO

---

## P1 — High Priority (Fix This Sprint)

### Task 4: Add `errorElement` to Route Configuration

**File:** `src/routes/index.jsx`
**Impact:** Prevents white-screen crashes on unhandled errors
**Status:** `[ ]`

**Problem:**
No `errorElement` is defined on any route. An unhandled error in any page component crashes the entire app with a blank screen.

**Requirements:**
- [ ] Create `src/components/feedback/ErrorFallback.jsx` component
  - Display a user-friendly error message
  - Provide a "Go Home" or "Retry" button
  - In development mode, show error details
- [ ] Add `errorElement: <ErrorFallback />` to the root route object
- [ ] Optionally add feature-specific error elements for critical routes

**Acceptance Criteria:**
- Any runtime error in a page component shows the error fallback instead of a blank screen
- Users can navigate away from the error state

---

### Task 5: Implement Silent Refresh Flow

**Files:** `src/lib/auth.js` (new), `src/App.jsx`, `src/utils/axios.js`
**Impact:** Users stay logged in across page refreshes without localStorage
**Status:** `[ ]`

**Problem:**
After removing `persist` from the auth store (Task 2), the user loses auth state on every page refresh. A silent refresh mechanism is needed to recover the session.

**Prerequisite:** Backend must implement `POST /api/auth/refresh` endpoint that:
- Reads the refresh token from an httpOnly cookie
- Returns a new access token in the response body
- Sets a new refresh token cookie

**Requirements:**
- [ ] Create `src/lib/auth.js` with an `initializeAuth()` function
  - Calls `POST /auth/refresh` on app boot
  - On success: stores the new access token in memory, sets user state
  - On failure: clears auth state (user is not logged in)
- [ ] Call `initializeAuth()` in `App.jsx` via `useEffect` on mount
- [ ] Ensure `ProtectedRoute` and `PublicRoute` wait for `loading` to become `false` before rendering
- [ ] Update login flow: backend should set refresh token as httpOnly cookie on `POST /auth/login`

**Acceptance Criteria:**
- Page refresh does not log out the user (as long as refresh token is valid)
- App shows loading screen during the silent refresh attempt
- If the refresh token has expired, user is redirected to login

---

### Task 6: Add Token Expiration Check to `ProtectedRoute`

**File:** `src/routes/ProtectedRoute.jsx`
**Impact:** Prevents access to protected pages with expired tokens
**Status:** `[ ]`

**Problem:**
`ProtectedRoute` only checks `!!token` (token existence), not whether the token is actually valid/expired. The `isTokenExpired` utility exists in `src/utils/jwt.js` but is never used.

**Requirements:**
- [ ] Import and use `isTokenExpired` in `ProtectedRoute`
- [ ] If token exists but is expired, redirect to login (or trigger a refresh)
- [ ] Preserve the user's intended destination via `state={{ from: location.pathname }}` on the redirect
- [ ] After login, redirect back to the originally requested page

**Acceptance Criteria:**
- Navigating to `/dashboard` with an expired token redirects to login
- After logging in, user is redirected back to `/dashboard`
- Valid tokens allow access as before

---

## P2 — Medium Priority (Planned Refactor)

### Task 7: Restructure to Feature-Based Folder Architecture

**Impact:** Improves maintainability, discoverability, and team scalability
**Status:** `[ ]`

**Problem:**
All pages are in a flat `src/pages/` directory, all hooks in `src/hooks/`, etc. As the app grows, finding related code becomes difficult.

**Target structure:**

```
src/
├── app/                    # App shell & providers
├── config/                 # Constants & configuration
├── lib/                    # Non-React utilities (axios, jwt, token)
├── stores/                 # Zustand stores
├── hooks/                  # Shared hooks only
├── features/               # Domain modules
│   ├── auth/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── schemas/
│   │   └── routes.jsx
│   ├── forum/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── routes.jsx
│   ├── honors/
│   ├── donations/
│   ├── mentorship/
│   └── dashboard/
├── components/             # Shared UI components
│   ├── ui/                 # Primitives (Input, Table, Dropdown)
│   ├── layout/             # Header, Footer, Breadcrumb
│   ├── feedback/           # LoadingScreen, ConfirmDialog, ErrorFallback
│   └── guards/             # ProtectedRoute, PublicRoute
├── layouts/                # MainLayout, AuthLayout
├── routes/                 # Central route composition
└── theme/                  # MUI theme
```

**Requirements:**
- [ ] Create `src/features/` directory with subdirectories for each domain
- [ ] Move forum pages from `src/pages/Forum*.jsx` to `src/features/forum/pages/`
- [ ] Move forum hooks from `src/hooks/forum/` to `src/features/forum/hooks/`
- [ ] Move forum components from `src/components/forum/` to `src/features/forum/components/`
- [ ] Repeat for auth, honors, donations, mentorship, dashboard
- [ ] Each feature exports its own `routes.jsx` fragment
- [ ] Central `src/routes/index.jsx` imports and composes all feature routes
- [ ] Move shared components into subcategories (`ui/`, `layout/`, `feedback/`, `guards/`)
- [ ] Create `src/lib/` for non-React utilities (move `axios.js`, `jwt.js`, new `token.js`)
- [ ] Create `src/config/` for constants

**Acceptance Criteria:**
- All imports resolve correctly after restructuring
- No functionality changes — purely structural
- Each feature folder is self-contained (pages, components, hooks, routes)

---

### Task 8: Extract Route Path Constants

**File:** `src/config/routes.config.js` (new)
**Impact:** Eliminates magic strings, enables safe refactoring of URLs
**Status:** `[ ]`

**Problem:**
Route paths are hardcoded as strings throughout the codebase (in route config, `Navigate` components, `useNavigate` calls). Changing a URL requires finding and updating every occurrence.

**Requirements:**
- [ ] Create `src/config/routes.config.js` with a `PATHS` object
- [ ] Define all route paths as constants (use functions for parameterized routes)
- [ ] Replace all hardcoded path strings in `src/routes/index.jsx`
- [ ] Replace all hardcoded path strings in `ProtectedRoute.jsx` and `PublicRoute.jsx`
- [ ] Replace all `navigate('/some/path')` calls in page/component files
- [ ] Replace all `<Navigate to="/some/path" />` usages

**Example:**
```javascript
export const PATHS = {
  HOME: '/',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  DASHBOARD: '/dashboard',
  FORUM: {
    ROOT: '/forum',
    THREAD: (id) => `/forum/alumni/career/${id}`,
  },
};
```

**Acceptance Criteria:**
- Zero hardcoded route strings in components and route config
- Renaming a route path only requires changing `routes.config.js`

---

### Task 9: Add Proactive Token Refresh Scheduler

**File:** `src/lib/auth.js`
**Impact:** Prevents 401 errors by refreshing the token before it expires
**Status:** `[ ]`

**Prerequisite:** Task 5 (Silent Refresh Flow) must be completed first.

**Problem:**
Even with the 401 response interceptor (Task 1), the user briefly experiences a failed request before the refresh kicks in. Proactive refresh eliminates this.

**Requirements:**
- [ ] After every successful login or token refresh, schedule a `setTimeout` to refresh the token
- [ ] Refresh 60 seconds before the token's `exp` claim (or at 75% of token lifetime for short-lived tokens)
- [ ] On successful proactive refresh, reschedule the next refresh
- [ ] On failure, fall back to the 401 interceptor flow
- [ ] Cancel the timer on logout
- [ ] Cancel and reschedule on tab visibility change (if tab was backgrounded, timer may be inaccurate)

**Acceptance Criteria:**
- Token is refreshed before expiry — users never see a 401 from normal usage
- Logout clears the scheduled refresh
- No memory leaks from orphaned timers

---

## P3 — Low Priority (Nice to Have)

### Task 10: Add Vendor Chunk Splitting in Vite

**File:** `vite.config.js`
**Impact:** Faster subsequent page loads via better caching
**Status:** `[ ]`

**Problem:**
All vendor dependencies are bundled into a single chunk. Updating app code invalidates the entire cache, including unchanged vendor code.

**Requirements:**
- [ ] Add `build.rollupOptions.output.manualChunks` to `vite.config.js`
- [ ] Split into logical chunks:
  - `vendor-react`: `react`, `react-dom`
  - `vendor-mui`: `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`
  - `vendor-query`: `@tanstack/react-query`
  - `vendor-form`: `react-hook-form`, `zod`
- [ ] Verify chunks via `npx vite build --report` or `rollup-plugin-visualizer`

**Acceptance Criteria:**
- Vendor code is cached separately from application code
- Updating app code does not invalidate vendor chunk cache
- No chunk is excessively large (target: each under 250KB gzipped)

---

### Task 11: Configure React Query Defaults

**File:** `src/App.jsx` (or `src/app/providers/QueryProvider.jsx` after restructure)
**Impact:** Reduces unnecessary API calls, improves perceived performance
**Status:** `[ ]`

**Problem:**
`QueryClient` is created with default settings, which means:
- `staleTime: 0` — every query refetches on mount
- `refetchOnWindowFocus: true` — refetches when tab regains focus
- `retry: 3` — retries failed queries 3 times

**Requirements:**
- [ ] Set `staleTime: 5 * 60 * 1000` (5 minutes) for most queries
- [ ] Set `gcTime: 10 * 60 * 1000` (10 minutes, replaces deprecated `cacheTime`)
- [ ] Set `retry: 1` (reduce retries for faster failure feedback)
- [ ] Set `refetchOnWindowFocus: false` (prevent unexpected refetches)
- [ ] For real-time data (notifications), override per-query with shorter `staleTime`

**Acceptance Criteria:**
- Navigating between pages does not trigger redundant API calls for recently-fetched data
- Stale data is refreshed after 5 minutes
- Individual queries can override defaults as needed

---

### Task 12: Set Up Vitest + MSW Testing Infrastructure

**Impact:** Enables automated testing of auth flows, interceptors, and route guards
**Status:** `[ ]`

**Problem:**
No testing infrastructure exists. Auth logic and route guards are critical paths that should be tested.

**Requirements:**

**12a. Install dependencies:**
- [ ] `vitest` — test runner compatible with Vite
- [ ] `@testing-library/react` — component rendering
- [ ] `@testing-library/jest-dom` — DOM assertions
- [ ] `@testing-library/user-event` — user interaction simulation
- [ ] `msw` (Mock Service Worker) — network-level API mocking
- [ ] `jsdom` — browser environment for Vitest

**12b. Configure Vitest:**
- [ ] Add `test` config to `vite.config.js` (environment: jsdom, setup files, globals)
- [ ] Create `src/test/setup.js` for global test configuration
- [ ] Create `src/test/mocks/handlers.js` for MSW request handlers
- [ ] Create `src/test/mocks/server.js` for MSW server setup

**12c. Write critical tests:**

Auth interceptor tests (`src/lib/__tests__/axios.test.js`):
- [ ] Test: attaches Bearer token to outgoing requests
- [ ] Test: on 401, refreshes token and retries the original request
- [ ] Test: queues concurrent 401s and only calls refresh once
- [ ] Test: on refresh failure, clears auth state
- [ ] Test: does not retry the refresh endpoint itself

Route guard tests (`src/components/guards/__tests__/ProtectedRoute.test.jsx`):
- [ ] Test: renders children when authenticated with valid token
- [ ] Test: redirects to login when not authenticated
- [ ] Test: redirects to login when token is expired
- [ ] Test: redirects to unauthorized when role is not allowed
- [ ] Test: shows loading screen while auth state is initializing

Auth hook tests (`src/hooks/__tests__/useAuth.test.js`):
- [ ] Test: login stores token and user in state
- [ ] Test: logout clears auth state
- [ ] Test: login with invalid credentials sets error state

**Acceptance Criteria:**
- `npm run test` executes all tests
- All listed test cases pass
- MSW intercepts network calls without hitting real backend

---

## Summary Table

| ID | Task | Priority | Impact | Effort | Dependencies |
|----|------|----------|--------|--------|-------------|
| 1 | Axios response interceptor (401 handling) | P0 | High | Low | None |
| 2 | Remove `persist` from auth store | P0 | High | Low | None |
| 3 | Fix duplicate MentorshipPage | P0 | Medium | Trivial | None |
| 4 | Add `errorElement` to routes | P1 | Medium | Low | None |
| 5 | Silent refresh flow (boot init) | P1 | High | Medium | Task 1, 2 + Backend |
| 6 | Token expiration check in ProtectedRoute | P1 | Medium | Low | None |
| 7 | Feature-based folder restructure | P2 | Medium | Medium | None |
| 8 | Route path constants | P2 | Low | Low | None |
| 9 | Proactive token refresh scheduler | P2 | Medium | Low | Task 5 |
| 10 | Vendor chunk splitting | P3 | Low | Low | None |
| 11 | React Query default config | P3 | Low | Trivial | None |
| 12 | Vitest + MSW testing setup | P3 | Medium | Medium | None |

---

## Suggested Execution Order

```
Phase 1 (Week 1) — Security & Stability
  Task 3 → Task 2 → Task 1 → Task 6 → Task 4

Phase 2 (Week 2) — Auth Flow
  Task 5 (requires backend coordination) → Task 9

Phase 3 (Week 3-4) — Architecture
  Task 7 → Task 8

Phase 4 (Ongoing) — Performance & Quality
  Task 10 → Task 11 → Task 12
```

> **Note:** Tasks within the same phase can often be parallelized across team members.
> Tasks 1, 2, and 5 form a cohesive "auth overhaul" that should ideally be shipped together.
