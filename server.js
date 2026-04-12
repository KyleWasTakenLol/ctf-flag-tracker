require('dotenv').config();
const express = require('express');
const { db, User, Challenge, Submission } = require('./database/setup');
const logger = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(logger);

// Test database connection on startup
async function testConnection() {
    try {
        await db.authenticate();
        console.log('Connection to database established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

testConnection();

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the CTF Flag Tracker API',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            challenges: '/api/challenges',
            submissions: '/api/submissions'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'CTF Flag Tracker API is running',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// ─── USER ROUTES ─────────────────────────────────────────────────────────────

// GET /api/users - Get all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role', 'createdAt']
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET /api/users/:id - Get single user
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'username', 'email', 'role', 'createdAt']
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// POST /api/users - Create a new user
app.post('/api/users', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'username, email, and password are required' });
        }

        const newUser = await User.create({ username, email, password, role });

        res.status(201).json({
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT /api/users/:id - Update a user
app.put('/api/users/:id', async (req, res) => {
    try {
        const { username, email, role } = req.body;

        const [updatedRowsCount] = await User.update(
            { username, email, role },
            { where: { id: req.params.id } }
        );

        if (updatedRowsCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updatedUser = await User.findByPk(req.params.id, {
            attributes: ['id', 'username', 'email', 'role']
        });
        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /api/users/:id - Delete a user
app.delete('/api/users/:id', async (req, res) => {
    try {
        const deletedRowsCount = await User.destroy({
            where: { id: req.params.id }
        });

        if (deletedRowsCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ─── CHALLENGE ROUTES ─────────────────────────────────────────────────────────

// GET /api/challenges - Get all challenges
app.get('/api/challenges', async (req, res) => {
    try {
        const challenges = await Challenge.findAll();
        res.json(challenges);
    } catch (error) {
        console.error('Error fetching challenges:', error);
        res.status(500).json({ error: 'Failed to fetch challenges' });
    }
});

// GET /api/challenges/:id - Get single challenge
app.get('/api/challenges/:id', async (req, res) => {
    try {
        const challenge = await Challenge.findByPk(req.params.id);
        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }
        res.json(challenge);
    } catch (error) {
        console.error('Error fetching challenge:', error);
        res.status(500).json({ error: 'Failed to fetch challenge' });
    }
});

// POST /api/challenges - Create a new challenge
app.post('/api/challenges', async (req, res) => {
    try {
        const { name, category, pointValue, difficulty } = req.body;

        if (!name || !category || !pointValue || !difficulty) {
            return res.status(400).json({ error: 'name, category, pointValue, and difficulty are required' });
        }

        const newChallenge = await Challenge.create({ name, category, pointValue, difficulty });
        res.status(201).json(newChallenge);
    } catch (error) {
        console.error('Error creating challenge:', error);
        res.status(500).json({ error: 'Failed to create challenge' });
    }
});

// PUT /api/challenges/:id - Update a challenge
app.put('/api/challenges/:id', async (req, res) => {
    try {
        const { name, category, pointValue, difficulty } = req.body;

        const [updatedRowsCount] = await Challenge.update(
            { name, category, pointValue, difficulty },
            { where: { id: req.params.id } }
        );

        if (updatedRowsCount === 0) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        const updatedChallenge = await Challenge.findByPk(req.params.id);
        res.json(updatedChallenge);
    } catch (error) {
        console.error('Error updating challenge:', error);
        res.status(500).json({ error: 'Failed to update challenge' });
    }
});

// DELETE /api/challenges/:id - Delete a challenge
app.delete('/api/challenges/:id', async (req, res) => {
    try {
        const deletedRowsCount = await Challenge.destroy({
            where: { id: req.params.id }
        });

        if (deletedRowsCount === 0) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        res.json({ message: 'Challenge deleted successfully' });
    } catch (error) {
        console.error('Error deleting challenge:', error);
        res.status(500).json({ error: 'Failed to delete challenge' });
    }
});

// ─── SUBMISSION ROUTES ────────────────────────────────────────────────────────

// GET /api/submissions - Get all submissions
app.get('/api/submissions', async (req, res) => {
    try {
        const submissions = await Submission.findAll({
            include: [
                { model: User, attributes: ['id', 'username'] },
                { model: Challenge, attributes: ['id', 'name', 'category', 'pointValue'] }
            ]
        });
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// GET /api/submissions/:id - Get single submission
app.get('/api/submissions/:id', async (req, res) => {
    try {
        const submission = await Submission.findByPk(req.params.id, {
            include: [
                { model: User, attributes: ['id', 'username'] },
                { model: Challenge, attributes: ['id', 'name', 'category', 'pointValue'] }
            ]
        });
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }
        res.json(submission);
    } catch (error) {
        console.error('Error fetching submission:', error);
        res.status(500).json({ error: 'Failed to fetch submission' });
    }
});

// POST /api/submissions - Log a new flag submission
app.post('/api/submissions', async (req, res) => {
    try {
        const { flag, userId, challengeId } = req.body;

        if (!flag || !userId || !challengeId) {
            return res.status(400).json({ error: 'flag, userId, and challengeId are required' });
        }

        // Verify user and challenge exist
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const challenge = await Challenge.findByPk(challengeId);
        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        const newSubmission = await Submission.create({ flag, userId, challengeId });
        res.status(201).json(newSubmission);
    } catch (error) {
        console.error('Error creating submission:', error);
        res.status(500).json({ error: 'Failed to create submission' });
    }
});

// PUT /api/submissions/:id - Update a submission
app.put('/api/submissions/:id', async (req, res) => {
    try {
        const { flag } = req.body;

        const [updatedRowsCount] = await Submission.update(
            { flag },
            { where: { id: req.params.id } }
        );

        if (updatedRowsCount === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        const updatedSubmission = await Submission.findByPk(req.params.id);
        res.json(updatedSubmission);
    } catch (error) {
        console.error('Error updating submission:', error);
        res.status(500).json({ error: 'Failed to update submission' });
    }
});

// DELETE /api/submissions/:id - Delete a submission
app.delete('/api/submissions/:id', async (req, res) => {
    try {
        const deletedRowsCount = await Submission.destroy({
            where: { id: req.params.id }
        });

        if (deletedRowsCount === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json({ message: 'Submission deleted successfully' });
    } catch (error) {
        console.error('Error deleting submission:', error);
        res.status(500).json({ error: 'Failed to delete submission' });
    }
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'An unexpected error occurred' });
});

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});

module.exports = app;