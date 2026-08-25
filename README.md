# 🚨 Disaster Relief Coordination Platform

> **Verify • Coordinate • Respond** — A centralized disaster relief management system connecting **Affected Individuals**, **Control Rooms**, and **Verified NGOs** through a trusted emergency-response workflow.

---

## 🌍 Overview

Disasters demand **fast, reliable, and coordinated action**. Unfortunately, communication between affected people, authorities, and NGOs is often fragmented, leading to delayed or duplicated relief efforts.

**Disaster Relief Coordination Platform** is a location-aware web application that streamlines the complete disaster response lifecycle—from emergency reporting to verified NGO assistance—using interactive maps, evidence verification, disaster-zone management, and real-time coordination.

### 🎯 Mission

To create a **trusted digital bridge** between people in need and verified relief organizations while enabling control rooms to coordinate emergency response efficiently.

---

# 🚀 Key Features

### 👤 Affected Person Dashboard

- Submit emergency requests
- Share live location with map support
- Upload supporting evidence
- Track request verification status
- View nearby verified NGOs
- Confirm when help is received
- Submit feedback after assistance

### 🏢 Control Room Dashboard

- Review incoming emergency requests
- Verify evidence before approval
- Coordinate verified requests
- Notify verified NGO network
- Monitor NGO responses
- Verify NGO registrations & documents
- Manage disaster zones on interactive maps

### 🤝 NGO Dashboard

- Register NGO with legal documents
- Get verified by Control Room
- View verified emergency requests
- Respond with **“We Can Help”**
- Track ongoing assistance requests

### 🗺️ Interactive Mapping

- Emergency request locations
- NGO locations
- Operating radius visualization
- Disaster zone management
- Distance-based coordination

---

# 🧩 The Problem We Solve

Traditional disaster management suffers from:

- ❌ Fake or unverified emergency requests
- ❌ Unverified organizations entering relief operations
- ❌ Poor communication between NGOs and authorities
- ❌ Lack of geographical coordination
- ❌ No centralized tracking of relief responses

Our platform introduces **verification before coordination**, ensuring that only genuine emergencies reach trusted NGOs.

---

# 🔄 Complete Workflow

Affected Person
      │
      ▼
Submit Emergency Request
      │
      ▼
Control Room Verification
      │
      ├── Reject
      │
      └── Verify
             │
             ▼
Publish to Verified NGO Network
             │
             ▼
NGOs Review Request
             │
             ├── Can Help
             └── Cannot Help
             │
             ▼
NGO Response
             │
             ▼
Relief Assistance
             │
             ▼
Help Confirmation & Review

---

# 👤 Affected Person Module

The Individual Dashboard empowers disaster victims to request help quickly.

## Features

- 📍 Location-based emergency reporting
- 👥 Number of affected people
- ⏳ Days without support
- 🏥 Relief requirement selection
- 📝 Situation description
- 📷 Evidence upload
- 📊 Live request status
- 🗺️ Nearby NGO discovery
- ⭐ Post-assistance review

### Request Lifecycle

Submitted
   ↓
Pending Verification
   ↓
Verified
   ↓
NGO Network Notified
   ↓
NGO Response
   ↓
Help Received
   ↓
Review Submitted

---

# 🏢 Control Room Module

The Control Room acts as the **central coordination authority**.

## 1. Verify Emergency Requests

Every request is manually reviewed before entering the relief network.

**Verification includes:**

- Request details
- Emergency location
- Uploaded evidence
- Reporter information

Only verified requests proceed further.

---

## 2. Coordinate Verified Requests

Instead of assigning NGOs manually, the Control Room publishes verified requests to the NGO network.

Verified Request
       │
       ▼
Verified NGO Network
       │
       ▼
NGOs Decide Independently

This ensures NGOs respond based on their actual resources and availability.

---

## 3. Track NGO Responses

Control Room monitors responses like:

🏠 Goonj
✓ Will Help

This provides complete transparency during relief coordination.

---

## 4. Verification Alerts

Special requests requiring additional manual attention appear separately in the **Verification Alerts** section.

---

# 🤝 NGO Module

NGOs register through a dedicated onboarding workflow.

## Registration Information

- NGO Name
- Registration Number
- PAN Number
- Contact Person
- Phone & Email
- City & State
- Operating Radius
- Available Services

## Document Uploads

- Registration Certificate
- PAN Document

## NGO Verification

The Control Room verifies NGOs before they become eligible relief partners.

Verification Checklist:

- Registration certificate reviewed
- PAN verified
- Organization validated
- Approved / Rejected

---

# 🗺️ Interactive Mapping System

Maps are the core of the coordination platform.

## Displays

- 🔴 Emergency Requests
- 🟢 Verified NGOs
- 📍 User Location
- 🌪️ Disaster Zones
- 📏 NGO Operating Radius

### Marker Legend

🔴 Individual Request

🟢 Verified NGO

🟠 Disaster Zone

---

# 🌪️ Disaster Zone Management

Control Room staff can create disaster zones for:

- Floods
- Landslides
- Earthquakes
- Cyclones
- Other emergencies

Each disaster zone stores:

- Name
- Severity
- Coordinates
- Radius

This helps prioritize requests originating from affected regions.

---

# 📍 Geographical Coordination

Each NGO has an operating radius.

The system combines:

Emergency Location
       +
NGO Location
       +
Operating Radius
       ↓
Eligible Relief Partners

Distance helps identify nearby NGOs without forcing automatic assignment.

---

# 🔐 Verification Model

The platform separates **request verification** from **NGO verification**.

## Emergency Verification

Emergency Request
      ↓
Evidence Review
      ↓
Control Room Approval

## NGO Verification

NGO Registration
      ↓
Document Review
      ↓
Control Room Approval

This creates two independent trust layers within the platform.

---

# 📊 Dashboards

## 👤 Individual Dashboard

- Current emergency request
- Verification status
- Nearby NGOs
- Relief map
- Help confirmation
- Reviews

## 🏢 Control Room Dashboard

- Needs Review
- Verified Requests
- NGO Partners
- NGO Responses
- Disaster Zones
- Verification Alerts

## 🤝 NGO Dashboard

- Organization profile
- Operating radius
- Verified requests
- Help responses
- Active assistance

---

# 🛠️ Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend | HTML5, CSS3, JavaScript |
| Maps | Leaflet + OpenStreetMap |
| Storage | LocalStorage & SessionStorage |
| Deployment | Netlify |
| Version Control | Git & GitHub |

---

# 🏗️ Project Architecture

                    Browser
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
  Individual      Control Room      NGO
   Dashboard        Dashboard     Dashboard
         │             │             │
         └─────────────┼─────────────┘
                       ▼
              JavaScript Modules
         ├── Request Management
         ├── Verification
         ├── NGO Management
         ├── Coordination
         ├── Mapping
         └── Response Tracking
                       │
                       ▼
              Browser Storage

---

# 📂 Project Structure

Disaster-Relief-Platform/
│
├── index.html
├── login.html
├── signup.html
│
├── individual-dashboard.html
├── ngo-dashboard.html
├── control-room.html
│
├── css/
│   ├── style.css
│   ├── dashboard.css
│   └── maps.css
│
├── js/
│   ├── dispatcher.js
│   ├── ngo-register.js
│   ├── individual.js
│   ├── control-room.js
│   └── maps.js
│
├── images/
│   ├── ngo/
│   ├── disasters/
│   └── icons/
│
└── README.md

---

# 🔄 Data Flow

Affected Person
      │
      ▼
Emergency Request
      │
      ▼
Control Room
      │
      ▼
Verified Request
      │
      ▼
NGO Network
      │
      ▼
NGO Response
      │
      ▼
Help Confirmation

---

# 🧪 Testing

## Individual

- Emergency request submission
- Location selection
- Evidence upload
- Status tracking
- NGO visibility
- Review submission

## Control Room

- Request verification
- Evidence inspection
- NGO notification
- NGO response monitoring
- Disaster zone management

## NGO

- Registration
- Document upload
- Verification
- Viewing requests
- Responding to emergencies

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/your-username/disaster-relief-platform.git
cd disaster-relief-platform
```

## Run Locally

Open the project in **VS Code** and launch **Live Server**.


# 🌐 Deployment

The project is deployed using **Netlify**.

GitHub Repository
        ↓
Connect to Netlify
        ↓
Deploy
        ↓
Live Disaster Relief Platform

---

# 🎨 Design Philosophy

The interface follows three principles:

- **Trust** → Verification before coordination
- **Clarity** → Separate dashboards for every stakeholder
- **Geography** → Maps drive better emergency decisions

---

# 🔮 Future Enhancements

- Real backend APIs
- Cloud database
- SMS & Email alerts
- Push notifications
- AI-based request prioritization
- Live NGO availability
- Route optimization
- Mobile application
- Multi-language support
- Offline emergency reporting

---

# 👥 Team

**Disaster Relief Coordination Platform**

- Jiya
- Vidhi Mahajan 
- Divyam Aeron

---

# 📜 License

This project was developed for academic and educational purposes to demonstrate disaster relief coordination, verification workflows, NGO management, and location-based emergency response.
