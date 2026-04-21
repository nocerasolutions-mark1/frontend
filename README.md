# QR Frontend

React + Vite + TypeScript starter for the QR SaaS backend.

## Features

- Login / register
- Protected routes
- Tenant dashboard
- QR list page
- Create QR page
- Analytics summary
- Settings page
- API token persisted in localStorage

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

Or your Railway backend:

```env
VITE_API_BASE_URL=https://your-backend.up.railway.app
```

## Notes

The QR image endpoint uses authenticated requests via the browser URL directly. If your backend keeps auth-protected image routes, you may later prefer a public signed URL or a fetch/blob pattern.
