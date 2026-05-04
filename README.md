# BookStore — Fullstack

This is the capstone repo for the **CSEN 406 Software Engineering** lab series. It bolts together everything we built across the four sessions into a single working app you can clone, seed, and demo end‑to‑end.

If you've followed the labs, nothing here will surprise you — it's the same patterns, just organized as one monorepo with a single `npm run dev` that spins up both halves.

## What's inside

```
bookstore_fullstack/
├─ backend/      Express 4 + Mongoose 8 + JWT (port 3000)
├─ frontend/     React 18 + Vite 5 + axios + react-router (port 5173)
├─ package.json  root scripts (concurrently runs both)
└─ .env.example  copy → backend/.env
```

## What each session contributes

| Session | Topic | Where it lives in this repo |
|---|---|---|
| **Backend 1** | Express basics, Mongoose models, REST routes, error handling | `backend/server.js`, `backend/models/`, `backend/middleware/errorHandler.js` |
| **Backend 2** | JWT auth, bcrypt password hashing, RBAC, nested review routes | `backend/controllers/authController.js`, `backend/middleware/auth.js`, `backend/middleware/authorize.js`, `backend/routes/reviewRoutes.js` |
| **Frontend 1** | React + Vite, axios service, React Router, list/detail pages | `frontend/src/pages/BookListPage.jsx`, `frontend/src/services/api.js` |
| **Frontend 2** | AuthContext + localStorage, request/response interceptors, protected routes | `frontend/src/context/AuthContext.jsx`, `frontend/src/components/PrivateRoute.jsx` |

## Prerequisites

- Node.js **18+**
- MongoDB running locally on `mongodb://localhost:27017` (or set `MONGO_URI`)

## Quick start

```bash
# 1. install everything (root + backend + frontend)
npm run install:all

# 2. set up environment
cp .env.example backend/.env
# (or on Windows PowerShell)
# Copy-Item .env.example backend\.env

# 3. (optional) seed demo data + accounts
npm run seed

# 4. run both servers
npm run dev
```

Then visit [http://localhost:5173](http://localhost:5173). The Vite dev server proxies `/api/*` to the backend on port 3000, so the frontend talks to the API without CORS drama.

### Demo accounts (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| admin | `admin@bookstore.dev` | `admin1234` |
| customer | `sara@bookstore.dev` | `sara1234` |

## API tour

All routes are versioned under `/api/v1/`. Every response uses the same envelope:

```json
{ "success": true, "data": ..., "token": "...", "message": "..." }
```

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | — | `role: 'admin'` is rejected; default is `customer` |
| POST | `/auth/login` | — | returns JWT in `token` |
| GET | `/auth/me` | Bearer | returns the current user |
| POST | `/auth/logout` | — | stateless — client just drops the token |
| GET | `/books` | — | list all |
| GET | `/books/featured` | — | featured first, falls back to newest 3 |
| GET | `/books/:id` | — | single book |
| POST | `/books` | admin | create |
| PUT | `/books/:id` | admin | update |
| DELETE | `/books/:id` | admin | delete |
| GET / POST | `/books/:bookId/reviews` | POST: customer | nested review routes |
| GET / POST | `/authors` | POST: admin | author CRUD |

## End-to-end demo flow

1. `npm run seed` to load three books and two accounts.
2. Visit `/login`, sign in as **sara@bookstore.dev** — browse books, open a detail page, leave a review.
3. Log out, sign in as **admin@bookstore.dev** — `/books/new` is unlocked, add a book, watch it appear in the list.
4. Try registering with `role: "admin"` against the API directly — backend rejects it (admin self‑registration is blocked by design).

## Frontend conventions worth knowing

- `AuthContext` lazy‑initializes from `localStorage` so a page refresh doesn't kick you out.
- `services/api.js` ships **two** interceptors:
  - **request**: attaches `Authorization: Bearer <token>` from `localStorage`.
  - **response**: unwraps server errors into plain `Error` instances, so callers can `try { … } catch (e) { setError(e.message) }`.
- `PrivateRoute` is a children‑prop guard — only `/books/new` is protected because that's the only admin‑only page in the UI.

## Troubleshooting

- **`MongoNetworkError: connect ECONNREFUSED`** — MongoDB isn't running. On Windows: `net start MongoDB` or start the service from Services.msc.
- **`E11000 duplicate key on isbn`** — fixed in this repo: ISBN is `unique + sparse`, so multiple books with no ISBN are allowed.
- **`401 No token`** on a request that should be public** — the request interceptor only attaches a token if one is in `localStorage`; double‑check you actually logged in.
- **CORS errors in production** — the dev server uses Vite's proxy, so CORS doesn't kick in. In production, host both behind the same origin or update `cors({ origin: ... })` in `backend/server.js`.

## Scripts cheat sheet

```bash
npm run dev            # backend + frontend together
npm run dev:backend    # only backend (nodemon)
npm run dev:frontend   # only Vite
npm run seed           # wipe + reload demo data
npm run build          # build the frontend for production
```

---

— Built for CSEN 406 at the German International University <3
