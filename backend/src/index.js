const express = require('express');
const cors = require('cors');
const donationRoutes = require('./routes/donations');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/donations', donationRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Donation processor API running on port ${PORT}`);
});
