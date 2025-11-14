import request from 'supertest';
import app from '../server.js';

describe('server boot', () => {
  it('exposes health-ish route', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
  });
});