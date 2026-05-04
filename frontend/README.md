# BookBrowser — Session 2 (Auth + Protected Routes)

This is Session 2 of the frontend tutorial for CSEN 406. We're picking up the BookBrowser app from Session 1 and adding the parts that turn a tutorial demo into something that resembles a real app: **a login flow, a register flow, a token that gets attached to every request automatically, and routes that require you to be logged in.**

If Session 1 was about React itself, this one is about **state that lives outside a single component** (Context) and **letting your app react to who's logged in** (conditional UI, route guards, auth-aware axios).

## What changed since Session 1

| Concern | Session 1 | Session 2 |
|---|---|---|
| Auth | none | JWT in localStorage |
| Routes | all public | `/books/new` is protected |
| Axios | bare instance | Bearer interceptor + error normalizer |
| Global state | none yet | `AuthContext` |
| Pages | 3 | 5 (added `/login`, `/register`) |
| Navbar | static | shows login/register OR user name + logout |

Same backend shape (`/api/v1/...`) — but now it talks to **session-2-bookstore-auth** which actually checks the token.

## The mental model

There are basically 4 questions the frontend has to answer once auth shows up, and each one is a file:

1. **"Where do I keep the token and the user?"** → `context/AuthContext.jsx`. One Provider at the top, lazy-init from localStorage, exposes `{ user, token, isAuthenticated, login, logout }`.
2. **"How does every API call know about the token?"** → `services/api.js`. A request interceptor reads `localStorage.token` and adds `Authorization: Bearer <token>`. Bonus: a response interceptor turns the backend's `{ success: false, message }` into a regular `Error` so component code can just `try/catch`.
3. **"How do I keep unauthenticated users away from a page?"** → `components/PrivateRoute.jsx`. Reads `isAuthenticated` from context; if false, `<Navigate to="/login" replace />`. Otherwise it renders its `children`.
4. **"How does the navbar know who's logged in?"** → `components/Navbar.jsx`. Reads from the same context. No prop drilling, no events.

That's the whole architecture. Everything else is just pages.

## Running it

You need the auth-enabled backend from `backend-tutorial/session-2-bookstore-auth` running on port **3000**. Once it's up:

```bash
npm install
npm run dev
```

Then [http://localhost:5173](http://localhost:5173). Vite proxies `/api` → `http://localhost:3000`.

### Try the happy path

1. Go to `/register`, create an account (you'll get a customer role by default — admin self-registration is blocked on the backend, which is intentional).
2. You're redirected to the home page, navbar now shows your name and a Logout button.
3. Try `/books/new` — works, because the route guard sees you're authenticated.
4. Hit Logout → token is wiped, navbar flips back, `/books/new` redirects to `/login`.

## Project layout

```
src/
├── components/
│   ├── Navbar.jsx        # consumes AuthContext, conditional links
│   └── PrivateRoute.jsx  # children-prop guard
├── context/
│   └── AuthContext.jsx   # the brain
├── pages/
│   ├── BookListPage.jsx
│   ├── BookDetailPage.jsx
│   ├── AddBookPage.jsx   # protected
│   ├── LoginPage.jsx     # new
│   └── RegisterPage.jsx  # new
├── services/
│   └── api.js            # axios + interceptors
├── App.jsx
└── main.jsx
```

## Things I want you to actually notice in the code

### `AuthContext.jsx` — the lazy initializer
We don't read localStorage in a `useEffect`; we read it in the **initial state** of `useState`:

```jsx
const [token, setToken] = useState(() => localStorage.getItem("token"));
const [user,  setUser]  = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
```

That avoids a flash where the user is briefly "logged out" on every page load. Small detail, big UX win.

### No `/auth/me` ping on boot
A lot of tutorials make a request to `/auth/me` on every refresh to "verify" the user. We don't. The token in localStorage **is** the source of truth for "logged in"; if the token is rejected by the backend, the response interceptor surfaces that as an error and the protected page can react. Keeps the boot sequence fast.

### `PrivateRoute` uses children, not `<Outlet />`
Both work in React Router v6. We picked `children` because it reads more naturally for a single protected page:

```jsx
<Route path="/books/new" element={
  <PrivateRoute>
    <AddBookPage />
  </PrivateRoute>
} />
```

If you have a whole *section* of protected pages, switch to `<Outlet />` — that's an excellent refactor exercise.

### The error normalizer
The backend always returns either `{ success: true, data }` or `{ success: false, message }`. The response interceptor in `api.js` rejects with `new Error(message)` so callers can just do:

```jsx
try {
  await api.post("/auth/login", { email, password });
} catch (err) {
  setError(err.message);   // already a clean string
}
```

No `err.response.data.message` gymnastics in every component.

## Common pitfalls

- **Forgetting the Provider** — if `useAuth()` returns `undefined`, you forgot to wrap something in `<AuthProvider>`. The provider has to be **inside** `<BrowserRouter>` if you want `useNavigate` inside it; ours is, on purpose.
- **Logging in but the navbar doesn't update** — you're probably mutating state instead of calling `setUser`. Context only re-renders consumers when the value reference changes.
- **Token expired and every page errors** — perfectly normal. Add a 401 handler in the response interceptor that calls `logout()` if you want auto-redirect on expiry.

## What's next

Session 3 starts the semester project (CareerBridge). Different domain, but the architecture you learned here — context for auth, axios interceptors, a route guard — drops in almost unchanged.

— Built for CSEN 406 at the German International University.
