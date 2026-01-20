# Headington Portal

*A fast, secure check-in/check-out system for athletic dorm visitor management.*

---

## Overview

**Headington Portal** is a full-stack visitor management system built to replace the slow, manual Excel-based visitor logging process used in athletic student housing.

During my time working the front desk of an athlete residence hall, I identified two major problems:

1. **Manual Excel tracking** slowed operations during peak periods (move-in, game days, parents weekend).
2. **Holding physical IDs** (driver’s licenses) created liability and risk if a visitor forgot their ID.

The Headington Portal solves these problems with:

* Fast digital visitor check-in and check-out
* Resident ↔ visitor linking
* Automated SMS reminders for overstaying visitors
* No more ID retention
* MongoDB-backed audit logs
* A clean React dashboard for clerks

Visitors can be checked in within **under 60 seconds**, and checked out in **under 15 seconds**.

---

# System Architecture

Below is the complete architecture as an ASCII diagram that fits GitHub Markdown.

```
                               ┌──────────────────────────────────┐
                               │          Clerk Dashboard         │
                               │        (React Frontend)          │
                               │----------------------------------│
                               │ - Login / Logout                 │
                               │ - Add Residents                  │
                               │ - Add / Search Visitors          │
                               │ - Check-In / Check-Out Forms     │
                               │ - Activity Log Dashboard         │
                               │ - Image Gallery (IDs, photos)    │
                               └──────────────────────────────────┘
                                             │
                                             │  HTTPS (REST API)
                                             ▼
┌─────────────────────────────── Backend: Node.js / Express ───────────────────────────────┐
│                                                                                          │
│   ┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────────────┐ │
│   │  Controllers        │    │  Middleware          │    │  Services / Utilities       │ │
│   │---------------------│    │----------------------│    │-----------------------------│ │
│   │ - guestController   │    │ - authMiddleware     │    │ - Twilio SMS Notifications  │ │
│   │ - residentController│    │ - errorMiddleware    │    │ - Google Sheets Integration │ │
│   │ - clerkController   │    └──────────────────────┘    │ - Multer + GridFS Uploads   │ │
│   │ - sheetController   │                                └─────────────────────────────┘ │
│   └─────────────────────┘                                                                │  
│                                         │                                                │  
│                                         ▼                                                │  
│                        ┌────────────────────────────────────────┐                        │  
│                        │         MongoDB + Mongoose             │                        │  
│                        │----------------------------------------│                        │  
│                        │ - Residents Collection                 │                        │  
│                        │ - Guests Collection                    │                        │  
│                        │ - Clerks Collection (JWT Auth)         │                        │  
│                        │ - Visit Logs                           │                        │  
│                        │ - Uploaded Images (GridFS)             │                        │  
│                        └────────────────────────────────────────┘                        │   
└──────────────────────────────────────────────────────────────────────────────────────────┘

         Additional Integrations:
         --------------------------------------------------------------------
         • Twilio → Sends text messages to visitors who overstay
         • Google Sheets → Sync or export visit logs
         • Nodemailer → Sends email notifications (future extension)
```

---

# Features

### Visitor & Resident Management

* Register visitors and residents
* Fast search for returning visitors
* Link visitor → resident → room number
* Store check-in/check-out timestamps

### Check-In / Check-Out Flow

* Quick check-in (name, resident visited, room)
* One-step checkout
* Auto timestamps
* Error validation + UI feedback

### Automated Notifications

* Integration with **Twilio**
* SMS reminders sent to visitors who stay beyond allowed hours

### Database & Admin Tools

* MongoDB with Mongoose
* Clerk authentication (JWT)
* File upload support (Multer + GridFS)

### Frontend UI

A complete React dashboard:

* Login & authentication
* Add residents
* Add/search visitors
* Check-in/out pages
* Resident & visitor rosters
* Activity logs
* Spinner + modals
* Clean UI flow for real-world usage

---

# Tech Stack

### Backend (Node.js)

* Express
* MongoDB + Mongoose
* JWT Authentication
* Multer + GridFS
* Twilio SMS
* Google Sheets API
* Nodemailer
* Axios
* Validator
* dotenv

### Frontend (React)

* React 18
* Redux Toolkit (Slices for residents, guests, sheets, auth)
* React Router
* CRA (Create React App)
* CSS modules + custom components
* SVG/PNG icon set

---

# Project Structure

```
headingtonportal/
│
├── backend/
│   ├── server.js
│   ├── database/
│   │   └── database.js
│   ├── controllers/
│   │   ├── clerkController.js
│   │   ├── guestController.js
│   │   ├── residentController.js
│   │   └── sheetController.js
│   ├── models/
│   │   ├── clerkModel.js
│   │   ├── guestModel.js
│   │   ├── residentModel.js
│   │   └── ImageModel.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── notification/
│   │   └── emails/
│   │       └── registeredClerkEmail.js
│   ├── routes/
│   │   ├── clerkRoutes.js
│   │   ├── guestRoutes.js
│   │   ├── residentRoutes.js
│   │   └── sheetRoutes.js
│   ├── uploads/
│   │   └── clerkProfilePicture.js
│   └── config/
│       └── google-credentials.json   (ignored)
│
└── frontend/
    ├── public/
    └── src/
        ├── components/
        ├── features/
        │   ├── auth/
        │   ├── guests/
        │   ├── residents/
        │   └── sheets/
        ├── images/
        └── app/
```

---

# Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/EBOD13/headingtonportal.git
cd headingtonportal
```

---

# Backend Setup

### 2. Install dependencies

```bash
cd backend
npm install
```

### 3. Environment variables

Create `backend/.env`:

```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret

# Twilio
TWILIO_ACCOUNT_SID=xxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+1xxx

# Google Sheets API
GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json
```

### 4. Start the backend

```bash
npm run dev
```

---

# Frontend Setup

### 1. Install dependencies

```bash
cd ../frontend
npm install
```

### 2. Start the frontend

```bash
npm start
```

Frontend runs at:

```
http://localhost:3000
```

---

# REST API Endpoints

### **Clerks (`/api/clerks`)**

* POST `/register`
* POST `/login`
* GET `/me`

### **Residents (`/api/residents`)**

* POST `/`
* GET `/`
* PUT `/:id`
* DELETE `/:id`

### **Guests (`/api/guests`)**

* POST `/` – Add visitor
* POST `/checkin`
* POST `/checkout`
* GET `/search`

### **Sheets (`/api/sheets`)**

* GET `/export`
* POST `/sync`

---

# Security

* `google-credentials.json` is `.gitignore`d
* `.env` is never committed
* JWT protects clerk-only routes
* Input validation with validator.js
* Safe error handling middleware

---

# Roadmap & Future Implementation

* [ ] Add analytics dashboard (traffic, peak hours)
* [ ] SMS escalation to Residence Life after long overdue
* [ ] Auto-detect returning visitors via phone number
* [ ] Mobile-native interface (React Native)
* [ ] PDF/CSV export UI buttons
* [ ] Resident photo + ID upload
* [ ] Push notifications for clerks

---

# 👤 Author

**Daniel Esambu**
GitHub: [https://github.com/EBOD13](https://github.com/EBOD13)

---
