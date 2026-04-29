const store = require('./store');

/**
 * Fire-and-forget: POST the event payload to all webhooks registered for
 * the given event ('success' | 'failure').
 */
async function dispatch(event, donation) {
  const hooks = store.getWebhooksForEvent(event);
  if (hooks.length === 0) return;

  const payload = JSON.stringify({ event, donation });

  await Promise.allSettled(
    hooks.map((hook) =>
      fetch(hook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        signal: AbortSignal.timeout(10000),
      }).catch(() => {
        // Suppress individual delivery failures — webhook consumers are
        // unreliable by nature; the app must not crash on their behalf.
      })
    )
  );
}

module.exports = { dispatch };
