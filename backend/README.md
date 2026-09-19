# Smart Municipality Portal — Backend

Complete Express + MySQL backend.

## ⚠️ Migrations to run

Run these once in phpMyAdmin (Database: smart_municipality_portal → SQL tab), in order:
1. `migration_add_payment_fields.sql`
2. `migration_add_officer_response.sql`
3. `migration_rbac_admin_officer.sql` — required for everything described below
   (Officer verification, application/complaint assignment, departments,
   municipal services, notifications, system settings, single-Admin
   enforcement). See the comments inside that file for the phpMyAdmin
   `DELIMITER` note on the two triggers at the bottom.

## ⚠️ Known accounts that won't log in

Your data dump shows `user_id 6` (`citizen@test.com`) has a **plaintext password**
(`test1234`), not a bcrypt hash — it was likely inserted directly in phpMyAdmin
rather than through `/api/auth/register`. Login now detects this case and returns
a clear message instead of crashing, but that account cannot log in until you
either re-register it fresh or update its password hash directly in the database.

## Role-based access control

There are four roles: **Citizen**, **Business**, **Officer**, **Admin**.

- **Citizen** and **Business** self-register via `/api/auth/register` and log in
  via `/api/auth/login`. Neither can ever select `Officer` or `Admin` as a role
  — the endpoint rejects it outright.
- **Officer** self-registers via `/api/auth/staff/register` (department,
  designation, and identity/qualification documents required) but the account
  sits in `officer_status = 'Pending'` and **cannot log in** until an Admin
  approves it via `PATCH /api/admin/officers/:id/approve`. An Admin can also
  reject (with a reason), suspend, or reactivate an Officer at any time —
  suspension takes effect immediately, even on an already-issued JWT, because
  every Officer-only route re-checks `officer_status` against the database
  (`requireApprovedOfficer` middleware).
- **Admin** is never self-registrable anywhere. The system's single Admin
  account is created exactly once via `POST /api/auth/admin/bootstrap`, which
  is gated by an `ADMIN_BOOTSTRAP_KEY` secret in `.env` and permanently refuses
  once an Admin exists — enforced both in application code and by a database
  trigger (`migration_rbac_admin_officer.sql`) as defense in depth. There is no
  UI page for this; it's meant to be called once, out of band, when standing up
  the system (e.g. with `curl`).
- Every Officer- and Admin-only endpoint below checks the caller's role on the
  server (`requireRole`), never just in the frontend. An Officer only ever sees
  work explicitly assigned to them by an Admin — there is no endpoint that
  hands an Officer system-wide data; that's what the `/api/admin/*` endpoints
  are for.

## Setup

```
npm install
npm run dev
```
Requires XAMPP's MySQL running, `.env` credentials matching your setup, and
`ADMIN_BOOTSTRAP_KEY` set if you need to create the Admin account.

## Full route list

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | /api/auth/register | none | Citizen/Business only. Business role also needs `business_name`, `owner_name`, optional `business_type`, `pan_number` |
| POST | /api/auth/login | none | Citizen/Business login. Rejects staff accounts and Blocked accounts |
| POST | /api/auth/staff/register | none | multipart, field `documents` (up to 5). Body: `full_name`, `email`, `password`, `department`, `designation`, optional `phone`/`address`. Always creates an **Officer**, `officer_status='Pending'` |
| POST | /api/auth/staff/login | none | Officer or Admin login. Officer is blocked unless `officer_status='Approved'` |
| POST | /api/auth/admin/bootstrap | none (secret-gated) | Body: `full_name`, `email`, `password`, `bootstrap_key` (must match `ADMIN_BOOTSTRAP_KEY`). Refuses if an Admin already exists |
| PATCH | /api/auth/change-password | any authenticated role | Body: `current_password`, `new_password` |
| GET | /api/departments | none (public) | Feeds the department dropdown on Officer registration |
| GET | /api/notices | none (public) | View the announcement board |
| GET | /api/notifications/mine | any authenticated role | My notifications (direct, role-targeted, or broadcast) |
| PATCH | /api/notifications/:id/read | any authenticated role | |
| PATCH | /api/notifications/read-all | any authenticated role | |
| GET | /api/citizen/requests | Citizen | My certificate requests |
| GET | /api/citizen/stats | Citizen | My request counts by status |
| GET | /api/citizen/tax-payments | Citizen | My tax payment history |
| POST | /api/certificates/apply | Citizen, Business | multipart, field `document`. Body: `certificate_type`, `purpose` |
| POST | /api/complaints | Citizen, Business | multipart, field `image`. Body: `subject`, `description`, optional `location` |
| GET | /api/complaints/mine | Citizen, Business | My complaints, including any `officer_response` |
| GET | /api/products | none (public) | `?category_id=` optional. Never includes an Admin-removed product |
| GET | /api/products/categories | none (public) | |
| GET | /api/products/mine | Business | My listings + my business approval status |
| POST | /api/products | Business | **Blocked unless business is Approved.** multipart, field `image` |
| GET | /api/cart | Citizen, Business | |
| POST | /api/cart/items | Citizen, Business | Body: `product_id`, `quantity` |
| DELETE | /api/cart/items/:id | Citizen, Business | |
| POST | /api/orders/checkout | Citizen, Business | Converts cart → order in a transaction |
| GET | /api/orders/mine | Citizen, Business | |
| GET | /api/orders/business | Business | Incoming orders for my products |
| POST | /api/tax/pay | Citizen, Business | Body: `tax_type`, `amount`, `payment_method` |
| **Officer — every endpoint below is scoped to MY OWN assignments** ||||
| GET | /api/officer/queue | Officer | My assigned certificate applications, incl. document path |
| GET | /api/officer/stats | Officer | My assigned application counts by status + assigned complaint count |
| PATCH | /api/officer/applications/:id | Officer | Body: `status` (Pending/Processing/Approved/Rejected/Completed), optional `remarks`. 403 if not assigned to me |
| PATCH | /api/officer/applications/:id/request-info | Officer | Body: `message` — asks the citizen for more documents/info |
| GET | /api/officer/complaints | Officer | My assigned complaints only |
| PATCH | /api/officer/complaints/:id | Officer | Body: optional `status` (Pending/In Progress/Resolved), optional `response`. 403 if not assigned to me |
| GET | /api/officer/profile | Officer | My account, incl. department/designation/officer_status |
| PATCH | /api/officer/profile | Officer | Body: optional `phone`, `address` |
| GET | /api/officer/reports | Officer | My assigned work only — never system-wide |
| **Admin — full system access** ||||
| GET | /api/admin/stats | Admin | Dashboard overview: totals, pending counts, recent activity feed |
| GET | /api/admin/officers | Admin | `?status=Pending\|Approved\|Rejected\|Suspended` |
| GET | /api/admin/officers/:id | Admin | Detail + submitted documents |
| PATCH | /api/admin/officers/:id/approve | Admin | |
| PATCH | /api/admin/officers/:id/reject | Admin | Body: `reason` (required) |
| PATCH | /api/admin/officers/:id/suspend | Admin | |
| PATCH | /api/admin/officers/:id/activate | Admin | Reinstates a suspended Officer |
| GET | /api/admin/citizens | Admin | `?search=&status=` |
| GET | /api/admin/citizens/:id | Admin | Profile + certificates + complaints + orders |
| GET | /api/admin/businesses | Admin | `?status=` |
| GET | /api/admin/businesses/:id | Admin | Detail + product listing |
| PATCH | /api/admin/businesses/:id | Admin | Body: `status` (Approved/Rejected/Pending/Suspended) |
| PATCH | /api/admin/users/:id/status | Admin | Body: `status` (Active/Blocked) — citizens or businesses |
| GET/POST/PATCH/DELETE | /api/admin/services | Admin | Municipal services CRUD: fee, required documents, department, assigned officer, `is_active` |
| GET/POST/PATCH/DELETE | /api/admin/departments | Admin | |
| GET/PATCH | /api/admin/settings | Admin | Flat key/value system settings |
| GET | /api/admin/applications | Admin | `?status=&certificate_type=&officer_id=` — every application |
| PATCH | /api/admin/applications/:id/assign | Admin | Body: `officer_id` (must be an Approved Officer) |
| GET | /api/admin/complaints | Admin | `?status=&officer_id=&escalated=` — every complaint |
| PATCH | /api/admin/complaints/:id/assign | Admin | Body: `officer_id` |
| PATCH | /api/admin/complaints/:id/escalate | Admin | |
| PATCH | /api/admin/complaints/:id/close | Admin | |
| GET | /api/admin/marketplace/products | Admin | Every product, incl. removed ones |
| PATCH | /api/admin/marketplace/products/:id/remove | Admin | Hides from public listing |
| PATCH | /api/admin/marketplace/products/:id/restore | Admin | |
| GET | /api/admin/marketplace/orders | Admin | Every order, system-wide |
| POST/PATCH/DELETE | /api/admin/notices | Admin | Body incl. `target_role` (All/Citizen/Business/Officer) |
| GET | /api/admin/reports | Admin | System-wide analytics: citizens, businesses, officers, applications, complaints, orders, payments |
| GET/PATCH | /api/admin/profile | Admin | My own account |
