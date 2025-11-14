import request from 'supertest';
import app from '../server.js';
import mongoose from 'mongoose';
import User from '../models/User.js';

describe('auth flow', () => {
  const email = 'test@example.com';
  const password = 'Passw0rd!';

  beforeAll(async () => {
    // use a separate DB or collection in CI if needed
    await User.deleteMany({ email });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('register → login → access protected', async () => {
    const reg = await request(app).post('/api/auth/register').send({ email, password });
    expect(reg.status).toBe(201);

    const login = await request(app).post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    const cookie = login.headers['set-cookie'][0];

    const prof = await request(app)
      .get('/api/protected/profile')
      .set('Cookie', cookie);
    expect(prof.status).toBe(200);
    expect(prof.body.email).toBe(email);
  });
});