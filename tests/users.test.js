const request = require('supertest');
const app = require('../server');
const { db } = require('../database/setup');
const bcrypt = require('bcryptjs');
const { User } = require('../database/setup');

let memberToken;
let leadToken;
let userId;

beforeAll(async () => {
    await db.sync({ force: true });

    const passwordHash = await bcrypt.hash('password123', 10);

    await User.create({ username: 'leaduser', email: 'lead@test.com', passwordHash, role: 'teamlead' });
    await User.create({ username: 'memberuser', email: 'member@test.com', passwordHash, role: 'member' });

    const leadRes = await request(app).post('/api/login').send({ email: 'lead@test.com', password: 'password123' });
    leadToken = leadRes.body.token;

    const memberRes = await request(app).post('/api/login').send({ email: 'member@test.com', password: 'password123' });
    memberToken = memberRes.body.token;
});

afterAll(async () => {
    await db.close();
});

describe('User CRUD', () => {
    test('POST /api/users - teamlead creates a user', async () => {
        const res = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${leadToken}`)
            .send({ username: 'newuser', email: 'new@test.com', password: 'password123', role: 'member' });
        expect(res.statusCode).toBe(201);
        expect(res.body.username).toBe('newuser');
        userId = res.body.id;
    });

    test('POST /api/users - member gets 403', async () => {
        const res = await request(app)
            .post('/api/users')
            .set('Authorization', `Bearer ${memberToken}`)
            .send({ username: 'anotheruser', email: 'another@test.com', password: 'password123', role: 'member' });
        expect(res.statusCode).toBe(403);
    });

    test('GET /api/users - teamlead gets all users', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${leadToken}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/users - member gets 403', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${memberToken}`);
        expect(res.statusCode).toBe(403);
    });

    test('GET /api/users/:id - teamlead gets single user', async () => {
        const res = await request(app)
            .get(`/api/users/${userId}`)
            .set('Authorization', `Bearer ${leadToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(userId);
    });

    test('PUT /api/users/:id - teamlead updates a user', async () => {
        const res = await request(app)
            .put(`/api/users/${userId}`)
            .set('Authorization', `Bearer ${leadToken}`)
            .send({ username: 'updateduser' });
        expect(res.statusCode).toBe(200);
        expect(res.body.username).toBe('updateduser');
    });

    test('DELETE /api/users/:id - teamlead deletes a user', async () => {
        const res = await request(app)
            .delete(`/api/users/${userId}`)
            .set('Authorization', `Bearer ${leadToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('User deleted successfully');
    });

    test('GET /api/users/:id - returns 404 for missing user', async () => {
        const res = await request(app)
            .get('/api/users/9999')
            .set('Authorization', `Bearer ${leadToken}`);
        expect(res.statusCode).toBe(404);
    });

    test('GET /api/users - no token returns 401', async () => {
        const res = await request(app).get('/api/users');
        expect(res.statusCode).toBe(401);
    });
});