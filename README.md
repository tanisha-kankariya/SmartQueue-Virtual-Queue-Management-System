# SmartQueue – Virtual Queue Management System

> **Skip the Line, Save Your Time.**  
> A modern, responsive SaaS frontend for managing virtual queues across hospitals, banks, university offices, and citizen service centers—built without a backend using Vanilla JavaScript and browser `localStorage`.

---

## Overview

Long physical waiting lines waste hours for visitors and create front-desk congestion for staff. **SmartQueue** replaces paper slips and crowded lobbies with a unified digital queue platform:

- **Citizens & Visitors** can preview live department wait times, book a unique digital token in seconds, track queue movement in real time, and cancel bookings anytime.
- **Counter Staff** can filter queues by service center/department and call the next customer, mark visits completed, skip no-shows, or recall skipped tokens.
- **Administrators** get organization-wide queue metrics, interactive SVG analytics charts, and live CRUD controls for service counters and departments.

---

## Tech Stack

- **Markup & Structure:** HTML5
- **Styling & Layout:** CSS3 (custom design system in `SmartQueue/css/style.css`) + Bootstrap 5.3.3 (CDN)
- **Icons & Typography:** Font Awesome 6.5.1 (CDN), Google Fonts (`Plus Jakarta Sans` & `Inter`)
- **Interactivity & State:** Vanilla JavaScript (ES6+) with `localStorage` persistence (`smartqueue_demo_state_v1`) and cross-tab `storage` synchronization
- **Visual Assets:** Custom SVG graphics (`SmartQueue/assets/images/`) and responsive inline SVG charts

---

## Folder Structure

```text
SmartQueue/
├── index.html          # SaaS landing page with live queue summary & sector shortcuts
├── dashboard.html      # User dashboard (KPI cards, active token spotlight, token history)
├── booking.html        # Token booking form with live wait-time preview & digital pass
├── tracking.html       # Live queue radar (serving token, people ahead, progress & stepper)
├── staff.html          # Staff counter console (Call Next, Complete, Skip, Recall)
├── admin.html          # Admin analytics charts + Service Counter & Department CRUD
├── css/
│   └── style.css       # Shared SaaS theme, sidebar shell, cards, tables, modals & toasts
├── js/
│   ├── main.js         # Shared state store, seed demo data, queue calculator, modals & toasts
│   ├── booking.js      # Cascading dropdowns, validation, token generator & confirmation card
│   ├── tracking.js     # Live queue tracking, Refresh simulation, Auto-Simulate & cancellation
│   └── dashboard.js    # User, Staff & Admin dashboard controllers + SVG chart renderers
└── assets/
    └── images/
        ├── logo.svg
        ├── hero-illustration.svg
        └── empty-queue.svg
```

---

## Pages & Key Functionality

| Page | Purpose | Key Capabilities |
| --- | --- | --- |
| **Landing Page** (`index.html`) | Product overview & entry point | Hero CTA (`Get Started`, `View Demo`), sector quick-book links, How It Works, Features, Benefits, live status badge, footer |
| **User Dashboard** (`dashboard.html`) | Visitor overview | Welcome banner, 4 KPI cards, active token progress spotlight, searchable & filterable token history, details modal |
| **Book a Token** (`booking.html`) | Reserve a queue slot | Cascading Service Center → Department selection, live wait preview, form validation, unique token generation (`OPD-###`), printable ticket |
| **Live Tracking** (`tracking.html`) | Monitor queue movement | Currently serving token, people ahead, dynamic ETA, 4-step progress stepper, anonymized queue lineup, **Refresh Queue**, **Auto-Simulate (8s)**, **Cancel Token** modal |
| **Staff Dashboard** (`staff.html`) | Manage active desk queues | Filter by center/department, **Call Next Token**, **Mark as Completed**, **Skip Token**, per-row queue actions, search & status filter |
| **Admin Dashboard** (`admin.html`) | Analytics & configuration | KPI cards, interactive SVG bar & donut charts, department load bars, Add/Edit/Toggle/Delete **Service Counters** and **Departments** |

---

## Getting Started Locally

No build tools, Node installation, or API keys are required.

### Option 1: Run a Local HTTP Server (Recommended)
```bash
cd SmartQueue
python3 -m http.server 4173
```
Open **`http://localhost:4173/index.html`** in your browser.

### Option 2: VS Code Live Server / Direct Open
- Open `SmartQueue/index.html` with the **Live Server** extension in VS Code, or double-click `SmartQueue/index.html` to open it in your browser.
- *(An internet connection is recommended so Bootstrap 5, Font Awesome, and Google Fonts load from their CDNs.)*

---

## Demo Walkthrough Tips

1. **Pre-Seeded Active Demo:** On first load, SmartQueue seeds 4 service centers, 10 departments, 6 service counters, and 18 tokens—including active user token **`OPD-108`** at *City Care General Hospital*.
2. **Cross-Tab Live Sync:** Open `staff.html` in one browser tab and `tracking.html` in a second tab side by side. Clicking **Call Next Token** in the Staff Console updates the User Live Tracker in real time via `localStorage` `storage` events.
3. **Reset Anytime:** Click **Reset Demo Data** in the sidebar or footer to restore the default sample dataset.

---

## Future Backend Integration (Java + Spring Boot + MySQL)

The frontend data layer in `SmartQueue/js/main.js` is structured around clean domain models (`centers`, `departments`, `counters`, `tokens`, `notifications`) so `localStorage` operations can be replaced with REST endpoints:

- **User & Role Auth:** `POST /api/auth/login`, `GET /api/users/me`
- **Centers, Departments & Counters:** `GET/POST/PUT/DELETE` on `/api/centers`, `/api/departments`, `/api/counters`
- **Token Booking & History:** `POST /api/tokens`, `GET /api/tokens/history`
- **Live Queue Updates:** WebSocket (STOMP) or SSE stream replacing `computeQueueMetrics()` polling/simulation
- **Staff Queue Actions:** `POST /api/staff/call-next`, `PATCH /api/tokens/{id}/complete`, `PATCH /api/tokens/{id}/skip`
- **Admin Analytics:** `GET /api/admin/analytics/daily` backed by MySQL aggregate queries
