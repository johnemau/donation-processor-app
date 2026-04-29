export function computeSummary(donations) {
  const byMethod = {};
  let successCount = 0;
  let failureCount = 0;
  let terminalCount = 0;
  for (const d of donations) {
    if (!byMethod[d.paymentMethod]) {
      byMethod[d.paymentMethod] = { count: 0, total: 0 };
    }
    byMethod[d.paymentMethod].count += 1;
    byMethod[d.paymentMethod].total += d.amount;
    if (d.status === 'success') { successCount += 1; terminalCount += 1; }
    else if (d.status === 'failure') { failureCount += 1; terminalCount += 1; }
  }
  return { byMethod, successCount, failureCount, terminalCount, total: donations.length };
}
