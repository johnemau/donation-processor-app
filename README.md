# Donation Processor App

A full-stack internal tool for processing and managing donations.

## Architecture

- **Backend**: Node.js + Express, in-memory store, port 3001
- **Frontend**: React + Vite, port 3000

## Running the Application

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:3000.

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
