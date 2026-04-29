# Donation Processor App

A full-stack internal tool for processing and managing donations.

## Architecture

- **Backend**: Node.js + Express, in-memory store, port 3001
- **Frontend**: React + Vite, port 3000

## Running the Application

From the project root, run:

```bash
./start.sh
```

This checks that Node.js is installed, runs `npm install` for both backend and frontend, and starts both servers. Then open http://localhost:3000.

## API Documentation

### POST /donations
Ingest a new donation. Returns 201 on success, 409 if UUID already exists, 400 for invalid payload.

### GET /donations
Returns all donations: `{ donations: Donation[] }`

### GET /donations/:uuid
Returns a single donation or 404.

### PATCH /donations/:uuid/status
Updates donation status. Valid transitions:
- `new` → `pending`
- `pending` → `success`
- `pending` → `failure`

Returns 200 on success, 409 for duplicate (same status), 422 for invalid transition, 404 if not found.

## Webhook API

Webhooks allow external services to receive real-time notifications when a donation reaches a terminal status (`success` or `failure`).

### POST /webhooks
Register a new webhook endpoint.

**Request body:**
```json
{
  "url": "https://example.com/your-endpoint",
  "events": ["success", "failure"]
}
```

- `url` — required, must be a valid `http` or `https` URL
- `events` — required non-empty array; valid values: `success`, `failure`

**Response (201):**
```json
{
  "id": "a1b2c3d4-...",
  "url": "https://example.com/your-endpoint",
  "events": ["success", "failure"],
  "createdAt": "2026-04-29T10:00:00.000Z"
}
```

### GET /webhooks
Returns all registered webhooks: `{ webhooks: Webhook[] }`

### DELETE /webhooks/:id
Removes a registered webhook. Returns 204 on success, 404 if not found.

### How it works

When `PATCH /donations/:uuid/status` transitions a donation to `success` or `failure`, the server delivers a `POST` request to every webhook registered for that event. The payload is:

```json
{
  "event": "success",
  "donation": { ...full donation object }
}
```

Delivery is fire-and-forget — the API response is returned immediately and webhook delivery happens asynchronously. Individual delivery failures are suppressed (network errors, timeouts, non-2xx responses) so they never affect the API caller. Each delivery attempt has a 10-second timeout.

## Design Decisions

### Idempotency (PATCH /donations/:uuid/status)
A PATCH request is considered a duplicate (409) when the requested `status` is identical to the donation's current `status`. This covers the most important idempotency case: retrying a status update that already succeeded. Beyond same-status detection, we do not track request IDs since the status field itself serves as a natural idempotency key for this endpoint.

### UI Decisions
- Only valid status transitions are offered as action buttons, preventing user error
- Terminal states (success/failure) show "No actions available"
- Amounts are displayed in dollars (e.g., $50.00) not cents
- Status badges are color-coded for quick scanning
- API errors are displayed inline next to the affected donation row
- UUID is truncated to 8 characters for readability (full UUID stored internally)
