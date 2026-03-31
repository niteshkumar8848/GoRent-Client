# GoRent

GoRent is a full-stack vehicle rental platform built with React, Node.js/Express, and MongoDB. It supports customer bookings, admin operations, pickup location mapping, post-ride feedback, and role-based access control with JWT authentication.

## Overview

GoRent provides:
- Customer authentication, vehicle browsing, and booking flows
- Admin dashboard for vehicle, booking, and user governance
- Map-based pickup location management (Leaflet + OpenStreetMap)
- Booking feedback collection and analytics
- Modern responsive UI with theme support

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Axios
- React DatePicker
- Leaflet + React Leaflet
- CSS (custom design tokens and utility classes)

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- JWT authentication
- bcryptjs
- multer (vehicle media uploads)

## Monorepo Structure

```text
GoRent/
├── gorent-backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── utils/
│   ├── server.js
│   └── package.json
├── gorent-frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.css
│   └── package.json
├── Guide.md
└── README.md
```

## Core Features

### Customer
- Register/login with JWT
- Browse vehicles with detail cards
- Choose pickup location via text search or map pin drop
- Book vehicles by date range
- Submit post-completion feedback (one-time per completed booking)

### Admin
- Manage vehicles (create/update/delete/availability)
- Set pickup locations with manual inputs or map picker
- Manage booking statuses
- View feedback summaries per vehicle
- Blacklist/unblock users

### System
- Route protection for authenticated/admin areas
- Nominatim proxy endpoints for geocoding/reverse geocoding
- Footer + legal/informational pages
- Responsive UI

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance (local or Atlas)

## Environment Variables

### Backend: `gorent-backend/.env`

```env
MONGO_URI=mongodb://localhost:27017/gorent
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ADMIN_SECRET=gorent-admin-reset
```

### Frontend: `gorent-frontend/.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Installation

```bash
# backend
cd gorent-backend
npm install

# frontend
cd ../gorent-frontend
npm install
```

## Run Locally

```bash
# terminal 1 (backend)
cd gorent-backend
npm run dev

# terminal 2 (frontend)
cd gorent-frontend
npm start
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

## Scripts

### Backend (`gorent-backend/package.json`)
- `npm run dev` - start backend with nodemon
- `npm start` - start backend with node

### Frontend (`gorent-frontend/package.json`)
- `npm start` - run development server
- `npm run build` - create production build
- `npm test` - run tests

## API Summary

Base URL: `http://localhost:5000/api`

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `PUT /auth/me`
- `PUT /auth/admin-profile`
- `GET /auth/users` (admin)
- `PUT /auth/users/:id/blacklist` (admin)
- `PUT /auth/users/:id/unblacklist` (admin)

### Vehicles
- `GET /vehicles`
- `GET /vehicles/locations`
- `GET /vehicles/:id`
- `POST /vehicles` (admin)
- `PUT /vehicles/:id` (admin)
- `DELETE /vehicles/:id` (admin)

### Bookings
- `POST /bookings`
- `GET /bookings`
- `GET /bookings/all` (admin)
- `PUT /bookings/:id/status` (admin)
- `PUT /bookings/:id/cancel`
- `DELETE /bookings/:id` (admin)

### Feedback
- `POST /feedback`
- `PUT /feedback/skip/:bookingId`
- `GET /feedback/summary` (admin)

### Location Proxy (Nominatim)
- `GET /location/search?q=...`
- `GET /location/reverse?lat=...&lon=...`

### Health
- `GET /health`

## Default Admin Account

On first successful backend startup, default admin is created:

- Email: `admin@gorent.com`
- Password: `admin123`

## Security Notes

- JWT is required for protected endpoints.
- Admin-only routes validate role from token payload.
- Blacklisted users are blocked from creating bookings.
- Sensitive values must be provided via `.env` files.

## Troubleshooting

### MongoDB not connecting
- Confirm `MONGO_URI` is valid.
- Ensure MongoDB service/cluster is reachable.

### CORS errors
- Add frontend origin to `ALLOWED_ORIGINS`.

### Build warnings
- Current frontend has non-blocking lint warnings; app still builds and runs.

## License

This project is intended for educational and internal development use unless otherwise specified.
