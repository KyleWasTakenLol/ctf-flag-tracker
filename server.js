require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { db, User, Challenge, Submission } = require('./database/setup');
const logger = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
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

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────

// Verifies JWT token from Authorization header
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// Allows only teamlead role
function requireTeamLead(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role === 'teamlead') {
        next();
    } else {
        return res.status(403).json({ error: 'Access denied. Team lead role required.' });
    }
}

// ─── ERROR HELPER ─────────────────────────────────────────────────────────────

// Maps Sequelize errors to appropriate HTTP status codes
function handleSequelizeError(res, error, context) {
    console.error(`Error ${context}:`, error);
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'A record with that value already exists' });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(404).json({ error: 'Referenced record does not exist' });
    }
    return res.status(500).json({ error: `Failed to ${context}` });
}

// ─── UTILITY ROUTES ───────────────────────────────────────────────────────────

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the CTF Flag Tracker API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/register, /api/login, /api/logout',
            users: '/api/users',
            challenges: '/api/challenges',
            submissions: '/api/submissions'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'CTF Flag Tracker API is running',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

// POST /api/register - Register a new user
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'username, email, and password are required' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await User.create({ username, email, passwordHash, role });

        const token = jwt.sign(
            { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role }
        });
    } catch (error) {
        handleSequelizeError(res, error, 'register user');
    }
});

// POST /api/login - Login and receive JWT token
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });
    } catch (error) {
        handleSequelizeError(res, error, 'login');
    }
});

// POST /api/logout - JWT is stateless so just return success
app.post('/api/logout', requireAuth, (req, res) => {
    res.json({ message: 'Logout successful' });
});

// ─── USER ROUTES ──────────────────────────────────────────────────────────────

// GET /api/users - Team lead only
app.get('/api/users', requireAuth, requireTeamLead, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role', 'createdAt']
        });
        res.json(users);
    } catch (error) {
        handleSequelizeError(res, error, 'fetch users');
    }
});

// GET /api/users/:id - Team lead only
app.get('/api/users/:id', requireAuth, requireTeamLead, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'username', 'email', 'role', 'createdAt']
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        handleSequelizeError(res, error, 'fetch user');
    }
});

// POST /api/users - Team lead only
app.post('/api/users', requireAuth, requireTeamLead, async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'username, email, and password are required' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await User.create({ username, email, passwordHash, role });

        res.status(201).json({
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role
        });
    } catch (error) {
        handleSequelizeError(res, error, 'create user');
    }
});

// PUT /api/users/:id - Team lead only
app.put('/api/users/:id', requireAuth, requireTeamLead, async (req, res) => {
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
        handleSequelizeError(res, error, 'update user');
    }
});

// DELETE /api/users/:id - Team lead only
app.delete('/api/users/:id', requireAuth, requireTeamLead, async (req, res) => {
    try {
        const deletedRowsCount = await User.destroy({ where: { id: req.params.id } });

        if (deletedRowsCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        handleSequelizeError(res, error, 'delete user');
    }
});

// ─── CHALLENGE ROUTES ─────────────────────────────────────────────────────────

// GET /api/challenges - Any authenticated user
app.get('/api/challenges', requireAuth, async (req, res) => {
    try {
        const challenges = await Challenge.findAll();
        res.json(challenges);
    } catch (error) {
        handleSequelizeError(res, error, 'fetch challenges');
    }
});

// GET /api/challenges/:id - Any authenticated user
app.get('/api/challenges/:id', requireAuth, async (req, res) => {
    try {
        const challenge = await Challenge.findByPk(req.params.id);
        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }
        res.json(challenge);
    } catch (error) {
        handleSequelizeError(res, error, 'fetch challenge');
    }
});

// POST /api/challenges - Team lead only
app.post('/api/challenges', requireAuth, requireTeamLead, async (req, res) => {
    try {
        const { name, category, pointValue, difficulty } = req.body;

        if (!name || !category || !pointValue || !difficulty) {
            return res.status(400).json({ error: 'name, category, pointValue, and difficulty are required' });
        }

        const newChallenge = await Challenge.create({ name, category, pointValue, difficulty });
        res.status(201).json(newChallenge);
    } catch (error) {
        handleSequelizeError(res, error, 'create challenge');
    }
});

// PUT /api/challenges/:id - Team lead only
app.put('/api/challenges/:id', requireAuth, requireTeamLead, async (req, res) => {
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
        handleSequelizeError(res, error, 'update challenge');
    }
});

// DELETE /api/challenges/:id - Team lead only
app.delete('/api/challenges/:id', requireAuth, requireTeamLead, async (req, res) => {
    try {
        const deletedRowsCount = await Challenge.destroy({ where: { id: req.params.id } });

        if (deletedRowsCount === 0) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        res.json({ message: 'Challenge deleted successfully' });
    } catch (error) {
        handleSequelizeError(res, error, 'delete challenge');
    }
});

// ─── SUBMISSION ROUTES ────────────────────────────────────────────────────────

// GET /api/submissions - Any authenticated user
app.get('/api/submissions', requireAuth, async (req, res) => {
    try {
        const submissions = await Submission.findAll({
            include: [
                { model: User, attributes: ['id', 'username'] },
                { model: Challenge, attributes: ['id', 'name', 'category', 'pointValue'] }
            ]
        });
        res.json(submissions);
    } catch (error) {
        handleSequelizeError(res, error, 'fetch submissions');
    }
});

// GET /api/submissions/:id - Any authenticated user
app.get('/api/submissions/:id', requireAuth, async (req, res) => {
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
        handleSequelizeError(res, error, 'fetch submission');
    }
});

// POST /api/submissions - Any authenticated user
app.post('/api/submissions', requireAuth, async (req, res) => {
    try {
        const { flag, challengeId } = req.body;

        if (!flag || !challengeId) {
            return res.status(400).json({ error: 'flag and challengeId are required' });
        }

        const challenge = await Challenge.findByPk(challengeId);
        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        // Automatically use the logged in user's ID from the JWT
        const newSubmission = await Submission.create({
            flag,
            userId: req.user.id,
            challengeId
        });

        res.status(201).json(newSubmission);
    } catch (error) {
        handleSequelizeError(res, error, 'create submission');
    }
});

// PUT /api/submissions/:id - Owner or team lead
app.put('/api/submissions/:id', requireAuth, async (req, res) => {
    try {
        const { flag } = req.body;

        const submission = await Submission.findByPk(req.params.id);
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Only the submitter or a team lead can update
        if (submission.userId !== req.user.id && req.user.role !== 'teamlead') {
            return res.status(403).json({ error: 'Access denied. You can only update your own submissions.' });
        }

        await Submission.update({ flag }, { where: { id: req.params.id } });

        const updatedSubmission = await Submission.findByPk(req.params.id);
        res.json(updatedSubmission);
    } catch (error) {
        handleSequelizeError(res, error, 'update submission');
    }
});

// DELETE /api/submissions/:id - Team lead only
app.delete('/api/submissions/:id', requireAuth, requireTeamLead, async (req, res) => {
    try {
        const deletedRowsCount = await Submission.destroy({ where: { id: req.params.id } });

        if (deletedRowsCount === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json({ message: 'Submission deleted successfully' });
    } catch (error) {
        handleSequelizeError(res, error, 'delete submission');
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