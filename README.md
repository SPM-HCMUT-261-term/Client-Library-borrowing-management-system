# BookBorrow ("Chapter") — Frontend

Frontend web application for the **School Library Book Borrowing System** (*CO3011 — Software Project Management*).

Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, **React Router v6**, and **MSW v2 (Mock Service Worker)**.

---

## Screenshots

| Home Page | Book Catalog (Browse & Search) |
| :---: | :---: |
| ![`Home Page`](.github/assets/Home.jpeg) | ![`Book Catalog`](.github/assets/BookBrowse.jpeg) |

| Book Detail & Copies | Hold Request Confirmed |
| :---: | :---: |
| ![`Book Detail`](.github/assets/BookDetail.jpeg) | ![`Hold Confirmed`](.github/assets/BookHold.jpeg) |

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

---

## Switching Between Mock Mode (MSW) & Real Backend

All UI components make real HTTP `fetch` calls to `/api/v1/*` strictly following [`docs/API_Contract.md`](./docs/API_Contract.md).

Configure [`.env`](./.env) to toggle network interception:

```env
# Set to 'true' to intercept /api/v1/* with MSW (persisted in localStorage)
# Set to 'false' to send requests directly to the real backend server
VITE_USE_MOCK=true
VITE_API_BASE_URL=/api/v1
```

When `VITE_USE_MOCK=true`:
- Mock state (holds created, holds cancelled, loans renewed) persists across browser refreshes in `localStorage`.
- Use the bottom-right **"Reset Demo Data"** button at any time to restore the initial demo seed state.

---

## Demo Accounts (Mock Mode)

Default password for all seeded demo accounts: `password123` (or use the 1-click quick-fill bar on `/login`).

| Account ID | Name | Role | Demo State |
| :--- | :--- | :--- | :--- |
| `S10428` | **Maya Chen** | `student` | **Primary Demo Account** — 2 active loans (*Wonder*, *A Brief History of Time*), 0 overdue, eligible to place holds & renew |
| `S10312` | **Oliver Brown** | `student` | Has 1 overdue book (*The Hobbit*) — demonstrates blocked hold/renewal rules (`BORROWING_BLOCKED`) |
| `S10999` | **Liam Patel** | `student` | Deactivated account (`status: "Inactive"`) — demonstrates `ACCOUNT_INACTIVE` login guard |
| `STF001` | **Eleanor Vance** | `staff` | Library staff account (tests role verification on login) |
| `ADM001` | **Arthur Pendelton** | `admin` | Administrator account (tests role verification on login) |

---

## Implemented Routes & Screens

| Route | Screen | Primary API Endpoints |
| :--- | :--- | :--- |
| `/` (Guest) | **Guest Landing Page** | `GET /api/v1/books/featured` |
| `/login` | **2-Step Sign In** (Choose Role → Enter Credentials) | `POST /api/v1/auth/login`, `GET /api/v1/auth/me` |
| `/` (Authenticated) | **Student Home** | `GET /api/v1/books/featured`, `GET /api/v1/auth/me` |
| `/books` | **Book Catalog** (Search, Filter, Sort, Paginate) | `GET /api/v1/books` |
| `/books/:id` | **Book Detail & Physical Copies** | `GET /api/v1/books/:id`, `POST /api/v1/holds` |
| `/holds/:id/confirmed` | **Hold Request Confirmed Receipt** | `POST /api/v1/holds`, `DELETE /api/v1/holds/:id` |
| `/my-borrowing` | **My Borrowing Dashboard** (Loans, 7-Day Renewal, Holds, History) | `GET /api/v1/me/borrowing`, `POST /api/v1/loans/:id/renew`, `DELETE /api/v1/holds/:id` |

---

## Project Structure

```text
├── docs/
│   ├── API_Contract.md              # Full REST API specification (28 endpoints)
│   └── artifacts/                   # Milestone changelogs & commit history
├── public/
│   ├── images/reading-room.png      # Library hero asset
│   └── mockServiceWorker.js         # MSW v2 service worker
└── src/
    ├── api/
    │   ├── client.ts                # Native fetch wrapper with Bearer token & envelope parser
    │   └── endpoints.ts             # Typed API functions for Auth, Books, Holds, and Loans
    ├── components/
    │   ├── BookCoverGraphic.tsx     # Vector book cover illustrations matching Figma
    │   ├── Layout.tsx               # Top navigation (Guest / Auth / Student) & Footer
    │   └── MockDevToolbar.tsx       # Dev toolbar to reset localStorage mock DB
    ├── context/
    │   └── AuthContext.tsx          # Session state provider
    ├── mocks/
    │   ├── browser.ts               # MSW worker setup
    │   ├── db.ts                    # Stateful localStorage mock database & seed data
    │   └── handlers.ts              # MSW request handlers mirroring docs/API_Contract.md
    ├── pages/                       # Route page components
    └── types/
        └── api.ts                   # TypeScript interfaces matching docs/API_Contract.md
```
