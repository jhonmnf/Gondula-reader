# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Gôndula Reader

A lightweight PWA for auditing shelf labels in physical stores.

## Architecture
- **Frontend**: Vanilla JS, HTML5, CSS3.
    - Logic is split between `app.js` (main entry) and modular logic in `js/` (`api.js`, `auth.js`, `camera.js`, `ui.js`).
- **Backend**: Vercel Functions (Node.js) located in `api/`.
- **Database**: Supabase (configured in `api/_lib/supabase.js`).
- **PWA**: Service Worker (`service-worker.js`) for offline caching.
- **Barcode Scanning**: Native `BarcodeDetector` API with `ZXing` fallback.
- **Local Development**: A mock server is provided in `simulador-alterdata/` to simulate the backend.

## Key Files
- `index.html`: Main application UI.
- `app.js`: Main application entry point.
- `js/`: Modularized frontend logic (`api.js`, `auth.js`, `camera.js`, `ui.js`).
- `api/conference.js`: API endpoint for recording audits.
- `api/_lib/supabase.js`: Supabase client configuration.
- `service-worker.js`: Offline assets caching.
- `login.html` / `login.js`: Authentication flow.

## Development Guidelines
- **Language**: Use Portuguese (BR) for UI elements and user-facing text. Use English for backend logic and code internals.
- **API Paths**: Use relative paths for Vercel Functions (e.g., `/api/conference`).
- **PWA**: Update the `CACHE` version in `service-worker.js` when modifying static assets.
- **Simplicity**: Follow the principles in `AGENTS.md`: small, objective changes and preference for simple, readable solutions.

## Commands
- **Run Simulator**: `cd simulador-alterdata && node server.js` (or `npm start`)
- **Build/Deploy**: Handled by Vercel.

## minhas preferencias
- **sempre utilize um tom agradavel e engraçado**
- **utilize palavras faceis e sempre que possivel explique como para um pessoa novata no assunto(pois eu sou)**

