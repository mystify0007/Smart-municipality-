# Smart Municipality Portal — Backend

Complete Express + MySQL backend. **Every table's schema is now confirmed** against
your real database export (Sep 18, 2026 SQL dump) — no more guessed column names.

## ⚠️ Known accounts that won't log in

Your data dump shows `user_id 6` (`citizen@test.com`) has a **plaintext password**
(`test1234`), not a bcrypt hash — it was likely inserted directly in phpMyAdmin
rather than through `/api/auth/register`. Login now detects this case and returns
a clear message instead of crashing, but that account cannot log in until you
either re-register it fresh or update its password hash directly in the database.

## New business approval workflow

`businesses.status` is `Pending` / `Approved` / `Rejected`. Registering as a
Business now:
1. Creates a `users` row (role = Business)
2. Creates a matching `businesses` row with `status = 'Pending'`
3. **Blocks that account from listing products** until an Admin approves it via
   `PATCH /api/admin/businesses/:id` with `{ "status": "Approved" }`

This matches the `status` column your schema already had — it wasn't being used
by anything before.

## Setup

```
npm install
npm run dev
```
Requires XAMPP's MySQL running, `.env` credentials matching your setup.

## Full route list

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | /api/auth/register | none | Create account. Business role also needs `business_name`, `owner_name`, optional `business_type`, `pan_number` |
| POST | /api/auth/login | none | Get JWT. Rejects Blocked accounts and legacy plaintext-password rows |
| GET | /api/citizen/requests | Citizen | My certificate requests |
| GET | /api/citizen/stats | Citizen | My request counts by status |
| GET | /api/citizen/tax-payments | Citizen | My tax payment history |
| POST | /api/certificates/apply | Citizen, Business | multipart, field `document`. Body: `certificate_type`, `purpose` |
| GET | /api/officer/queue | Officer, Admin | All applications, joined with citizen info |
| GET | /api/officer/stats | Officer, Admin | Counts by status |
| PATCH | /api/officer/applications/:id | Officer, Admin | Body: `status` (Approved/Rejected), optional `remarks` |
| GET | /api/officer/complaints | Officer, Admin | All complaints |
| PATCH | /api/officer/complaints/:id | Officer, Admin | Body: `status` (Pending/In Progress/Resolved) |
| GET | /api/admin/stats | Admin | Totals + pending business count |
| GET | /api/admin/businesses | Admin | List businesses, `?status=Pending` to filter |
| PATCH | /api/admin/businesses/:id | Admin | Body: `status` (Approved/Rejected/Pending) |
| PATCH | /api/admin/users/:id/status | Admin | Body: `status` (Active/Blocked) |
| POST | /api/admin/notices | Admin | Body: `title`, `description`, optional `publish_date` (defaults to today) |
| GET | /api/notices | none (public) | View notice board |
| POST | /api/tax/pay | Citizen, Business | Body: `tax_type` (House Tax/Land Tax/Business Tax/Water Bill), `amount`, `payment_method` (Cash/eSewa/Khalti/Bank) |
| POST | /api/complaints | Citizen, Business | multipart, field `image`. Body: `subject`, `description`, optional `location` |
| GET | /api/complaints/mine | Citizen, Business | My complaints |
| GET | /api/products | none (public) | `?category_id=` optional |
| GET | /api/products/categories | none (public) | |
| GET | /api/products/mine | Business | My listings + my business approval status |
| POST | /api/products | Business | **Blocked unless business is Approved.** multipart, field `image`. Body: `product_name`, `price`, `category_id` (required), optional `description`, `stock` |
| GET | /api/cart | Citizen, Business | |
| POST | /api/cart/items | Citizen, Business | Body: `product_id`, `quantity` |
| DELETE | /api/cart/items/:id | Citizen, Business | |
| POST | /api/orders/checkout | Citizen, Business | Converts cart → order in a transaction |
| GET | /api/orders/mine | Citizen, Business | |
| GET | /api/orders/business | Business | Incoming orders for my products |
