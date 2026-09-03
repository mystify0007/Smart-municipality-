const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/businesses', require('./routes/businesses.routes'));
app.use('/api/categories', require('./routes/categories.routes'));
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/orders', require('./routes/orders.routes'));
app.use('/api/certificates', require('./routes/certificates.routes'));
app.use('/api/complaints', require('./routes/complaints.routes'));
app.use('/api/notices', require('./routes/notices.routes'));
app.use('/api/tax', require('./routes/tax.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/reviews', require('./routes/reviews.routes'));
app.use('/api/departments', require('./routes/departments.routes'));
app.use('/api/reports', require('./routes/reports.routes'));

app.get('/', (req, res) => res.json({ message: 'Smart Municipality Portal API running' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
