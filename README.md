# BookBorrow ("Chapter") — Frontend

Frontend web application for the **School Library Book Borrowing System** (*CO3011 — Software Project Management*).

Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, **React Router v6**, and **MSW v2 (Mock Service Worker)**.

---

## Screenshots

### Student Workspace

| Student Home | Browse Books (Search & Filter) |
| :---: | :---: |
| ![`Student Home`](.github/assets/Home.jpeg) | ![`Browse Books`](.github/assets/BookBrowse.jpeg) |

| Book Detail & Copies | Hold Request Confirmed |
| :---: | :---: |
| ![`Book Detail`](.github/assets/BookDetail.jpeg) | ![`Hold Confirmed`](.github/assets/BookHold.jpeg) |

### Staff Workspace

| Lend Book (Multi-Copy Counter Checkout) | Return Book (Condition Inspection & Check-In) |
| :---: | :---: |
| ![`Lend Book`](.github/assets/StaffIssue.jpeg) | ![`Return Book`](.github/assets/StaffReturn.jpeg) |

| Inventory (Title & Physical Copy Management) | Records (Active Loans, History & Holds) |
| :---: | :---: |
| ![`Staff Inventory`](.github/assets/StaffInventory.jpeg) | ![`Staff Records`](.github/assets/StaffRecords.jpeg) |

---

## Quick Start

```bash
npm install
npm run dev
```

Production typecheck & build:

```bash
npm run build
```

Run automated MSW endpoint verification scripts:

```bash
node scripts/check-borrowing-mocks.mjs
node scripts/check-admin-mocks.mjs
node scripts/check-staff-inventory-mocks.mjs
node scripts/check-staff-issue-mocks.mjs
```

---

## Switching Between Mock Mode (MSW), Hybrid Mode & Real Backend

All UI components make real HTTP `fetch` calls to `/api/v1/*` with `credentials: 'include'` strictly following [`docs/API_Contract.md`](./docs/API_Contract.md).

Configure [`.env`](./.env) (see [`.env.example`](./.env.example)) to select the network mode:

```env
# 'true'   — Full MSW v2 mock mode (all 28 endpoints intercepted & persisted in localStorage)
# 'hybrid' — Real Express backend for implemented routes (/auth/*, /admin/users/*) + MSW fallback for remaining routes
# 'false'  — Direct HTTP requests to the backend server with MSW disabled
VITE_USE_MOCK=true

# Use '/api/v1' for full mock mode, or 'http://localhost:3000/api/v1' for hybrid/real backend mode
VITE_API_BASE_URL=/api/v1
```

When `VITE_USE_MOCK=true` or `hybrid`:
- Mock state (books/copies added, holds placed/released, loans issued/renewed/returned, accounts updated) persists across browser refreshes in `localStorage`.
- Use the bottom-right **"Reset Demo Data"** button at any time to restore the initial demo seed state.

---

## Demo Accounts

Default password for all seeded demo accounts: `password123` (or use the 1-click quick-fill buttons on `/login`).

| Account ID | Name | Role | Demo State |
| :--- | :--- | :--- | :--- |
| `S10428` | **Maya Chen** | `student` | **Primary Student Demo** — 2 active loans (*Wonder*, *A Brief History of Time*), 0 overdue, eligible to place holds & renew |
| `S10216` | **Amira Khan** | `student` | 1 active loan (*The Midnight Library*, due tomorrow) |
| `S10312` | **Oliver Brown** | `student` | 1 overdue book (*The Hobbit*) — demonstrates blocked hold/renewal/checkout rules (`BORROWING_BLOCKED` / `BORROWER_INELIGIBLE`) |
| `S10999` | **Liam Patel** | `student` | Deactivated account (`status: "Inactive"`) — demonstrates `ACCOUNT_INACTIVE` login & checkout guard |
| `STF001` | **Eleanor Vance** | `staff` | **Library Staff Demo** — access to Lend book, Return book, Inventory, and Records |
| `ADM001` | **Arthur Pendelton** | `admin` | **Administrator Demo** — access to school account management, role assignment, and password resets |

---

## Implemented Routes & Screens

### Guest & Authentication

| Route | Screen | Primary API Endpoints |
| :--- | :--- | :--- |
| `/` (Guest) | **Guest Landing Page** | `GET /api/v1/books/featured` |
| `/login` | **2-Step Sign In** (Choose Role → Enter Credentials) | `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout` |

### Student Workspace

| Route | Screen | Primary API Endpoints |
| :--- | :--- | :--- |
| `/` (Student) | **Student Home** | `GET /api/v1/books/featured`, `GET /api/v1/auth/me` |
| `/books` | **Browse Books** (Search, Filter, Sort, Paginate) | `GET /api/v1/books` |
| `/books/:id` | **Book Detail & Physical Copies** | `GET /api/v1/books/:id`, `POST /api/v1/holds` |
| `/holds/:id/confirmed` | **Hold Request Confirmed Receipt** | `POST /api/v1/holds`, `DELETE /api/v1/holds/:id` |
| `/my-borrowing` | **My Borrowing Dashboard** (Loans, 7-Day Renewal, Holds, History) | `GET /api/v1/me/borrowing`, `POST /api/v1/loans/:id/renew`, `DELETE /api/v1/holds/:id` |
| `/profile` | **Student Profile** | `GET /api/v1/auth/me`, `POST /api/v1/auth/logout` |

### Staff Workspace

| Route | Screen | Primary API Endpoints |
| :--- | :--- | :--- |
| `/staff` | **Staff Panel** | Color-coded launcher for Lend book, Return book, Inventory, and Records |
| `/staff/issue` | **Lend Book** (Multi-Copy Counter Checkout & Receipt) | `GET /api/v1/staff/checkout/student/:accountId`, `GET /api/v1/staff/checkout/copy/:copyCode`, `POST /api/v1/staff/loans/issue` |
| `/staff/return` | **Return Book** (Barcode Lookup, Condition Check & Receipt) | `GET /api/v1/staff/return/copy/:copyCode`, `POST /api/v1/staff/loans/return` |
| `/staff/books` | **Inventory** (Title Catalog, Stock Filter & Add Book Modal) | `GET /api/v1/books`, `POST /api/v1/books` |
| `/staff/books/:id` | **Manage Book & Physical Copies** (Edit Metadata & Copy States) | `GET /api/v1/books/:id`, `PUT /api/v1/books/:id`, `DELETE /api/v1/books/:id`, `POST /api/v1/books/:id/copies`, `PATCH /api/v1/copies/:id`, `DELETE /api/v1/copies/:id` |
| `/staff/loans` | **Records** (Active Loans, Returned History & Active Holds) | `GET /api/v1/staff/loans`, `GET /api/v1/staff/holds`, `DELETE /api/v1/holds/:id` |
| `/staff/profile` | **Staff Profile** | `GET /api/v1/auth/me`, `POST /api/v1/auth/logout` |

### Admin Workspace

| Route | Screen | Primary API Endpoints |
| :--- | :--- | :--- |
| `/admin` | **Admin Home** | Entry launcher for school account administration |
| `/admin/accounts` | **Manage Accounts** (Search, Role/Status Filter & Create Account) | `GET /api/v1/admin/users`, `POST /api/v1/admin/users` |
| `/admin/accounts/:id` | **Account Details** (Role Change, Activate/Deactivate, Reset Password, Delete) | `GET /api/v1/admin/users/:id`, `PATCH /api/v1/admin/users/:id/role`, `PATCH /api/v1/admin/users/:id/status`, `POST /api/v1/admin/users/:id/reset-password`, `DELETE /api/v1/admin/users/:id` |
| `/admin/profile` | **Admin Profile** | `GET /api/v1/auth/me`, `POST /api/v1/auth/logout` |

---

## Project Structure

```text
├── docs/
│   ├── API_Contract.md                      # Full REST API specification (28 endpoints)
│   └── artifacts/                           # Milestone changelogs & commit history
├── public/
│   ├── images/reading-room.png              # Library hero asset
│   └── mockServiceWorker.js                 # MSW v2 service worker
├── scripts/
│   ├── check-admin-mocks.mjs                # Automated verification for Admin endpoints
│   ├── check-borrowing-mocks.mjs            # Automated verification for Student borrowing endpoints
│   ├── check-staff-inventory-mocks.mjs      # Automated verification for Staff inventory & copy CRUD
│   └── check-staff-issue-mocks.mjs          # Automated verification for Staff issue, return & records
└── src/
    ├── api/
    │   ├── client.ts                        # Native fetch wrapper with cookies, Bearer auth & envelope parser
    │   └── endpoints.ts                     # Typed API functions for all 28 contract endpoints
    ├── components/
    │   ├── admin/                           # AdminLayout, AdminPageHeader, AdminModal
    │   ├── staff/                           # StaffLayout, AddBookModal
    │   ├── BookCoverGraphic.tsx             # Vector book cover illustrations matching Figma
    │   ├── Layout.tsx                       # Top navigation (Guest / Auth / Student) & Footer
    │   ├── MockDevToolbar.tsx               # Dev toolbar to reset localStorage mock DB
    │   └── UserMenuDropdown.tsx             # Unified top-right user pill & dropdown menu
    ├── context/
    │   ├── AuthContext.tsx                  # Session state provider
    │   └── ToastContext.tsx                 # Global toast notifications
    ├── mocks/
    │   ├── adminHandlers.ts                 # MSW handlers for /admin/users/*
    │   ├── browser.ts                       # MSW worker setup
    │   ├── db.ts                            # Stateful localStorage mock database & seed data
    │   ├── handlers.ts                      # Core MSW handlers & hybrid backend passthrough
    │   ├── staffCirculationHandlers.ts      # MSW handlers for /staff/checkout/*, /staff/return/*, /staff/loans/*
    │   └── staffInventoryHandlers.ts        # MSW handlers for book & physical copy CRUD
    ├── pages/
    │   ├── admin/                           # AdminHomePage, AdminAccountsPage, AdminAccountDetailsPage, AdminProfilePage
    │   ├── staff/                           # StaffHomePage, StaffIssueBooksPage, StaffReturnBookPage, StaffInventoryPage, StaffBookDetailPage, StaffLoansPage, StaffProfilePage
    │   └── ...                              # Guest, Login, and Student pages (including StudentProfilePage)
    └── types/
        └── api.ts                           # TypeScript interfaces matching docs/API_Contract.md
```
