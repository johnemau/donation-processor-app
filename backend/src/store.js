const donations = [
  {
    uuid: "354362d8-2080-4ca1-9ede-892e4c6d3a25",
    amount: 5000,
    currency: "USD",
    paymentMethod: "cc",
    nonprofitId: "org1",
    donorId: "donor_01",
    status: "new",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z"
  },
  {
    uuid: "385cf5cb-9d0a-4f9e-948b-412791755060",
    amount: 10000,
    currency: "USD",
    paymentMethod: "ach",
    nonprofitId: "org2",
    donorId: "donor_02",
    status: "new",
    createdAt: "2026-01-15T10:05:00Z",
    updatedAt: "2026-01-15T10:05:00Z"
  },
  {
    uuid: "86f1c108-102b-447a-9efe-67c2f3b594d8",
    amount: 25000,
    currency: "USD",
    paymentMethod: "crypto",
    nonprofitId: "org1",
    donorId: "donor_03",
    status: "pending",
    createdAt: "2026-01-15T10:10:00Z",
    updatedAt: "2026-01-15T10:12:34Z"
  },
  {
    uuid: "c9b7c4c1-2ca7-465c-bf34-2a80ee7534eb",
    amount: 1500,
    currency: "USD",
    paymentMethod: "venmo",
    nonprofitId: "org3",
    donorId: "donor_04",
    status: "pending",
    createdAt: "2026-01-15T10:15:00Z",
    updatedAt: "2026-01-15T10:17:08Z"
  },
  {
    uuid: "73aff4cc-135d-4840-96b2-9210639528c8",
    amount: 7500,
    currency: "USD",
    paymentMethod: "cc",
    nonprofitId: "org2",
    donorId: "donor_05",
    status: "success",
    createdAt: "2026-01-15T10:20:00Z",
    updatedAt: "2026-01-15T10:21:47Z"
  },
  {
    uuid: "7b789658-cb91-4ae6-bbb6-5cb90a1b1942",
    amount: 3000,
    currency: "USD",
    paymentMethod: "ach",
    nonprofitId: "org3",
    donorId: "donor_06",
    status: "failure",
    createdAt: "2026-01-15T10:25:00Z",
    updatedAt: "2026-01-15T10:43:22Z"
  },
  {
    uuid: "4619db6e-5ddf-4900-9da2-17e55e400ca4",
    amount: 15000,
    currency: "USD",
    paymentMethod: "crypto",
    nonprofitId: "org1",
    donorId: "donor_07",
    status: "new",
    createdAt: "2026-01-15T10:30:00Z",
    updatedAt: "2026-01-15T10:30:00Z"
  },
  {
    uuid: "49ce76af-3134-40e3-99d6-b6e3d7e51de5",
    amount: 20000,
    currency: "USD",
    paymentMethod: "venmo",
    nonprofitId: "org2",
    donorId: "donor_08",
    status: "pending",
    createdAt: "2026-01-15T10:35:00Z",
    updatedAt: "2026-01-15T10:38:51Z"
  }
];

module.exports = {
  getAll: () => [...donations],
  findByUuid: (uuid) => donations.find(d => d.uuid === uuid) || null,
  add: (donation) => { donations.push(donation); },
  updateStatus: (uuid, status) => {
    const donation = donations.find(d => d.uuid === uuid);
    if (donation) {
      donation.status = status;
      donation.updatedAt = new Date().toISOString();
    }
    return donation ? { ...donation } : null;
  },
};
