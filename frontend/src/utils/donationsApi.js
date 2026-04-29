import { API_BASE } from './constants';

export async function getDonations() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error(`Failed to fetch donations: ${res.status}`);
  const data = await res.json();
  return data.donations;
}

export async function patchDonationStatus(uuid, newStatus) {
  const res = await fetch(`${API_BASE}/${uuid}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}
