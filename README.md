# CTF Flag Tracker API

Application Development Course Final Project

A REST API for managing Capture the Flag competition progress. Built to replace the messy Discord channels and shared spreadsheets that CTF teams rely on to track solved challenges and submitted flags.

## Technologies Used

- Node.js
- Express.js
- Sequelize ORM
- SQLite
- Jest & Supertest (testing)
- dotenv

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

## Sample Users

| Username | Email | Role |
|---|---|---|
| alice | alice@team.com | teamlead |
| bob | bob@team.com | member |
| carol | carol@team.com | member |
| dave | dave@team.com | member |

## API Endpoints

### Utility

| Method | Endpoint | Description |
|---|---|---|
| GET | /health | Health check |
| GET | / | API info |

### Users

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/users | Get all users |
| GET | /api/users/:id | Get single user |
| POST | /api/users | Create a user |
| PUT | /api/users/:id | Update a user |
| DELETE | /api/users/:id | Delete a user |

**POST /api/users request body:**

```json
{
  "username": "john",
  "email": "john@team.com",
  "password": "password123",
  "role": "member"
}
```

### Challenges

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/challenges | Get all challenges |
| GET | /api/challenges/:id | Get single challenge |
| POST | /api/challenges | Create a challenge |
| PUT | /api/challenges/:id | Update a challenge |
| DELETE | /api/challenges/:id | Delete a challenge |

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

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/submissions | Get all submissions |
| GET | /api/submissions/:id | Get single submission |
| POST | /api/submissions | Log a flag submission |
| PUT | /api/submissions/:id | Update a submission |
| DELETE | /api/submissions/:id | Delete a submission |

**POST /api/submissions request body:**

```json
{
  "flag": "CTF{example_flag}",
  "userId": 1,
  "challengeId": 1
}
```

## Running Tests

```bash
npm test
```

## Future Improvements

- Better formatting and clearer visuals
- GUI front end interface
- Conversion into a standalone application