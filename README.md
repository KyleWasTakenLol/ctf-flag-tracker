# CTF Flag Tracker API

Application Development Course Final Project

A REST API for managing Capture the Flag competition progress. Built to replace the messy Discord channels and shared spreadsheets that CTF teams rely on to track solved challenges and submitted flags.

## Technologies Used

- Node.js
- Express.js
- Sequelize ORM
- SQLite (local) / PostgreSQL (production)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- Jest & Supertest (testing)
- dotenv
- cors

## Setup Instructions

1. Clone the repository:

```bash
git clone YOUR_REPO_URL
cd ctf-flag-tracker
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root:

```
NODE_ENV=development
PORT=3000
DB_NAME=ctf_tracker.db
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
```

4. Set up the database:

```bash
npm run setup
```

5. Seed the database with sample data:

```bash
npm run seed
```

6. Start the server:

```bash
npm start
```

The API will be available at `http://localhost:3000`

## Deployed API

`https://ctf-flag-tracker.onrender.com`

## Sample Users

| Username | Email | Password | Role |
|---|---|---|---|
| alice | alice@team.com | password123 | teamlead |
| bob | bob@team.com | password123 | member |
| carol | carol@team.com | password123 | member |
| dave | dave@team.com | password123 | member |

## User Roles

| Role | Permissions |
|---|---|
| member | Register, login, view challenges, log submissions, view submissions, update own submissions |
| teamlead | All member permissions plus create/update/delete challenges, delete any submission, view and manage all users |

## Authentication Guide

### Register

```
POST /api/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@team.com",
  "password": "password123",
  "role": "member"
}
```

### Login

```
POST /api/login
Content-Type: application/json

{
  "email": "john@team.com",
  "password": "password123"
}
```

The response includes a JWT token:

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "username": "john", "email": "john@team.com", "role": "member" }
}
```

### Using the Token

Include the token in the Authorization header for all protected routes:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Logout

```
POST /api/logout
Authorization: Bearer YOUR_JWT_TOKEN
```

## API Endpoints

### Utility

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | / | None | API info |
| GET | /health | None | Health check |

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/register | None | Register a new user |
| POST | /api/login | None | Login and receive JWT token |
| POST | /api/logout | Required | Logout |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/users | Team lead | Get all users |
| GET | /api/users/:id | Team lead | Get single user |
| POST | /api/users | Team lead | Create a user |
| PUT | /api/users/:id | Team lead | Update a user |
| DELETE | /api/users/:id | Team lead | Delete a user |

### Challenges

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/challenges | Member | Get all challenges |
| GET | /api/challenges/:id | Member | Get single challenge |
| POST | /api/challenges | Team lead | Create a challenge |
| PUT | /api/challenges/:id | Team lead | Update a challenge |
| DELETE | /api/challenges/:id | Team lead | Delete a challenge |

**POST /api/challenges request body:**

```json
{
  "name": "SQL Injection 101",
  "category": "Web Application Exploitation",
  "pointValue": 100,
  "difficulty": "Easy"
}
```

**Valid categories:**
- OSINT
- Cryptography
- Password Cracking
- Log Analysis
- Network Traffic Analysis
- Forensics
- Scanning & Reconnaissance
- Web Application Exploitation
- Enumeration & Exploitation

**Valid difficulty values:** `Easy`, `Medium`, `Hard`

### Submissions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/submissions | Member | Get all submissions |
| GET | /api/submissions/:id | Member | Get single submission |
| POST | /api/submissions | Member | Log a flag submission |
| PUT | /api/submissions/:id | Owner or team lead | Update a submission |
| DELETE | /api/submissions/:id | Team lead | Delete a submission |

**POST /api/submissions request body:**

```json
{
  "flag": "CTF{example_flag}",
  "challengeId": 1
}
```

Note: `userId` is automatically set from the JWT token — you do not need to include it in the request body.

## Running Tests

```bash
npm test
```

## Future Improvements

- Better formatting and clearer visuals
- GUI front end interface
- Conversion into a standalone application
- Prevent duplicate flag submissions for the same challenge
- Scoreboard endpoint showing total points per user