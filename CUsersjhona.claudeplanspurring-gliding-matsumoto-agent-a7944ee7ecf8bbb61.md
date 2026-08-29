# Implementation Plan: Gôndula Reader Improvements

This plan covers three main improvements: Visual Feedback, Admin Login refinement, and API Security implementation.

## 1. Visual Feedback Improvement

### Goal
Enhance UI.mensagem to support multiple types (info, success, error, warning) with distinct styles and smooth transitions.

### Changes
- js/ui.js: Update mensagem(texto, tipo = 'info') to map the tipo parameter to a corresponding CSS class. Map success -> sucesso, error -> erro, warning -> aviso, info -> info.
- styles.css: Define styles for .mensagem--info, .mensagem--sucesso, .mensagem--erro, and .mensagem--aviso using CSS variables. Maintain the shake animation for .mensagem--erro.

### Verification
- Call UI.mensagem with different types in the browser console and verify visual changes.

## 2. Admin Login Refinement

### Goal
Remove hardcoded administrative credentials and ensure the system fails safely when environment variables are missing.

### Changes
- api/auth-admin.js: Remove default values || 'admin'. Add a safety check: if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS) return res.status(500).

### Verification
- Verify login fails with 'admin'/'admin' without env vars. Verify it works with correct env vars.

## 3. API Security Implementation

### Goal
Implement a shared secret authentication for all API endpoints using a custom header.

### Changes
- Environment Variables: Define API_SECRET on the backend.
- js/api.js: Add X-API-Key header to all fetch requests.
- api/*.js: Implement a check for req.headers['x-api-key'] === process.env.API_SECRET. Return 401 if missing or incorrect.

### Verification
- Test API endpoints with and without the X-API-Key header using curl.

## Summary of Critical Files
- js/ui.js
- styles.css
- api/auth-admin.js
- js/api.js
- api/conference.js

## Security Trade-offs
- Frontend Secret: Placing the API_SECRET in js/api.js makes it accessible to anyone who views the source code. This is a basic protection layer.
