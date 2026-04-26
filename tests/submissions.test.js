const request = require('supertest');
const app = require('../server');
const { db, User, Challenge } = require('../database/setup');
const bcrypt = require('bcryptjs');

let memberToken;
let leadToken;
let submissionId;

beforeAll(async () => {
    await db.sync({ force: true });

    const passwordHash = await bcrypt.hash('password123', 10);
    await User.create({ username: 'leaduser', email: 'lead@test.com', passwordHash, role: 'teamlead' });
    await User.create({ username: 'memberuser', email: 'member@test.com', passwordHash, role: 'member' });
    await Challenge.create({ name: 'Test Challenge', category: 'Forensics', pointValue: 100, difficulty: 'Easy' });

    const leadRes = await request(app).post('/api/login').send({ email: 'lead@test.com', password: 'password123' });
    leadToken = leadRes.body.token;

    const memberRes = await request(app).post('/api/login').send({ email: 'member@test.com', password: 'password123' });
    memberToken = memberRes.body.token;
});

afterAll(async () => {
    await db.close();
});

describe('Submission CRUD', () => {
    test('POST /api/submissions - member creates a submission', async () => {
        const res = await request(app)
            .post('/api/submissions')
            .set('Authorization', `Bearer ${memberToken}`)
            .send({ flag: 'CTF{test_flag}', challengeId: 1 });
        expect(res.statusCode).toBe(201);
        expect(res.body.flag).toBe('CTF{test_flag}');
        submissionId = res.body.id;
    });

    test('GET /api/submissions - member gets all submissions', async () => {
        const res = await request(app)
            .get('/api/submissions')
            .set('Authorization', `Bearer ${memberToken}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/submissions/:id - returns single submission', async () => {
        const res = await request(app)
            .get(`/api/submissions/${submissionId}`)
            .set('Authorization', `Bearer ${memberToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(submissionId);
    });

    test('PUT /api/submissions/:id - member updates own submission', async () => {
        const res = await request(app)
            .put(`/api/submissions/${submissionId}`)
            .set('Authorization', `Bearer ${memberToken}`)
            .send({ flag: 'CTF{updated_flag}' });
        expect(res.statusCode).toBe(200);
        expect(res.body.flag).toBe('CTF{updated_flag}');
    });

    test('DELETE /api/submissions/:id - teamlead deletes a submission', async () => {
        const res = await request(app)
            .delete(`/api/submissions/${submissionId}`)
            .set('Authorization', `Bearer ${leadToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Submission deleted successfully');
    });

    test('GET /api/submissions/:id - returns 404 for missing submission', async () => {
        const res = await request(app)
            .get('/api/submissions/9999')
            .set('Authorization', `Bearer ${memberToken}`);
        expect(res.statusCode).toBe(404);
    });

    test('GET /api/submissions - no token returns 401', async () => {
        const res = await request(app).get('/api/submissions');
        expect(res.statusCode).toBe(401);
    });
});