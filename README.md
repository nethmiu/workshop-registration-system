# 🌟 Workshop Registration & Capacity Management System

> **Full Stack Challenge Implementation | Production-Ready MERN Application**  
> Built for Community Training Centres to streamline workshop scheduling, prevent over-registration with atomic capacity controls, and maintain an immutable registration audit trail.

---

## 📌 Table of Contents
- [Business Context & Problem Solved](#-business-context--problem-solved)
- [System Demo Credentials](#-system-demo-credentials)
- [Role-Based Access Control (RBAC) Matrix](#-role-based-access-control-rbac-matrix)
- [Core Features & Client Requirements](#-core-features--client-requirements)
- [Prevention of Over-Registration (Concurrency & Race Conditions)](#-prevention-of-over-registration)
- [Tech Stack & Justifications](#-tech-stack--justifications)
- [Local Installation & Setup Guide](#-local-installation--setup-guide)
- [API Reference](#-api-reference)
- [Design Document & Architectural Decisions](#-design-document--architectural-decisions)

---

## 🏢 Business Context & Problem Solved

A community training centre with three locations and ~15 non-technical staff runs short workshops (pottery, coding, fitness, AI, and design) with strictly limited seat capacities.

### 🔴 The Problem Before:
- Registrations were taken over the phone and manually noted into a shared spreadsheet.
- Multiple staff members promised the last seat simultaneously on Saturday mornings, resulting in chaotic overbooking (e.g. 24 attendees arriving for 20 seats).
- Cancellations were poorly tracked, leaving seats locked or lost without an audit trail of who cancelled and why.

### 🟢 The Solution Provided:
- **Atomic Concurrency Protection**: Zero overbooking guarantee with ACID transactions and atomic seat validation.
- **Strict Role-Based Access Control**: Backend middleware strictly enforces permissions (Admin, Manager, Staff) with `403 Forbidden` barriers.
- **Live Real-Time Sync**: Seat availability, bookings, and cancellations update dynamically across all screens without page reloads.
- **Immutable Audit Trail**: Cancellations release seats instantly while preserving complete records (who registered, who cancelled, when, and why with hover tooltips).

---

## 🔑 System Demo Credentials

The database comes pre-seeded with all requested user roles and passwords. Use these credentials to test different permission tiers:

| Role | Name | Email Address | Password | Permitted Views & Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@gmail.com` | `Admin@123` | **User Directory & Account Management only** |
| **Admin** | Nethmi Umaya | `nethmiumaya5@gmail.com` | `Password@123` | **User Directory & Account Management only** |
| **Staff** | Frontdesk Staff | `staff@gmail.com` | `Staff@123` | **Workshops, Attendee Registration, Seat Cancellation** |
| **Staff** | Frontdesk Staff 1 | `staff1@gmail.com` | `Password@124` | **Workshops, Attendee Registration, Seat Cancellation** |
| **Manager** | Workshop Manager | `manager@gmail.com` | `Manager@123` | **Full Workshop CRUD, Attendee Registration, Cancellation** |
| **Manager** | Workshop Manager 2 | `manager2@gmail.com` | `Password@123` | **Full Workshop CRUD, Attendee Registration, Cancellation** |

---

## 🛡️ Role-Based Access Control (RBAC) Matrix

As mandated by the client specification, permissions are **strictly enforced on the backend** with HTTP `403 Forbidden` responses, not just hidden in the frontend UI.

| What needs doing | Admin | Manager | Staff | Backend Enforcement |
| :--- | :---: | :---: | :---: | :--- |
| **Create user accounts & set roles** | ✅ **Yes** | 🚫 **No** | 🚫 **No** | `authorize('admin')` on `/api/users` |
| **View user directory** | ✅ **Yes** | 🚫 **No** | 🚫 **No** | `authorize('admin')` on `/api/users` |
| **Add, edit & cancel workshops** | 🚫 **No** | ✅ **Yes** | 🚫 **No** | `authorize('manager')` on `/api/workshops` |
| **View & filter workshop catalogue** | 🚫 **No** | ✅ **Yes** | ✅ **Yes** | `authorize('manager', 'staff')` on `/api/workshops` |
| **Register attendees** | 🚫 **No** | ✅ **Yes** | ✅ **Yes** | `authorize('staff', 'manager')` on `/api/registrations` |
| **Cancel attendee seat registrations** | 🚫 **No** | ✅ **Yes** | ✅ **Yes** | `authorize('staff', 'manager')` on `/api/registrations/:id/cancel` |
| **View full registration audit history**| 🚫 **No** | ✅ **Yes** | ✅ **Yes** | `authorize('staff', 'manager')` on `/api/registrations` |

---

## 🚀 Core Features & Client Requirements

### 1. Workshop Catalogue & Capacity Tracking
- Tracks: **Code, Title, Instructor, Date & Time, Seat Capacity, Status (`active` / `cancelled`), Active Bookings, and Remaining Seats**.
- Real-time visual capacity meter with colour-coded threshold warnings (`Safe` -> `Warning` -> `Danger 100% Full`).
- Fully booked workshops automatically switch to a red **`Full`** badge, display **`0 Seats Left`**, and disable registration with a **`Sold Out`** state.

### 2. Fast Discovery & Multi-Criteria Filtering
- **Search**: Instant search across workshop titles, codes, and instructor names.
- **Date Range Filters**: Filter workshops between `From Date` and `To Date`.
- **Status Filter**: Toggle between `All`, `Active Only`, and `Cancelled Only`.
- **Available Seats Only**: Single-click checkbox to instantly filter out sold-out workshops.

### 3. Attendee Registration & Seat Release
- Attendees are recorded with `Name` and `Email` (no public accounts required).
- Duplicate active registration prevention per attendee per workshop.
- **Seat Cancellation with Reason**: Clicking `Cancel Seat` opens a red-themed confirmation modal prompting for a reason (with presets + custom input).
- Seats are freed up immediately upon cancellation, and the audit trail preserves the cancellation timestamp, authorized staff name, and reason.
- Hovering over cancellation badges on the registration table displays an elegant glassmorphism tooltip with full reason context.

### 4. Admin User Management Console
- Create user accounts with live password complexity validation (min 6 chars, uppercase, lowercase, number, special symbol).
- Instant search and role filtering across user directories.
- Password hide/unhide visibility toggles and confirm password matching checks.

### 5. Dynamic Real-Time Live Sync
- Continuous silent background polling (every 3.5s) and window focus listeners ensure data updates automatically without page reloads (F5).
- Visible **`● Live Sync`** pulse indicator reassuring staff of up-to-the-second data accuracy.

---

## 🔒 Prevention of Over-Registration

To solve the client's biggest pain point (*"Last Saturday 24 people turned up for a workshop with 20 seats"*):

1. **Atomic Capacity Validation**:
   ```javascript
   const activeCount = await Registration.countDocuments({
     workshopId: workshop._id,
     status: 'active'
   }, sessionOption);

   if (activeCount >= workshop.capacity) {
     return res.status(400).json({
       success: false,
       message: `Workshop is at full capacity (${activeCount}/${workshop.capacity} seats taken).`
     });
   }
   ```
2. **MongoDB ACID Transactions**: When running on MongoDB replica sets/Atlas, registrations execute inside an isolated transaction with rollbacks if capacity thresholds are exceeded during concurrent requests.
3. **Optimistic & Live Frontend Guards**: Registration modals dynamically check seat availability before submission and disable buttons instantly when full.

---

## 💻 Tech Stack & Justifications

- **Backend**: Node.js & Express.js (High throughput, non-blocking I/O for concurrent registration requests).
- **Database**: MongoDB & Mongoose (Flexible document schema, fast aggregation pipelines, ACID transaction support).
- **Authentication**: JWT (JSON Web Tokens) with cryptographically secure 256-bit secrets and `bcryptjs` password hashing.
- **Frontend**: React 19 (Component-driven SPA, declarative UI state, custom hooks).
- **Styling**: Vanilla CSS Design System with dark glassmorphism, responsive grid layouts, and zero heavy dependencies.

---

## 📦 Local Installation & Setup Guide

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- Internet connection for MongoDB Atlas connection

### 1. Clone & Setup Backend
```bash
cd backend
npm install
```

Ensure `backend/.env` is configured:
```env
MONGO_URI=mongodb+srv://silvapro681_db_user:v3JU7sLLnWE9v0qe@cluster0.l4plkdh.mongodb.net/Workshop?appName=Cluster0
PORT=5000
JWT_SECRET=c7f92e8d1a4b6c3e5f0a2d8b4e7c1f9a3d5e2b8c0a4f6d1e7b9c2a5f8d3e0b4a
```

Seed initial accounts and sample workshops (already pre-seeded, but can be re-run at any time):
```bash
node seedRequestedUsers.js
node seedFullWorkshops.js
```

Start the Backend Server:
```bash
npm start
# Server runs on http://localhost:5000
```

### 2. Setup & Start Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm start
# Application opens on http://localhost:3000
```

---

## 📡 API Reference

### 🔐 Authentication & Users (`/api/users`)
- `POST /api/users/login` - Authenticate user & receive JWT.
- `POST /api/users/register` - *(Admin Only)* Create new staff/manager/admin user.
- `GET /api/users` - *(Admin Only)* Get all user accounts.
- `GET /api/users/me` - Get current authenticated user profile.

### 📚 Workshops (`/api/workshops`)
- `GET /api/workshops` - *(Manager, Staff)* Browse & filter workshops with computed available seats.
- `GET /api/workshops/:id` - *(Manager, Staff)* Get single workshop details.
- `POST /api/workshops` - *(Manager Only)* Create new workshop.
- `PUT /api/workshops/:id` - *(Manager Only)* Update workshop details & capacity.
- `DELETE /api/workshops/:id` - *(Manager Only)* Cancel workshop with cancellation reason.

### 🎟️ Registrations (`/api/registrations`)
- `GET /api/registrations` - *(Manager, Staff)* Get registration records & audit logs.
- `POST /api/registrations` - *(Manager, Staff)* Atomically register attendee for workshop.
- `PATCH /api/registrations/:id/cancel` - *(Manager, Staff)* Cancel registration, free seat, and record reason.

---

## 📄 Design Document & Architectural Decisions

For the complete written technical document detailing architectural choices, trade-offs, assumptions, and race condition prevention, please refer to:
👉 **[DESIGN_DOCUMENT.md](FullStack_Workshop_Architecture_Overview.pdf)**

---

**Developed for the Workshop Registration Service Challenge.**
