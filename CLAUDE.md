# Gôndula Reader

A lightweight PWA for auditing shelf labels in physical stores.

## Architecture
- **Frontend**: Vanilla JS, HTML5, CSS3.
- **Backend**: Vercel Functions (Node.js).
- **Database**: Supabase.
- **PWA**: Service Worker for offline caching.
- **Barcode Scanning**: Native `BarcodeDetector` API with `ZXing` fallback.

## Key Files
- `index.html`: Main application UI.
- `app.js`: Application logic (Camera, API, UI state).
- `api/conference.js`: API endpoint for recording audits.
- `api/_lib/supabase.js`: Supabase client configuration.
- `service-worker.js`: Offline assets caching.
- `login.html`: Initial authentication page.

## Development Guidelines
- Match existing Portuguese naming for UI elements and English for backend/logic where applicable.
- Use relative paths for Vercel Functions (`/api/...`).
- Ensure PWA assets are updated in `service-worker.js` CACHE version.

## Commands
- Build/Deploy: Handled by Vercel.
