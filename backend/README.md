# Focus Flow Backend

Backend API for Focus Flow habit and task tracking application.

## Tech Stack

- Node.js + Express.js + TypeScript
- MongoDB Atlas (free tier)
- Mongoose ODM
- JWT Authentication
- Bcrypt for password hashing

## Setup Instructions

### 1. Install Dependencies

Already done! Dependencies are installed.

### 2. Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account (no credit card required)
3. Create a new cluster (M0 FREE tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Create database user with username and password
7. Add your IP to network access (or allow 0.0.0.0/0 for testing)

### 3. Configure Environment Variables

Edit the `.env` file and replace `your_mongodb_atlas_connection_string_here` with your actual MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/focus-flow?retryWrites=true&w=majority
JWT_SECRET=focus_flow_super_secret_key_change_in_production_12345
PORT=3001
NODE_ENV=development
```

### 4. Start the Server

```bash
npm run dev
```

The server will start on http://localhost:3001

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Habits

- `GET /api/habits` - Get all habits (protected)
- `POST /api/habits` - Create habit (protected)
- `PUT /api/habits/:id` - Update habit (protected)
- `DELETE /api/habits/:id` - Delete habit (protected)
- `GET /api/habits/completions` - Get completions (protected)
- `POST /api/habits/completions` - Toggle completion (protected)

### Tasks

- `GET /api/tasks` - Get all tasks (protected)
- `POST /api/tasks` - Create task (protected)
- `PUT /api/tasks/:id` - Update task (protected)
- `DELETE /api/tasks/:id` - Delete task (protected)
- `GET /api/tasks/completions` - Get completions (protected)
- `POST /api/tasks/completions` - Toggle completion (protected)

### Sessions

- `GET /api/sessions` - Get sessions (protected)
- `POST /api/sessions` - Create session (protected)
- `GET /api/sessions/stats` - Get statistics (protected)

## Testing the API

You can test endpoints using the REST Client extension in VS Code or Postman.

Example registration:

```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User"
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts       # MongoDB connection
│   ├── middleware/
│   │   └── auth.ts            # JWT authentication
│   ├── models/
│   │   ├── User.model.ts
│   │   ├── Habit.model.ts
│   │   ├── HabitCompletion.model.ts
│   │   ├── Task.model.ts
│   │   ├── TaskCompletion.model.ts
│   │   └── Session.model.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── habits.routes.ts
│   │   ├── tasks.routes.ts
│   │   └── sessions.routes.ts
│   └── server.ts              # Main application
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```
