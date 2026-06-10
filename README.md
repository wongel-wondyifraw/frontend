# CMS Frontend (Next.js)

Church Management System frontend built with [Next.js](https://nextjs.org/) App Router with SSR for key routes.

## Getting Started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Frontend: **http://localhost:3000** · API: **http://localhost:3001**

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
app/
  (public)/          Landing + login (SSR shell)
  (app)/             Authenticated routes (shared AppShell layout)
  layout.jsx         Root layout + providers
middleware.js        Auth redirect via cms_token cookie
src/
  views/             Page components (client)
  Components/        Shared UI
  Layouts/           AppShell, DashboardLayout
  context/           User, Theme, Dashboard, DashboardStats
  lib/
    api-server.js    Server-side fetch (SSR data loading)
    auth-cookies.js  Cookie helpers for middleware + SSR
  services/api.js    Client axios API
```

## SSR Routes

These pages fetch data on the server before render:

| Route | Server data |
|-------|-------------|
| `/dashboard` | Member & ministry stats |
| `/members/manage` | Members list |
| `/members/details/[id]` | Member detail |
| `/ministries/manage` | Ministries list |
| `/ministries/details/[id]` | Ministry detail |
| `/` | Landing page (SSR shell + client islands) |

## Auth Flow

1. Login stores JWT in `localStorage` + `cms_token` cookie
2. `middleware.js` protects `/dashboard`, `/members/*`, etc.
3. `AuthGuard` in `AppShell` validates session client-side
4. Server pages use `api-server.js` with the cookie for SSR fetches

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3001` |

## Performance

- Route-group layout (no per-page `DashboardLayout` wrapping)
- Dynamic import for dashboard grid and settings
- Shared dashboard stats context (no duplicate API calls per widget)
- Deferred topbar search prefetch (loads on focus)
- `next/image` for logos via shared `AppLogo` component
- ESLint enabled in production builds (`next/core-web-vitals`)

## Accessibility

- Keyboard-accessible sidebar dropdowns (`role="button"`, `aria-expanded`)
- Search input labeled with `aria-label`
- Theme toggle and notifications buttons labeled
- Login logo uses semantic `Link` instead of clickable `div`
- Hero animations respect `prefers-reduced-motion`
