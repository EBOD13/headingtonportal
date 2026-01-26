# **Headington Portal**

*A modern, secure, production-grade visitor management system built for real-world residential operations.*

---

## 🧭 **Overview**

**Headington Portal** is a full-stack visitor check-in/check-out platform built to replace the slow, error-prone Excel sheets used in athletic student housing.

While working the front desk of an athlete residence hall at the University of Oklahoma, I experienced firsthand how outdated the visitor process was:

### **Pain Points I identified**

1. **Manual Excel tracking** slowed operations dramatically during peak traffic
   (move-in, OU football games, parents weekend).

2. **Collecting physical IDs** created liability and privacy risks
   (lost IDs, long lines, slow checkout).

3. **No real-time visibility** into who is visiting whom, which rooms are busiest, and how long guests stayed.

4. **Zero automation** for overstaying visitors or expired clerk accounts.

### **My goal**

Build a **secure, fast, fully auditable digital system** that:

* Keeps residents safe
* Reduces clerk workload
* Speeds up traffic flow
* Provides admin oversight
* Eliminates ID retention
* Creates an accurate historical audit trail

The result is **Headington Portal**—a production-grade system designed from scratch to solve real operational problems.

Visitors can now be checked in **in under 60 seconds**, and checked out **in under 15 seconds**.

---

## 🎨 **Visual Overview**

Below are sections where you can paste screenshots or animated GIFs to visually demonstrate your system.
These help recruiters instantly understand your UI, workflows, and engineering depth.

📌 Login & Authentication Flow
![Login Screen](IMAGE_URL)


Description:
A secure login system for clerks and admins.
Features include validation, password reset, and role-based access.

🏠 Clerk Dashboard
<p align="center">
  <img src="https://github.com/EBOD13/headingtonportal/blob/main/screenshots/AdminAnalyticsView.png" 
       alt="Clerk Dashboard" 
       width="500">
</p>

Description:
A clean, fast dashboard designed for real-world front desk workflow.
Clerks can access check-in, check-out, visitor search, and activity logs.

📝 Visitor Registration & Check-In Flow
![Check-In](IMAGE_URL)


Description:
Register a visitor, link them to a resident, automatically timestamp actions, and record them in MongoDB.

🚪 Check-Out Flow
![Check-Out](IMAGE_URL)


Description:
One-click checkout with instant timestamping and activity logging.

🔍 Visitor / Resident Search
![Search Modal](IMAGE_URL)


Description:
Ultra-fast search enabling staff to find residents or returning visitors in seconds.

📈 Admin Analytics Dashboard
![Analytics](IMAGE_URL)


Description:
Live statistics for administrators:

Guest volume

Peak traffic

Clerk activity

Recurring visitor patterns

🧑‍💼 Admin Panel — Clerk & Resident Management
![Admin Panel](IMAGE_URL)


Description:
Admins can add/edit/remove clerks & residents, import data, manage roles, and download reports.

📬 Automated Email + SMS Notifications
![Notifications](IMAGE_URL)


Description:
Automated reminders for overstaying visitors, monthly reports, and clerk expirations.

📄 Monthly Report Generation
![Reports](IMAGE_URL)


Description:
Automatically generated Excel/PDF reports summarizing visitor activity for compliance and historical record-keeping.

📦 Data Model & Storage
![Data Models](IMAGE_URL)


Description:
MongoDB models include: Residents, Guests, Clerks, Activity Logs, Messages, and more — all optimized for lookup speed and audit integrity.
# 🚀 **Key Features**

### ✔ Visitor Management

* Register new visitors in seconds
* Fast search for returning visitors
* Link visitors → residents → rooms
* Auto timestamps for check-ins/outs

### ✔ Clerk Tools

* Clean, simple React UI
* One-click check-in & check-out
* Room selector
* Real-time activity feed
* Error validation + notifications

### ✔ Admin Tools

* Manage clerks & residents
* Approve / remove users
* Import residents from CSV / Excel
* Generate and download reports
* Full visibility into all activity

### ✔ Automated Jobs

* **Clerk account expiration**
* **Monthly PDF/Excel reports**
* **Overstay reminders** via Twilio
* **Scheduled analytics generation**

### ✔ Security

* Full JWT authentication
* Role-based authorization
* CORS controlled via `.env`
* Sanitized & validated input
* Activity logging for every action
* No secrets in repository
* Strict `.gitignore` + credential rotation

---

# 🏗️ **System Architecture**

```
                     ┌──────────────────────────────┐
                     │       React Frontend          │
                     │------------------------------│
                     │ Clerk UI & Admin UI           │
                     │ Login / Search / Modals       │
                     │ Check-In / Check-Out          │
                     │ Analytics / Stats             │
                     └───────────────▲──────────────┘
                                     │
                                     │ HTTPS (REST API)
                                     ▼
     ┌────────────────────────────────────────────────────────────────────┐
     │                     Node.js / Express Backend                       │
     │--------------------------------------------------------------------│
     │ Controllers • Middleware • Cron Jobs • Uploads • Reports • Auth    │
     │                                                                    │
     └───────────────────────▲────────────────────────────────────────────┘
                             │
                   ┌─────────┴─────────┐
                   │   MongoDB Atlas   │
                   │-------------------│
                   │ Residents          │
                   │ Guests             │
                   │ Clerks (JWT Auth)  │
                   │ Activity Logs      │
                   │ Reports (Files)    │
                   └────────────────────┘
```

**Additional Integrations:**

* Twilio SMS
* Excel/PDF report generation
* Google Sheets import/export
* Cron-based automation

---

# 📁 **Project Structure (Clean & Professional)**

```
headingtonportal/
│
├── backend/
│   ├── controllers/              # Request handlers
│   ├── database/                 # MongoDB connection
│   ├── jobs/                     # Automated cron jobs
│   ├── middleware/               # Auth, errors, uploads
│   ├── models/                   # Mongoose schemas
│   ├── notification/             # Email templates
│   ├── routes/                   # API endpoint routing
│   ├── utils/                    # Logging, Excel gen, tokens
│   ├── uploads/                  # Profile image handling
│   └── server.js                 # Backend entry point
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/                  # API client
│   │   ├── app/                  # Redux store
│   │   ├── components/           # UI + modals + pages
│   │   ├── features/             # Redux slices/services
│   │   ├── hooks/                # Custom hooks
│   │   ├── images/               # Logos & icons
│   │   ├── overlays/             # Overlay provider
│   │   ├── index.js
│   │   └── App.js
│   └── package.json
│
├── README.md
├── package.json
└── yarn.lock
```

---

# 🛠️ **Tech Stack**

### **Frontend**

* React 18
* Redux Toolkit
* Axios
* Custom Hooks
* CSS Modules
* Modular Component Architecture

### **Backend**

* Node.js + Express
* MongoDB + Mongoose
* Twilio SMS
* JSON Web Tokens (JWT)
* Multer + File Uploads
* ExcelJS + PDF generation
* Cron-based automation
* dotenv + secure config loading

---

# 🔐 **Security & Best Practices**

I implemented strong security principles:

### ⭐ No secrets in source code

* `.env` for all secrets
* Credential rotation after accidental exposure
* Repo history fully sanitized with `git filter-repo`

### ⭐ Role-based access control

* Clerk vs Admin
* JWT + encrypted refresh tokens
* All sensitive routes protected

### ⭐ Safe database interactions

* Sanitized input
* Validation with `validator.js`
* Mongo indexes for performance

### ⭐ Network safety

* CORS origins controlled via `.env`
* No publicly exposed credentials
* Upload sanitization

### ⭐ Auditing & Traceability

Every major action (check-in/out, edits, login attempts) is logged.

---

# 🧪 **Running the App**

### **Backend**

```bash
cd backend
npm install
npm run dev
```

### **Frontend**

```bash
cd frontend
npm install
npm start
```

Default frontend:

```
http://localhost:3000
```

---

# 🧩 **REST API Endpoints (Summary)**

### **Clerks (`/api/clerks`)**

* Register, Login, Profile
* Admin-managed creation

### **Residents (`/api/residents`)**

* Add / edit / delete
* Import from CSV

### **Guests (`/api/guests`)**

* Add visitor
* Check in
* Check out
* Search

### **Reports (`/api/reports`)**

* Monthly summaries
* PDF / Excel export

---

# 📈 **Roadmap**

* Full analytics dashboard (peaks, heatmaps, insights)
* Resident photo uploads
* Push notifications
* QR Code instant check-in
* Mobile app for staff (React Native)
* Role-based dashboards for RAs / supervisors

---

# 👤 **Author**

**Daniel Esambu**

* GitHub: [https://github.com/EBOD13](https://github.com/EBOD13)
* Portfolio: *coming soon*
* Email: [daniel.esambu@ou.edu](mailto:daniel.esambu@ou.edu)

---

# 💡 Why this project matters (for employers)

This project demonstrates:

### 🔨 **Full-stack engineering ability**

* Architected backend + frontend from scratch
* Designed API routes, schemas, auth, and UI flows
* Implemented real-world automation (cron jobs, SMS, logs)

### 🔒 **Security awareness**

* Immediate credential rotation
* History rewrites
* Environment-driven config
* No secrets exposed in production

### 🚀 **Product thinking**

This wasn’t built for LeetCode — it was built for a real operational environment with real stakeholders and real pain points.

### 🧹 **Code quality & maintainability**

* Clear folder structure
* Modular design
* Reusable hooks + reducers
* Scalable API architecture

### 📊 **Systems thinking**

Combines:

* front desk workflow
* security policies
* UX design
* database modeling
* operational efficiency
