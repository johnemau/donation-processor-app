const express = require('express');
const cors = require('cors');
const donationRoutes = require('./routes/donations');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());
app.use('/donations', donationRoutes);
app.use('/webhooks', webhookRoutes);

module.exports = app;
