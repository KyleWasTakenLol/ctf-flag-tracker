// Initializes the database and defines all models and relationships
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const db = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    })
    : new Sequelize({
        dialect: 'sqlite',
        storage: `database/${process.env.DB_NAME || 'ctf_tracker.db'}`,
        logging: console.log
    });
    
// Users table — stores team member accounts
const User = db.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    // Stores bcrypt hash, never plain text
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'member',
        validate: {
            isIn: [['member', 'teamlead']]
        }
    }
});

// Challenges table — stores CTF competition problems
const Challenge = db.define('Challenge', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['OSINT', 'Cryptography', 'Password Cracking', 'Log Analysis', 'Network Traffic Analysis', 'Forensics', 'Scanning & Reconnaissance', 'Web Application Exploitation', 'Enumeration & Exploitation']]
        }
    },
    pointValue: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    difficulty: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['Easy', 'Medium', 'Hard']]
        }
    }
});

// Submissions table — core table linking Users and Challenges
const Submission = db.define('Submission', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    flag: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    challengeId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

// Relationships
User.hasMany(Submission, { foreignKey: 'userId' });
Submission.belongsTo(User, { foreignKey: 'userId' });

Challenge.hasMany(Submission, { foreignKey: 'challengeId' });
Submission.belongsTo(Challenge, { foreignKey: 'challengeId' });

module.exports = { db, User, Challenge, Submission };

// Create tables when run directly
async function setupDatabase() {
    try {
        await db.authenticate();
        console.log('Connection to database established successfully.');
        await db.sync({ force: true });
        console.log('Database tables created successfully.');
        await db.close();
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

if (require.main === module) {
    setupDatabase();
}