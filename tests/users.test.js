const request = require('supertest');
const app = require('../server');
const { db } = require('../database/setup');

beforeAll(async () => {
    await db.sync({ force: true });
});

afterAll(async () => {
    await db.close();
});

describe('User CRUD', () => {
    let userId;

    test('POST /api/users - creates a user', async () => {
        const res = await request(app).post('/api/users').send({
            username: 'testuser',
            email: 'test@test.com',
            password: 'password123',
            role: 'member'
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.username).toBe('testuser');
        userId = res.body.id;
    });

    test('GET /api/users - returns all users', async () => {
        const res = await request(app).get('/api/users');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/users/:id - returns single user', async () => {
        const res = await request(app).get(`/api/users/${userId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(userId);
    });

    test('PUT /api/users/:id - updates a user', async () => {
        const res = await request(app).put(`/api/users/${userId}`).send({
            username: 'updateduser'
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.username).toBe('updateduser');
    });

    test('DELETE /api/users/:id - deletes a user', async () => {
        const res = await request(app).delete(`/api/users/${userId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('User deleted successfully');
    });

    test('GET /api/users/:id - returns 404 for missing user', async () => {
        const res = await request(app).get('/api/users/9999');
        expect(res.statusCode).toBe(404);
    });
});