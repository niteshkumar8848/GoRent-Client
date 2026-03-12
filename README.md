# GoRent - Vehicle Rental Platform

<p align="center">
  <img src="gorent-frontend/public/logo.jpg" alt="GoRent Logo" width="200"/>
</p>

<p align="center">
  A full-stack vehicle rental application built with the MERN stack.
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Default Credentials](#default-credentials)
- [Screenshots](#screenshots)
- [License](#license)

---

## 🌟 Overview

GoRent is a comprehensive vehicle rental platform that allows users to browse, book, and manage vehicle rentals. It provides separate interfaces for regular users and administrators, with complete CRUD operations for vehicles and bookings.

---

## ✨ Features

### User Features
- 🔐 **User Authentication**: Secure registration and login with JWT tokens
- 🚗 **Browse Vehicles**: View available vehicles with search and filter options
- 📅 **Book Vehicles**: Select dates and book vehicles for desired periods
- 📊 **User Dashboard**: View booking history and manage personal bookings
- ❌ **Cancel Bookings**: Cancel pending or confirmed bookings

### Admin Features
- 🛠️ **Vehicle Management**: Add, edit, update, and delete vehicles
- 📷 **Image Upload**: Upload vehicle images with preview
- 📋 **Booking Management**: View all bookings and update status
- ✅ **Booking Status**: Confirm, complete, or cancel bookings
- 👥 **User Management**: View all registered users

### General Features
- 🌙 **Dark/Light Theme**: Toggle between dark and light modes
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔒 **Protected Routes**: Secure access to dashboard and booking pages
- ⚡ **Real-time Feedback**: Toast notifications for actions

---

## 🛠️ Tech Stack

### Backend
| Technology | Description |
|------------|-------------|
| Node.js | JavaScript runtime |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| JWT | Authentication |
| bcryptjs | Password hashing |
| multer | File uploads |
| cors | Cross-origin resource sharing |
| dotenv | Environment variables |

### Frontend
| Technology | Description |
|------------|-------------|
| React.js | UI library |
| React Router | Navigation |
| Axios | HTTP client |
| React DatePicker | Date selection |
| CSS | Styling |

---

## 📂 Project Structure

```
GoRent/
├── gorent-backend/
│   ├── middleware/
│   │   ├── adminMiddleware.js    # Admin authorization
│   │   └── authMiddleware.js     # JWT authentication
│   ├── models/
│   │   ├── Booking.js           # Booking schema
│   │   ├── User.js              # User schema
│   │   └── Vehicle.js           # Vehicle schema
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication routes
│   │   ├── bookingRoutes.js     # Booking routes
│   │   └── vehicleRoutes.js     # Vehicle routes
│   ├── uploads/
│   │   └── vehicles/            # Uploaded vehicle images
│   ├── utils/
│   │   └── imagekit.js          # Image handling utilities
│   ├── seedAdmin.js             # Admin user seeder
│   ├── server.js                # Main server file
│   └── package.json             # Backend dependencies
│
├── gorent-frontend/
│   ├── public/
│   │   ├── index.html           # HTML template
│   │   └── logo.jpg             # Application logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmDialog.js # Confirmation modal
│   │   │   ├── Navbar.js        # Navigation bar
│   │   │   ├── ProtectedRoute.js # Route protection
│   │   │   ├── ThemeProvider.js # Theme context
│   │   │   └── Toast.js         # Notification component
│   │   ├── pages/
│   │   │   ├── AdminDashboard.js # Admin dashboard
│   │   │   ├── Booking.js       # Booking page
│   │   │   ├── Home.js          # Home page
│   │   │   ├── Login.js         # Login page
│   │   │   ├── Register.js      # Registration page
│   │   │   └── UserDashboard.js # User dashboard
│   │   ├── App.js               # Main app component
│   │   ├── index.js             # Entry point
│   │   └── index.css            # Global styles
│   ├── build/                   # Production build
│   └── package.json             # Frontend dependencies
│
├── Guide.md                     # Local setup guide
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites

Before running the application, ensure you have:

| Requirement | Version |
|-------------|---------|
| Node.js | v14 or higher |
| npm | v6 or higher |
| MongoDB | Running locally or cloud instance |

### Installation

1. **Clone the repository:**
   ```bash
   cd /path/to/GoRent
   ```

2. **Install backend dependencies:**
   ```bash
   cd gorent-backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd gorent-frontend
   npm install
   ```

### Running the Application

1. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

2. **Start the backend server:**
   ```bash
   cd gorent-backend
   npm run dev
   ```
   The backend will run at: `http://localhost:5000`

3. **Start the frontend** (in a new terminal):
   ```bash
   cd gorent-frontend
   npm start
   ```
   The frontend will open at: `http://localhost:3000`

---

## 🔧 Environment Variables

### Backend (.env)

Create a `.env` file in `gorent-backend/` with the following:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/gorent

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Settings
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Admin Reset Key (optional)
ADMIN_SECRET=gorent-admin-reset
```

### Frontend (.env)

Create a `.env` file in `gorent-frontend/` with the following:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Routes (`/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| GET | `/auth/me` | Get current user | Yes |
| PUT | `/auth/me` | Update user profile | Yes |
| PUT | `/auth/admin-profile` | Update admin profile | Yes (Admin) |

### Vehicle Routes (`/vehicles`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/vehicles` | Get all vehicles | No |
| GET | `/vehicles/:id` | Get single vehicle | No |
| POST | `/vehicles` | Create vehicle | Yes (Admin) |
| PUT | `/vehicles/:id` | Update vehicle | Yes (Admin) |
| DELETE | `/vehicles/:id` | Delete vehicle | Yes (Admin) |

### Booking Routes (`/bookings`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/bookings` | Create booking | Yes |
| GET | `/bookings` | Get user's bookings | Yes |
| GET | `/bookings/all` | Get all bookings | Yes (Admin) |
| PUT | `/bookings/:id/status` | Update booking status | Yes (Admin) |
| PUT | `/bookings/:id/cancel` | Cancel booking | Yes |
| DELETE | `/bookings/:id` | Delete booking | Yes (Admin) |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health status |

---

## 🔑 Default Credentials

After first server startup, an admin account is automatically created:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gorent.com | admin123 |

---

## 📸 Application Screenshots

### Home Page
- Displays available vehicles
- Search and filter functionality
- Dark/Light theme toggle

### Login/Register Pages
- User registration form
- Secure login with JWT
- Form validation

### User Dashboard
- Personal booking history
- Booking status display
- Cancel booking option

### Admin Dashboard
- All bookings management
- Vehicle CRUD operations
- Booking status updates

---

## 🔌 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- For MongoDB Atlas, use: `mongodb+srv://<username>:<password>@cluster.mongodb.net/gorent`

### Port Already in Use
- **Backend (5000):** Change `PORT` in backend `.env`
- **Frontend (3000):** Set `PORT` environment variable or modify `package.json`

### Missing Dependencies
```bash
# Reinstall backend
cd gorent-backend
rm -rf node_modules
npm install

# Reinstall frontend
cd gorent-frontend
rm -rf node_modules
npm install
```

---


## 👨‍💻 Author

Built with ❤️ using the MERN Stack.

<p align="center">
  <strong>GoRent - Your Trusted Vehicle Rental Solution</strong>
</p>

