const express = require('express');
const cors = require('cors');
const donationRoutes = require('./routes/donations');

const app = express();
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());
app.use('/donations', donationRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Donation processor API running on port ${PORT}`);
});
