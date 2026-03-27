# SEVA Shelter Management System (SEVA SMS) - PRD

## Original Problem Statement
Build a full-stack, production-ready web application for managing animal rescue, treatment, sterilisation, shelter tracking, and operations. Mobile-first, responsive design with green theme from SEVA logo.

## Architecture
- **Frontend**: React with Shadcn UI, Tailwind CSS, Recharts
- **Backend**: FastAPI with MongoDB (Motor async driver)
- **Storage**: Emergent Object Storage for media files
- **Auth**: JWT with device control

## User Personas
1. **Admin**: Full access - manage users, vets, locations, soft-delete cases, change password
2. **User (Staff/Volunteer)**: Add/edit cases, checkups, media upload

## Core Requirements (Static)
- Case lifecycle: Rescue → Shelter → Observation → Outcome
- Vet checkup records with attachments (prescriptions)
- Sterilisation records with photos
- Movement tracking between shelters
- Dashboard with real-time metrics
- Device-based login control (one device per user, admins exempt)

## What's Been Implemented (March 2026)

### Phase 1 - MVP
- [x] JWT Authentication with device control
- [x] Case CRUD with all status options
- [x] Vet Checkup management with prescription uploads
- [x] Sterilisation records (editable)
- [x] Movement tracking
- [x] Dashboard with metrics & charts
- [x] User Management (admin)
- [x] File upload to Emergent Object Storage
- [x] Green theme from SEVA logo
- [x] Mobile-first responsive design

### Phase 2 - Feature Enhancements
- [x] Date filters (Today, Yesterday, Last 7 Days, Last 30 Days, Custom)
- [x] Movement reason "Others" with custom text input
- [x] Media upload during case creation with mandatory descriptions
- [x] Special Notes section per case
- [x] Follow-up notifications with reminders (Overdue, Today, Tomorrow)
- [x] Date format: "26th March, 2026" and time "4:23pm"
- [x] Admin: Vet Names management for dropdown
- [x] Admin: Sterilisation Locations management
- [x] Admin: Password change functionality
- [x] Editable vet checkups with prescription uploads
- [x] Editable sterilisation records
- [x] Updated conditions: Accident, Cancer, Injury, Sick, Critical, Canine Distemper, Parvo Virus, Not Sure
- [x] Case Type before Condition (disabled for Sterilisation Only)
- [x] Status: Removed "Under Recovery", renamed "Rescue Created" to "Rescued (Status Pending)"
- [x] Filter count display
- [x] Dashboard: Total Cases block
- [x] Case List thumbnails display correctly from Object Storage
- [x] Reporter Informed notification for deceased animals (tracks if reporter was notified about animal's passing)
- [x] Dashboard deceased notifications section - Admin view shows all deceased cases with reporter status

## P1 - Backlog
- [ ] Inventory/Medicine stock module
- [ ] Audit log viewer UI
- [ ] Advanced case search with GPS
- [ ] Push notifications for follow-ups

## P2 - Future
- [ ] Offline support/PWA
- [ ] GPS location capture
- [ ] Reports export (PDF)
- [ ] Mobile app

## Credentials
- **Admin**: admin@seva.org / Admin@123
