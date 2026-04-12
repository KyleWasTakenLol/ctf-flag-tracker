const request = require('supertest');
const app = require('../server');
const { db } = require('../database/setup');

beforeAll(async () => {
    await db.sync({ force: true });
});

afterAll(async () => {
    await db.close();
});

describe('Challenge CRUD', () => {
    let challengeId;
    test('POST /api/challenges - creates a challenge', async () => {
        const res = await request(app).post('/api/challenges').send({
            name: 'Test Challenge',
            category: 'Web Application Exploitation',
            pointValue: 100,
            difficulty: 'Easy'
    });
        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe('Test Challenge');
        challengeId = res.body.id;
    });

    test('GET /api/challenges - returns all challenges', async () => {
        const res = await request(app).get('/api/challenges');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/challenges/:id - returns single challenge', async () => {
        const res = await request(app).get(`/api/challenges/${challengeId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(challengeId);
    });

    test('PUT /api/challenges/:id - updates a challenge', async () => {
        const res = await request(app).put(`/api/challenges/${challengeId}`).send({
            pointValue: 200
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.pointValue).toBe(200);
    });

    test('DELETE /api/challenges/:id - deletes a challenge', async () => {
        const res = await request(app).delete(`/api/challenges/${challengeId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Challenge deleted successfully');
    });

    test('GET /api/challenges/:id - returns 404 for missing challenge', async () => {
        const res = await request(app).get('/api/challenges/9999');
        expect(res.statusCode).toBe(404);
    });
});