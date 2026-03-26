# SEVA Shelter Management System (SEVA SMS) - PRD

## Original Problem Statement
Build a full-stack, production-ready web application for managing animal rescue, treatment, sterilisation, shelter tracking, and operations. Mobile-first, responsive design with green theme from SEVA logo.

## Architecture
- **Frontend**: React with Shadcn UI, Tailwind CSS, Recharts
- **Backend**: FastAPI with MongoDB (Motor async driver)
- **Storage**: Emergent Object Storage for media files
- **Auth**: JWT with device control

## User Personas
1. **Admin**: Full access - manage users, cases, soft-delete functionality
2. **User (Staff/Volunteer)**: Add/edit cases, checkups, media upload

## Core Requirements (Static)
- Case lifecycle: Rescue → Shelter → Observation → Outcome
- Vet checkup records with attachments
- Sterilisation records with photos
- Movement tracking between shelters
- Dashboard with real-time metrics
- Device-based login control (one device per user, admins exempt)

## What's Been Implemented (March 2026)
- [x] JWT Authentication with device control
- [x] Case CRUD with all status options
- [x] Vet Checkup management
- [x] Sterilisation records
- [x] Movement tracking
- [x] Dashboard with metrics & charts
- [x] User Management (admin)
- [x] File upload to Emergent Object Storage
- [x] Green theme from SEVA logo
- [x] Mobile-first responsive design

## P0 - Completed
- Case management with full lifecycle
- Dashboard metrics
- Authentication & authorization
- File storage integration

## P1 - Backlog
- Inventory/Medicine stock module
- Audit log viewer
- Advanced case search
- Push notifications for follow-ups

## P2 - Future
- Offline support/PWA
- GPS location capture
- Reports export (PDF)
- Mobile app

## Next Tasks
1. Add inventory management module
2. Create audit log viewing UI
3. Add case export functionality
