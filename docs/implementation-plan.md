# Implementation Plan

Based on [project-scope.md](./project-scope.md) and [tech-stack.md](./tech-stack.md).

Every client component is built mobile-first from the start, in every phase below — base
(unprefixed) Tailwind classes target the smallest viewport, with `sm:`/`md:`/`lg:`/`xl:` layering
on progressively larger layouts. This is a standing requirement, not a deferred polish pass.

## Phase 0 — Project Setup & Infrastructure

1. Set up monorepo structure (`client/` React, `server/` Express)
2. Define the branch set (`dev`, `main`)
3. Setup Postgres database

---

## Phase 1 — Authentication & Roles

1. Build basic authentication shell (logged-in, logout layout)
2. Implement Zoho SSO login flow (domain restricted)
3. Implement `User` / `Admin` role model + middleware for role-based route protection.
4. Add route protection on the frontend (redirect to login if unauthenticated)

---

## Phase 2 — Core Data Models & Admin CRUD

1. Design and migrate schema for: announcements, events, employee, resources, quick links
2. Backend CRUD API endpoints per entity, create/edit/delete gated by RBAC
3. Create user and resource management page (admin only)

---

## Phase 3 — Employee-Facing Views

1. Home/dashboard page assembling: banner slider, quick links, this month's announcements, this
   month's events, this month's joined staff, birthdays this month, latest blog posts
2. Announcements list/detail view
3. Events list/detail view with **Add to Calendar** button
4. Resources list/detail view (markdown article)
5. Quick links list view
6. Employee directory — searchable staff listing (name, email, employee ID, department,
   designation, location, joined date), reusing Users' Department/Designation/Location lookups;
   sortable by recently joined
7. Blogs list/detail view, sourced from an external Ghost CMS Content API via a server-side proxy

---

## Phase 4 — Mood Check-In

1. Backend: daily mood submission endpoint (emoji-based), enforce one submission per employee per day without persisting a queryable identity-to-submission link
2. Aggregate endpoint: org-wide mood trend (daily/weekly emoji distribution)
3. Frontend: emoji check-in widget on dashboard
4. Frontend: aggregate mood trend view, visible to Admin only

---

## Phase 5 — Polish, Testing & Hardening

1. Final responsive/cross-device QA audit across all views (components are mobile-first from the
   start per every phase above — this is verification and gap-fixing, not the first mobile pass)
2. Input validation and error handling across API endpoints
3. Access control tests: role boundaries generally, plus explicit verification that no individual mood submission is ever retrievable by any role
4. End-to-end tests for critical flows: login, add announcement, add-to-calendar, mood check-in
5. File upload size/type validation for banner attachments
6. Security review (auth flows, organization-restriction enforcement, file upload handling, SQL injection/XSS checks)
7. Enable dependency and secret scanning in the CI pipeline

---

## Phase 6 — Launch

1. Final UAT with a pilot group of employees
2. Write Dockerfile for server and client
3. Set up Docker Compose for local development
4. Write deployment configuration and automated CI phase.
