const request = require('supertest');
const app = require('../server');
const { db, User, Challenge } = require('../database/setup');

beforeAll(async () => {
    await db.sync({ force: true });
    await User.create({ username: 'submitter', email: 'sub@test.com', password: 'password123', role: 'member' });
    await Challenge.create({ name: 'Sub Challenge', category: 'Forensics', pointValue: 50, difficulty: 'Easy' });
});

afterAll(async () => {
    await db.close();
});

describe('Submission CRUD', () => {
    let submissionId;

    test('POST /api/submissions - creates a submission', async () => {
        const res = await request(app).post('/api/submissions').send({
            flag: 'CTF{test_flag}',
            userId: 1,
            challengeId: 1
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.flag).toBe('CTF{test_flag}');
        submissionId = res.body.id;
    });

    test('GET /api/submissions - returns all submissions', async () => {
        const res = await request(app).get('/api/submissions');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/submissions/:id - returns single submission', async () => {
        const res = await request(app).get(`/api/submissions/${submissionId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(submissionId);
    });

    test('PUT /api/submissions/:id - updates a submission', async () => {
        const res = await request(app).put(`/api/submissions/${submissionId}`).send({
            flag: 'CTF{updated_flag}'
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.flag).toBe('CTF{updated_flag}');
    });

    test('DELETE /api/submissions/:id - deletes a submission', async () => {
        const res = await request(app).delete(`/api/submissions/${submissionId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Submission deleted successfully');
    });

    test('GET /api/submissions/:id - returns 404 for missing submission', async () => {
        const res = await request(app).get('/api/submissions/9999');
        expect(res.statusCode).toBe(404);
    });
});