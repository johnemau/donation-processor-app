const request = require('supertest');
const app = require('../app');
const store = require('../store');

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const validDonation = {
  uuid: VALID_UUID,
  amount: 5000,
  currency: 'USD',
  paymentMethod: 'cc',
  nonprofitId: 'org1',
  donorId: 'donor1',
  status: 'new',
  createdAt: '2026-01-15T10:00:00Z',
};

beforeEach(() => {
  store.reset();
});

// ---------------------------------------------------------------------------
// POST /donations
// ---------------------------------------------------------------------------
describe('POST /donations', () => {
  test('201 – creates a donation and returns it', async () => {
    const res = await request(app).post('/donations').send(validDonation);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      uuid: validDonation.uuid,
      amount: validDonation.amount,
      currency: 'USD',
      paymentMethod: validDonation.paymentMethod,
      nonprofitId: validDonation.nonprofitId,
      donorId: validDonation.donorId,
      status: validDonation.status,
      createdAt: validDonation.createdAt,
    });
  });

  test('409 – duplicate UUID returns conflict', async () => {
    await request(app).post('/donations').send(validDonation);
    const res = await request(app).post('/donations').send(validDonation);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  describe('400 – invalid payload', () => {
    test.each([
      ['uuid', { ...validDonation, uuid: undefined }],
      ['amount', { ...validDonation, amount: undefined }],
      ['currency', { ...validDonation, currency: undefined }],
      ['paymentMethod', { ...validDonation, paymentMethod: undefined }],
      ['nonprofitId', { ...validDonation, nonprofitId: undefined }],
      ['donorId', { ...validDonation, donorId: undefined }],
      ['status', { ...validDonation, status: undefined }],
      ['createdAt', { ...validDonation, createdAt: undefined }],
    ])('missing required field: %s', async (_field, body) => {
      const res = await request(app).post('/donations').send(body);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('invalid UUID format', async () => {
      const res = await request(app)
        .post('/donations')
        .send({ ...validDonation, uuid: 'not-a-uuid' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('currency other than USD', async () => {
      const res = await request(app)
        .post('/donations')
        .send({ ...validDonation, currency: 'EUR' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('amount is zero', async () => {
      const res = await request(app)
        .post('/donations')
        .send({ ...validDonation, amount: 0 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('amount is negative', async () => {
      const res = await request(app)
        .post('/donations')
        .send({ ...validDonation, amount: -100 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('amount is a float', async () => {
      const res = await request(app)
        .post('/donations')
        .send({ ...validDonation, amount: 50.5 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('invalid paymentMethod', async () => {
      const res = await request(app)
        .post('/donations')
        .send({ ...validDonation, paymentMethod: 'paypal' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('invalid status value', async () => {
      const res = await request(app)
        .post('/donations')
        .send({ ...validDonation, status: 'refunded' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('createdAt is not an ISO datetime with timezone', async () => {
      const res = await request(app)
        .post('/donations')
        .send({ ...validDonation, createdAt: '2026-01-15' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
});

// ---------------------------------------------------------------------------
// GET /donations
// ---------------------------------------------------------------------------
describe('GET /donations', () => {
  test('returns empty page when store is empty', async () => {
    const res = await request(app).get('/donations');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ donations: [], total: 0, limit: 20, offset: 0 });
  });

  test('returns all created donations', async () => {
    const second = {
      ...validDonation,
      uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    };

    await request(app).post('/donations').send(validDonation);
    await request(app).post('/donations').send(second);

    const res = await request(app).get('/donations');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.donations).toHaveLength(2);
    expect(res.body.donations.map((d) => d.uuid)).toEqual(
      expect.arrayContaining([validDonation.uuid, second.uuid])
    );
  });

  test('paginates with limit and offset', async () => {
    const second = { ...validDonation, uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' };
    await request(app).post('/donations').send(validDonation);
    await request(app).post('/donations').send(second);

    const res = await request(app).get('/donations?limit=1&offset=1');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.limit).toBe(1);
    expect(res.body.offset).toBe(1);
    expect(res.body.donations).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// GET /donations/:uuid
// ---------------------------------------------------------------------------
describe('GET /donations/:uuid', () => {
  test('200 – returns the donation for a known UUID', async () => {
    await request(app).post('/donations').send(validDonation);

    const res = await request(app).get(`/donations/${VALID_UUID}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ uuid: VALID_UUID });
  });

  test('404 – unknown UUID returns not found', async () => {
    const res = await request(app).get(
      '/donations/00000000-0000-0000-0000-000000000000'
    );

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// PATCH /donations/:uuid/status
// ---------------------------------------------------------------------------
describe('PATCH /donations/:uuid/status', () => {
  test('200 – valid transition new → pending', async () => {
    await request(app)
      .post('/donations')
      .send({ ...validDonation, status: 'new' });

    const res = await request(app)
      .patch(`/donations/${VALID_UUID}/status`)
      .send({ status: 'pending' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ uuid: VALID_UUID, status: 'pending' });
  });

  test('200 – valid transition pending → success', async () => {
    await request(app)
      .post('/donations')
      .send({ ...validDonation, status: 'pending' });

    const res = await request(app)
      .patch(`/donations/${VALID_UUID}/status`)
      .send({ status: 'success' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ uuid: VALID_UUID, status: 'success' });
  });

  test('200 – valid transition pending → failure', async () => {
    await request(app)
      .post('/donations')
      .send({ ...validDonation, status: 'pending' });

    const res = await request(app)
      .patch(`/donations/${VALID_UUID}/status`)
      .send({ status: 'failure' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ uuid: VALID_UUID, status: 'failure' });
  });

  test('409 – updating to the same status returns conflict', async () => {
    await request(app)
      .post('/donations')
      .send({ ...validDonation, status: 'new' });

    const res = await request(app)
      .patch(`/donations/${VALID_UUID}/status`)
      .send({ status: 'new' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  describe('422 – invalid status transitions', () => {
    test.each([
      ['new', 'failure'],
      ['new', 'success'],
      ['success', 'pending'],
      ['success', 'failure'],
      ['failure', 'pending'],
      ['failure', 'success'],
      ['failure', 'new'],
    ])('%s → %s is rejected', async (fromStatus, toStatus) => {
      await request(app)
        .post('/donations')
        .send({ ...validDonation, status: fromStatus });

      const res = await request(app)
        .patch(`/donations/${VALID_UUID}/status`)
        .send({ status: toStatus });

      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('error');
    });
  });

  test('404 – unknown UUID returns not found', async () => {
    const res = await request(app)
      .patch('/donations/00000000-0000-0000-0000-000000000000/status')
      .send({ status: 'pending' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('400 – missing status field in request body', async () => {
    await request(app).post('/donations').send(validDonation);

    const res = await request(app)
      .patch(`/donations/${VALID_UUID}/status`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('400 – invalid status value in request body', async () => {
    await request(app).post('/donations').send(validDonation);

    const res = await request(app)
      .patch(`/donations/${VALID_UUID}/status`)
      .send({ status: 'refunded' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
