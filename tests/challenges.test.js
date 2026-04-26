const request = require('supertest');
const app = require('../server');
const { db, User } = require('../database/setup');
const bcrypt = require('bcryptjs');

let memberToken;
let leadToken;
let challengeId;

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

describe('Challenge CRUD', () => {
    test('POST /api/challenges - teamlead creates a challenge', async () => {
        const res = await request(app)
            .post('/api/challenges')
            .set('Authorization', `Bearer ${leadToken}`)
            .send({ name: 'Test Challenge', category: 'Web Application Exploitation', pointValue: 100, difficulty: 'Easy' });
        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe('Test Challenge');
        challengeId = res.body.id;
    });

    test('POST /api/challenges - member gets 403', async () => {
        const res = await request(app)
            .post('/api/challenges')
            .set('Authorization', `Bearer ${memberToken}`)
            .send({ name: 'Test Challenge', category: 'Forensics', pointValue: 100, difficulty: 'Easy' });
        expect(res.statusCode).toBe(403);
    });

    test('GET /api/challenges - member gets all challenges', async () => {
        const res = await request(app)
            .get('/api/challenges')
            .set('Authorization', `Bearer ${memberToken}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/challenges/:id - returns single challenge', async () => {
        const res = await request(app)
            .get(`/api/challenges/${challengeId}`)
            .set('Authorization', `Bearer ${memberToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(challengeId);
    });

    test('PUT /api/challenges/:id - teamlead updates a challenge', async () => {
        const res = await request(app)
            .put(`/api/challenges/${challengeId}`)
            .set('Authorization', `Bearer ${leadToken}`)
            .send({ pointValue: 200 });
        expect(res.statusCode).toBe(200);
        expect(res.body.pointValue).toBe(200);
    });

    test('DELETE /api/challenges/:id - teamlead deletes a challenge', async () => {
        const res = await request(app)
            .delete(`/api/challenges/${challengeId}`)
            .set('Authorization', `Bearer ${leadToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Challenge deleted successfully');
    });

    test('GET /api/challenges/:id - returns 404 for missing challenge', async () => {
        const res = await request(app)
            .get('/api/challenges/9999')
            .set('Authorization', `Bearer ${memberToken}`);
        expect(res.statusCode).toBe(404);
    });

    test('GET /api/challenges - no token returns 401', async () => {
        const res = await request(app).get('/api/challenges');
        expect(res.statusCode).toBe(401);
    });
});