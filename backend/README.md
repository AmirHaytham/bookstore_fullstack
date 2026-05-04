# BookStore API — Session 2 (JWT Auth + RBAC)

This is the backend for Session 2 of the CSEN 406 lab. It's the same BookStore API from Session 1, but now with **real authentication** (JWT + bcrypt) and **role-based access control** — admins can mutate the catalog, customers can read and review, and the rest of the app's behavior falls out of those two facts.

If you skipped Session 1, the short version is: it's a small Express + Mongoose API for a bookstore. This session adds users, login, registration, and the middleware that decides who's allowed to do what.

## What this session is actually teaching

- **Hashing passwords with bcrypt** — never, ever store plaintext, and a Mongoose `pre('save')` hook is the cleanest place to do it.
- **Issuing & verifying JWTs** — sign on login, verify on every protected route via an `Authorization: Bearer <token>` header.
- **Authentication vs Authorization** — `auth` (are you logged in?) and `authorize('admin')` (are you allowed to do *this*?) are two different middlewares for two different jobs. Conflating them is one of the most common security bugs in student projects.
- **Defense in depth** — admin self-registration is blocked at the controller layer, *and* the role enum on the User model only allows `'admin'` or `'customer'`. Two locks > one lock.
- **One review per user per book** — a compound unique index on `{book, user}`. If you've never seen Mongoose indexes do real work, this is a clean example.

## What's in the box

```
session-2-bookstore-auth/
├── server.js                  # express app, cors, routes, error handler, db connect
├── config/db.js               # mongoose.connect()
├── middleware/
│   ├── auth.js                # verifies JWT, attaches req.user (no password)
│   ├── authorize.js           # rest-param roles: authorize('admin', 'customer')
│   └── errorHandler.js        # ValidationError, 11000 dup-key, CastError → clean JSON
├── models/
│   ├── User.js                # bcrypt pre-save, matchPassword, role enum
│   ├── Book.js                # genre enum, price >= 0, unique isbn
│   ├── Author.js              # name, bio, nationality
│   └── Review.js              # rating 1-5, compound unique {book,user}
├── controllers/
│   ├── authController.js      # register, login, logout
│   ├── bookController.js      # CRUD
│   └── reviewController.js    # nested + flat, owner-or-admin delete
├── routes/
│   ├── authRoutes.js
│   ├── bookRoutes.js          # /featured before /:id, nested /:bookId/reviews
│   ├── authorRoutes.js
│   └── reviewRoutes.js        # mergeParams: true
└── BookStore-Auth-v1.postman_collection.json
```

## Getting it running

You need MongoDB on `mongodb://localhost:27017` and Node 18+.

```bash
npm install
# edit .env and set JWT_SECRET to something actually random
npm run dev          # starts on PORT=3000
```

The `.env` in the repo has a placeholder JWT secret on purpose — **change it before doing anything other than local dev.**

Smoke-test it:

```bash
curl http://localhost:3000/                    # health check
curl http://localhost:3000/api/v1/books        # public list
```

Then import `BookStore-Auth-v1.postman_collection.json` into Postman for the full flow (register → login → protected calls).

## The endpoints

All routes are prefixed with `/api/v1`. Every response is wrapped in `{ success, data?, message?, token? }`.

### Auth — `/auth`
| Method | Path | Who | Notes |
|---|---|---|---|
| POST | `/register` | public | `{ name, email, password }`. `role: 'admin'` is rejected (400). |
| POST | `/login` | public | Returns `{ token, data: <user without password> }`. |
| POST | `/logout` | public | Stateless 200 — JWT is gone when the client drops it. |

### Books — `/books`
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/` | public | List all. |
| GET | `/featured` | public | Static route declared **before** `/:id` for a reason. |
| GET | `/:id` | public | Single book. |
| POST | `/` | admin | Create. |
| PUT | `/:id` | admin | Update with `runValidators: true`. |
| DELETE | `/:id` | admin | |

### Authors — `/authors`
Same shape as books. Public reads, admin writes.

### Reviews — `/reviews` (and nested under `/books/:bookId/reviews`)
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/reviews?book=<id>` | public | Also `/books/:bookId/reviews`. |
| POST | `/reviews` | logged in | `{ book, rating, comment }`. Or POST to the nested URL. |
| DELETE | `/reviews/:id` | owner OR admin | 403 otherwise. Enforced in the controller. |

## Decisions worth defending in a code review

**Why `auth` and `authorize` are separate.**
`auth` answers "who are you?" — it parses the Bearer token and attaches `req.user`. `authorize('admin')` answers "are you allowed?" — it checks the role on `req.user`. Splitting them means a route can require auth without restricting roles (e.g. POST review), or it can chain them when both matter.

**Why `authorize` uses rest params.**
```js
const authorize = (...roles) => (req, res, next) => { ... }
// Usage:
authorize('admin')
authorize('admin', 'customer')   // multiple allowed roles
```
Calling it as `authorize(['admin'])` is a real bug — `roles` becomes `[['admin']]` and the `includes` check silently fails.

**Why `/featured` is declared before `/:id`.**
Express matches routes in declaration order. If `/:id` comes first, `/featured` gets interpreted as `id = "featured"` and you'll waste an hour wondering why a CastError is happening on a route that "doesn't exist."

**Why review ownership is checked in the controller, not a middleware.**
Generic role middleware doesn't know about resource ownership. `authorize('admin')` alone would block legitimate self-deletes by the review author. The controller does:
```js
if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
  return res.status(403).json(...)
}
```
That's the cleanest place to express "owner OR admin."

**Why the User model has `select: false` on the password.**
So every other query in the codebase no longer has to remember to `.select('-password')`. Login is the only place that explicitly opts back in with `.select('+password')`. Make the safe path the default path.

**Why `runValidators: true` on update.**
By default, Mongoose only runs schema validators on `create`, not on `findByIdAndUpdate`. Without that flag, a sneaky PUT `price: -50` would be happily stored. Set it once, sleep better.

## Common things that go wrong

- **`401 Invalid or expired token` on every request** — your `JWT_SECRET` changed between sign and verify (usually because the server restarted with a different `.env`). Re-login.
- **Admin can't create authors** — you're calling `authorize(['admin'])` somewhere. Drop the array brackets.
- **Duplicate review error** — that's the `{book, user}` unique index doing its job. Update the existing review instead.
- **CORS errors from the frontend** — `server.js` only allows `http://localhost:5173`. If Vite runs on a different port, change the `cors()` config.

## Security notes (because this is a teaching repo)

- The `.env` file has a placeholder secret. Real deployments should use a long random string from a secure source.
- `.gitignore` excludes `.env` and `node_modules` — please don't commit either.
- We're not rate-limiting login attempts. In a real app, add `express-rate-limit` on `/auth/login` and `/auth/register`.
- The JWT travels in the `Authorization` header, not a cookie. That sidesteps CSRF but pushes XSS protection onto the frontend (don't `dangerouslySetInnerHTML` user content).

## Where to go from here

The pairing frontend lives in `frontend-tutorial/session-2-bookbrowser-auth` — same response envelope, same `/api/v1` prefix, with an axios interceptor that adds the Bearer token automatically.

— Built for CSEN 406 at the German International University.
