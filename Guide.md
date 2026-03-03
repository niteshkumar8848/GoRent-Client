# GoRent Local Development Setup Guide

This guide provides step-by-step instructions for setting up and running the GoRent application on localhost.

---

## Prerequisites

Before starting, ensure you have the following installed:

| Requirement | Description |
|-------------|-------------|
| **Node.js** | v14 or higher |
| **MongoDB** | Running locally or a MongoDB Atlas connection string |

---

## Installation Steps

### 1. Install Backend Dependencies

```bash
cd gorent-backend
npm install
```

### 2. Install Frontend Dependencies

```bash
cd gorent-frontend
npm install
```

---

## Running the Application

### Step 1: Start MongoDB

If running MongoDB locally:

```bash
mongod
```

> **Note:** If using MongoDB Atlas, ensure your connection string in `gorent-backend/.env` is updated accordingly.

### Step 2: Start Backend Server

```bash
cd gorent-backend
npm run dev
```

The backend server will start at: **http://localhost:5000**

### Step 3: Start Frontend Application

Open a new terminal window and run:

```bash
cd gorent-frontend
npm start
```

The frontend application will open at: **http://localhost:3000**

---

## Default Admin Credentials

| Field | Value |
|-------|-------|
| **Email** | admin@gorent.com |
| **Password** | admin123 |

> **Note:** The admin account is automatically created when the server starts for the first time.

---

## Environment Configuration

### Backend (.env)

The following environment variables are configured in `gorent-backend/.env`:

```
MONGO_URI=mongodb://localhost:27017/gorent
JWT_SECRET=gorent_dev_secret_key_2024_change_in_production
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running: `mongod`
- Check the connection string in `gorent-backend/.env`
- For MongoDB Atlas, use a connection string in the format: `mongodb+srv://<username>:<password>@cluster.mongodb.net/gorent`

### Port Already in Use

If port 5000 or 3000 is already in use:

- **Backend:** Change `PORT` in `gorent-backend/.env`
- **Frontend:** Modify the `PORT` in `gorent-frontend/package.json` or set the `PORT` environment variable

### Missing Dependencies

If you encounter missing module errors:

```bash
# Reinstall backend dependencies
cd gorent-backend && rm -rf node_modules && npm install

# Reinstall frontend dependencies
cd gorent-frontend && rm -rf node_modules && npm install
```

---

## Additional Information

- **API Endpoint:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health
- **Admin Dashboard:** http://localhost:3000/admin

