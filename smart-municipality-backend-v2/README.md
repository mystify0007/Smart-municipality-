# Smart Municipality Portal — Backend (v2, matched to real DB)

This version is rewritten to match your **actual** database schema from
`smart_municipality_portal.sql` — real column names, real primary key names,
and real (capitalized) enum values. Do not use the earlier v1 code; replace
your whole backend folder with this one.

## Step 1 — Run this SQL first (required)

Your schema is missing a few columns/tables that some features need. Run this
once in phpMyAdmin's SQL tab on `smart_municipality_portal`:

```sql
ALTER TABLE users ADD COLUMN status ENUM('Active','Blocked') DEFAULT 'Active';
ALTER TABLE certificates ADD COLUMN document_path VARCHAR(255) DEFAULT NULL;
ALTER TABLE complaints ADD COLUMN image VARCHAR(255) DEFAULT NULL;

CREATE TABLE reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  order_id INT NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Step 2 — Replace your backend folder

Delete (or rename) your old `smart-municipality-backend` folder entirely and
extract this zip in its place. Then:

```bash
npm install
cp .env.example .env
```

Edit `.env` with your real DB credentials (same as before — `DB_USER=root`,
`DB_PASSWORD=` blank if you have no MySQL root password).

## Step 3 — Run it

```bash
npm run dev
```

You should see `Server running on port 5000`.

## Important note about your seed data

Several rows already in your `users` table (from your SQL dump) have
**plain-text passwords** like `123456`, not bcrypt hashes:

```
Jennie Shrestha | jennie22@gmail.com | password: 123456
Shilpa Karki    | shilpa34@gmail.com | password: 123456
Harry Adhikari  | harry@gmail.com    | password: 123456
Admin           | admin@gmail.com    | password: 123456
```

These will **fail to log in** through this API, because `bcrypt.compare()`
expects a hash, not plain text. Options:
1. Register fresh test accounts through `POST /api/auth/register` instead (recommended — this guarantees a proper bcrypt hash).
2. Or manually re-hash and update those rows in phpMyAdmin.

The one row that already has a bcrypt hash (`Test Officer`, `testofficer@gmail.com`)
should log in fine if you know its original plaintext password.

## Real schema reference (for your own sanity-checking)

- **users**: `user_id` (PK), full_name, email, phone, password, role
  (`Citizen`/`Business`/`Officer`/`Admin`), address, citizenship_no,
  profile_image, status (`Active`/`Blocked`, newly added), created_at
- **businesses**: `business_id` (PK), user_id, business_name, owner_name,
  business_type, pan_number, address, status (`Pending`/`Approved`/`Rejected`), created_at
- **categories**: `category_id` (PK), category_name, description
- **products**: `product_id` (PK), business_id, category_id, product_name,
  description, price, stock, image, status (`Available`/`Out of Stock`), created_at
- **cart**: `cart_id` (PK), user_id, created_at
- **cart_items**: `cart_item_id` (PK), cart_id, product_id, quantity
- **orders**: `order_id` (PK), user_id, total_amount, order_status
  (`Pending`/`Processing`/`Shipped`/`Delivered`/`Cancelled`), payment_status
  (`Pending`/`Paid`), order_date
- **order_items**: `order_item_id` (PK), order_id, product_id, quantity, price
  (no business_id column — the API joins through `products` to find the business)
- **certificates**: `certificate_id` (PK), user_id, certificate_type
  (`Birth`/`Marriage`/`Death`/`Residence`/`Business`/`Character`), purpose,
  status (`Pending`/`Approved`/`Rejected`), applied_date, approved_date, remarks,
  document_path (newly added)
- **complaints**: `complaint_id` (PK), user_id, subject, description, location,
  status (`Pending`/`In Progress`/`Resolved`), created_at, image (newly added)
- **notices**: `notice_id` (PK), title, description, publish_date (date), created_by
- **tax_payments**: `payment_id` (PK), user_id, tax_type (`House Tax`/`Land Tax`/
  `Business Tax`/`Water Bill`), amount, payment_method (`Cash`/`eSewa`/`Khalti`/`Bank`),
  payment_status (`Pending`/`Paid`), payment_date
- **reviews** (new): `review_id` (PK), user_id, product_id, order_id, rating, comment, created_at
- **departments** (new): `department_id` (PK), name, description, created_at

## API overview

All protected routes need header: `Authorization: Bearer <token>`

| Module        | Base route              | Roles |
|---------------|--------------------------|-------|
| Auth          | `/api/auth`             | public |
| Users         | `/api/users`             | Admin (manage), all (self) |
| Businesses    | `/api/businesses`       | Admin, Officer, Business |
| Categories    | `/api/categories`       | public read, Admin write |
| Products      | `/api/products`         | public read, Business write |
| Cart          | `/api/cart`             | Citizen |
| Orders        | `/api/orders`           | Citizen, Business, Admin |
| Certificates  | `/api/certificates`     | Citizen, Officer, Admin |
| Complaints    | `/api/complaints`       | Citizen, Officer, Admin |
| Notices       | `/api/notices`          | public read, Officer/Admin write |
| Tax           | `/api/tax`              | Citizen, Officer, Admin |
| Admin         | `/api/admin/analytics`  | Admin |
| Reviews       | `/api/reviews`          | public read, Citizen write |
| Departments   | `/api/departments`      | public read, Admin write |
| Reports       | `/api/reports`          | Officer, Admin |

## Test flow

1. `POST /api/auth/register`
   ```json
   { "full_name": "Test Citizen", "email": "citizen2@test.com", "password": "test1234", "role": "Citizen" }
   ```
2. `POST /api/auth/login`
   ```json
   { "email": "citizen2@test.com", "password": "test1234" }
   ```
   Copy the `token` from the response.
3. `GET /api/users/me` with header `Authorization: Bearer <token>`

Then work through categories → products → cart → orders → certificates →
complaints → notices → tax → reviews → departments → reports, in that order.
