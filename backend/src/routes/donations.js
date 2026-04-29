const express = require('express');
const router = express.Router();
const store = require('../store');

const VALID_PAYMENT_METHODS = ['cc', 'ach', 'crypto', 'venmo'];
const VALID_STATUSES = ['new', 'pending', 'success', 'failure'];
const STATUS_TRANSITIONS = {
  new: ['pending'],
  pending: ['success', 'failure'],
  success: [],
  failure: [],
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /donations
router.post('/', (req, res) => {
  const { uuid, amount, currency, paymentMethod, nonprofitId, donorId, status, createdAt } = req.body;

  if (!uuid || amount === undefined || !currency || !paymentMethod || !nonprofitId || !donorId || !status || !createdAt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!UUID_REGEX.test(uuid)) {
    return res.status(400).json({ error: 'Invalid UUID format' });
  }
  if (currency !== 'USD') {
    return res.status(400).json({ error: 'Currency must be USD' });
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive integer (in cents)' });
  }
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ error: `paymentMethod must be one of: ${VALID_PAYMENT_METHODS.join(', ')}` });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  if (isNaN(Date.parse(createdAt))) {
    return res.status(400).json({ error: 'createdAt must be a valid ISO datetime string' });
  }

  if (store.findByUuid(uuid)) {
    return res.status(409).json({ error: 'Donation with this UUID already exists' });
  }

  const donation = {
    uuid,
    amount,
    currency,
    paymentMethod,
    nonprofitId,
    donorId,
    status,
    createdAt,
    updatedAt: new Date().toISOString(),
  };

  store.add(donation);
  return res.status(201).json(donation);
});

// GET /donations
router.get('/', (req, res) => {
  return res.json({ donations: store.getAll() });
});

// GET /donations/:uuid
router.get('/:uuid', (req, res) => {
  const donation = store.findByUuid(req.params.uuid);
  if (!donation) {
    return res.status(404).json({ error: 'Donation not found' });
  }
  return res.json(donation);
});

// PATCH /donations/:uuid/status
router.patch('/:uuid/status', (req, res) => {
  const { status } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const donation = store.findByUuid(req.params.uuid);
  if (!donation) {
    return res.status(404).json({ error: 'Donation not found' });
  }

  if (donation.status === status) {
    return res.status(409).json({ error: `Donation already has status "${status}"` });
  }

  const allowedTransitions = STATUS_TRANSITIONS[donation.status] || [];
  if (!allowedTransitions.includes(status)) {
    return res.status(422).json({
      error: `Invalid status transition: "${donation.status}" → "${status}". Allowed transitions from "${donation.status}": ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none (terminal state)'}`,
    });
  }

  const updated = store.updateStatus(req.params.uuid, status);
  return res.json(updated);
});

module.exports = router;
