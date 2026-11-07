# BookBorrow — Milestone Changelog & Commit Messages

This document tracks the files created/modified, architectural notes, and recommended Git commit messages for each milestone.

---

## Milestone 1: Project Scaffold, Design System & Shared Layout Shell

### Changes Made
- **Project & Build Configuration**:
  - Created [package.json](file:///Users/qcl/personal/projects/BookBorrow/package.json), [vite.config.ts](file:///Users/qcl/personal/projects/BookBorrow/vite.config.ts), [tsconfig.json](file:///Users/qcl/personal/projects/BookBorrow/tsconfig.json), [tsconfig.app.json](file:///Users/qcl/personal/projects/BookBorrow/tsconfig.app.json), [tsconfig.node.json](file:///Users/qcl/personal/projects/BookBorrow/tsconfig.node.json), [postcss.config.js](file:///Users/qcl/personal/projects/BookBorrow/postcss.config.js), [.gitignore](file:///Users/qcl/personal/projects/BookBorrow/.gitignore), [.env](file:///Users/qcl/personal/projects/BookBorrow/.env), and [.env.example](file:///Users/qcl/personal/projects/BookBorrow/.env.example).
  - Initialized MSW Service Worker script in `public/mockServiceWorker.js`.
- **Figma Design Tokens & Typography**:
  - Configured [index.html](file:///Users/qcl/personal/projects/BookBorrow/index.html) with Google Fonts (`Lora` 400/500/600 and `Inter` 400/500/600).
  - Configured [tailwind.config.js](file:///Users/qcl/personal/projects/BookBorrow/tailwind.config.js) and [src/index.css](file:///Users/qcl/personal/projects/BookBorrow/src/index.css) with exact Figma color tokens (`#17645F`, `#203B3B`, `#687573`, `#F7F6F2`, `#EEEBE3`, `#E7EFEB`, `#F4EDDE`, `#8B6324`, `#DCE2DC`).
- **Figma Assets & Shared Components**:
  - Added reading room hero photograph at `public/images/reading-room.png`.
  - Created [`BookCoverGraphic`](file:///Users/qcl/personal/projects/BookBorrow/src/components/BookCoverGraphic.tsx) rendering vector book cover illustrations matching Figma (*The Midnight Library*, *The Book Thief*, *The Hobbit*, *The House on Mango Street*, *A Wrinkle in Time*, *The Giver*, *Wonder*, *A Brief History of Time*).
  - Created [`Layout`](file:///Users/qcl/personal/projects/BookBorrow/src/components/Layout.tsx) implementing the `88px` Library Navigation header (`guest`, `auth`, and `student` modes with user profile chip) and Library Footer.

### Suggested Commit Message
```text
chore(scaffold): initialize Vite + React + TS project with Figma design system and layout shell

- Configure Vite, TypeScript, Tailwind CSS, React Router v6, Lucide icons, and MSW v2 worker script
- Add Lora and Inter typography and exact Figma color palette tokens (#17645F, #203B3B, #F7F6F2, etc.)
- Implement BookCoverGraphic SVG component matching Figma book cover illustrations
- Implement responsive Layout shell with Guest, Sign-In, and Student navigation bars and footer
```

---

## Milestone 2: Network-Layer MSW Setup, Stateful Mock DB & Real API Client

### Changes Made
- **API Contract Type Definitions**:
  - Created [src/types/api.ts](file:///Users/qcl/personal/projects/BookBorrow/src/types/api.ts) mirroring [docs/API_Contract.md](file:///Users/qcl/personal/projects/BookBorrow/docs/API_Contract.md) data models (`User`, `Book`, `StockSummary`, `PhysicalCopy`, `BookDetail`, `ViewerContext`, `CatalogResult`, `HoldConfirmation`, `MyBorrowingDashboard`) and standard response envelopes (`ApiSuccessResponse<T>`, `ApiErrorResponse`).
- **Stateful `localStorage` Mock Database**:
  - Created [src/mocks/db.ts](file:///Users/qcl/personal/projects/BookBorrow/src/mocks/db.ts) pre-seeded with:
    - School accounts: `S10428` (Maya Chen — 2 active loans, 0 holds), `S10312` (Oliver Brown — 1 overdue loan), `S10216` (Amira Khan), `S10999` (Inactive student), `STF001` (Staff), and `ADM001` (Admin).
    - Book titles and physical copies (`WB-00421`..`WB-00951`) with automatic `computeStockSummary()` derivation.
- **MSW v2 Request Handlers & Conditional Worker Boot**:
  - Created [src/mocks/handlers.ts](file:///Users/qcl/personal/projects/BookBorrow/src/mocks/handlers.ts) and [src/mocks/browser.ts](file:///Users/qcl/personal/projects/BookBorrow/src/mocks/browser.ts) implementing all 10 Guest & Student endpoints (`POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `GET /books/featured`, `GET /books`, `GET /books/:id`, `GET /me/borrowing`, `POST /holds`, `DELETE /holds/:id`, `POST /loans/:id/renew`).
  - Updated [src/main.tsx](file:///Users/qcl/personal/projects/BookBorrow/src/main.tsx) to conditionally start MSW only when `VITE_USE_MOCK !== 'false'`.
- **Real HTTP Client, Auth Context & Dev Toolbar**:
  - Created [src/api/client.ts](file:///Users/qcl/personal/projects/BookBorrow/src/api/client.ts) and [src/api/endpoints.ts](file:///Users/qcl/personal/projects/BookBorrow/src/api/endpoints.ts) using native `fetch` with `Authorization: Bearer <token>` header injection and typed `ApiClientError` handling.
  - Created [`AuthProvider`](file:///Users/qcl/personal/projects/BookBorrow/src/context/AuthContext.tsx) and [`MockDevToolbar`](file:///Users/qcl/personal/projects/BookBorrow/src/components/MockDevToolbar.tsx) (1-click Demo Data Reset when `VITE_USE_MOCK=true`).

### Suggested Commit Message
```text
feat(api-msw): implement MSW v2 network handlers, stateful mock DB, and real fetch API client

- Add strict TypeScript models matching docs/API_Contract.md response envelopes and domain entities
- Build localStorage-backed mock DB seeded with Maya Chen (S10428), catalog books, physical copies, and loans
- Implement MSW handlers for /auth/*, /books/*, /me/borrowing, /holds/*, and /loans/:id/renew
- Add real fetch client, endpoint wrappers, AuthContext session provider, and VITE_USE_MOCK toggle
```

---

## Milestone 3: Guest Landing Page & 2-Step Sign-In Flow ("Guest (not logged in)")

### Changes Made
- **Guest Landing Page (`26:873`)**:
  - Created [`GuestLandingPage`](file:///Users/qcl/personal/projects/BookBorrow/src/pages/GuestLandingPage.tsx) implementing:
    - Split hero card (`WELCOME TO WESTBRIDGE SCHOOL LIBRARY`, `"Your next chapter starts here."`, `"Sign in to Chapter →"` CTA, `"How borrowing works ↓"` anchor link, and reading room photo with `"A little curiosity goes a long way."` badge).
    - `"Find it online. Borrow it at the library."` 3-step onboarding strip (`1. Discover a book`, `2. Request a hold`, `3. Collect at the counter`).
    - `"A few stories from our shelves"` section dynamically populated via `GET /api/v1/books/featured?limit=4`.
- **2-Step Sign-In Page (`26:993` & `26:1065`)**:
  - Created [`LoginPage`](file:///Users/qcl/personal/projects/BookBorrow/src/pages/LoginPage.tsx) implementing:
    - Step 1 (`Choose role`): Interactive radio cards for `Student`, `Staff`, and `Admin` with dynamic `"Continue as <Role> →"` button.
    - Step 2 (`Enter credentials`): Progress stepper (`✓ Choose role` — `2 Enter credentials`), role summary box with `"Change role"`, `School account ID` & `Password` inputs (with show/hide toggle), inline error alert banner for `INVALID_CREDENTIALS`, `ROLE_MISMATCH`, and `ACCOUNT_INACTIVE`, and real `POST /api/v1/auth/login` integration.
    - Subtle Demo Accounts quick-fill bar visible when `VITE_USE_MOCK !== 'false'`.
- **Route Integration**:
  - Updated [src/App.tsx](file:///Users/qcl/personal/projects/BookBorrow/src/App.tsx) to connect `/` (`GuestLandingPage` when unauthenticated) and `/login` (`LoginPage`).

### Suggested Commit Message
```text
feat(guest-auth): implement Guest Landing page and 2-step Role & Credentials Sign-In flow

- Build GuestLandingPage matching Figma frame 26:873 with live GET /api/v1/books/featured integration
- Build 2-step LoginPage matching Figma frames 26:993 (Choose role) and 26:1065 (Enter credentials)
- Connect POST /api/v1/auth/login with role validation, error banners, and password visibility toggle
- Add dev-mode Demo Accounts quick-fill bar for testing student, overdue, inactive, and staff logins
```
