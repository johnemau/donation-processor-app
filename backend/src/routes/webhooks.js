const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const store = require('../store');

const VALID_EVENTS = ['success', 'failure'];

// POST /webhooks — register a webhook
router.post('/', (req, res) => {
  const { url, events } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'url must be a valid URL' });
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return res.status(400).json({ error: 'url must use http or https' });
  }

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: `events must be a non-empty array containing: ${VALID_EVENTS.join(', ')}` });
  }
  const invalidEvents = events.filter((e) => !VALID_EVENTS.includes(e));
  if (invalidEvents.length > 0) {
    return res.status(400).json({ error: `Invalid events: ${invalidEvents.join(', ')}. Must be one of: ${VALID_EVENTS.join(', ')}` });
  }

  const webhook = store.addWebhook({
    id: crypto.randomUUID(),
    url,
    events: [...new Set(events)],
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json(webhook);
});

// GET /webhooks — list all registered webhooks
router.get('/', (req, res) => {
  return res.json({ webhooks: store.getAllWebhooks() });
});

// DELETE /webhooks/:id — remove a webhook
router.delete('/:id', (req, res) => {
  const removed = store.removeWebhook(req.params.id);
  if (!removed) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  return res.status(204).send();
});

module.exports = router;
