# CRMhub - Mini CRM Test Project

A minimal Next.js 14 App Router CRM application for testing n.codes capability map generation.

## Features

- Dashboard with contact stats and recent activity
- Contact management (list, create, update, delete)
- Deal pipeline with stage tracking
- Mock API routes with in-memory data
- Simulated authentication (hardcoded user)

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/contacts | List contacts (supports ?status= and ?search= filters) |
| POST | /api/contacts | Create a new contact |
| GET | /api/contacts/:id | Get a single contact |
| PUT | /api/contacts/:id | Update a contact |
| DELETE | /api/contacts/:id | Delete a contact |
| GET | /api/deals | List deals (supports ?stage= and ?minValue= filters) |
| POST | /api/deals | Create a new deal |
| GET | /api/deals/:id | Get a single deal |
| PUT | /api/deals/:id | Update a deal (with stage validation) |
