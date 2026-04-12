// Populates the database with sample CTF competition data
const { db, User, Challenge, Submission } = require('./setup');

const sampleUsers = [
    { username: 'alice', email: 'alice@team.com', password: 'password123', role: 'teamlead' },
    { username: 'bob', email: 'bob@team.com', password: 'password123', role: 'member' },
    { username: 'carol', email: 'carol@team.com', password: 'password123', role: 'member' },
    { username: 'dave', email: 'dave@team.com', password: 'password123', role: 'member' }
];

const sampleChallenges = [
    { name: 'SQL Injection 101', category: 'Web Application Exploitation', pointValue: 100, difficulty: 'Easy' },
    { name: 'RSA Basics', category: 'Cryptography', pointValue: 150, difficulty: 'Medium' },
    { name: 'Hidden in Plain Sight', category: 'Forensics', pointValue: 200, difficulty: 'Medium' },
    { name: 'Malware Sample', category: 'Enumeration & Exploitation', pointValue: 250, difficulty: 'Hard' },
    { name: 'Cookie Monster', category: 'Web Application Exploitation', pointValue: 100, difficulty: 'Easy' },
    { name: 'XOR Everything', category: 'Cryptography', pointValue: 300, difficulty: 'Hard' },
    { name: 'Rockyou', category: 'Password Cracking', pointValue: 50, difficulty: 'Easy' },
    { name: 'Follow the Money', category: 'OSINT', pointValue: 200, difficulty: 'Medium' }
];

const sampleSubmissions = [
    { flag: 'CTF{sql_1nj3ct10n_ftw}', userId: 1, challengeId: 1 },
    { flag: 'CTF{rsa_is_ez}', userId: 2, challengeId: 2 },
    { flag: 'CTF{h1dd3n_s3cr3ts}', userId: 3, challengeId: 3 },
    { flag: 'CTF{r3v3rs3d_1t}', userId: 1, challengeId: 4 },
    { flag: 'CTF{c00k13_m0nst3r}', userId: 4, challengeId: 5 },
    { flag: 'CTF{m0n3y_m4n}', userId: 2, challengeId: 6 }
];

async function seedDatabase() {
    try {
        await db.authenticate();
        console.log('Connected to database for seeding.');

        await User.bulkCreate(sampleUsers);
        console.log('Users seeded successfully.');

        await Challenge.bulkCreate(sampleChallenges);
        console.log('Challenges seeded successfully.');

        await Submission.bulkCreate(sampleSubmissions);
        console.log('Submissions seeded successfully.');

        const userCount = await User.findAll();
        const challengeCount = await Challenge.findAll();
        const submissionCount = await Submission.findAll();
        console.log(`Database seeded with ${userCount.length} users, ${challengeCount.length} challenges, ${submissionCount.length} submissions.`);

        await db.close();
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

seedDatabase();