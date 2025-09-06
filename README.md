# Express TypeScript Backend

A type-safe RESTful API backend built with Express and TypeScript.

## Features

- ✨ TypeScript for type safety
- 🚀 Express.js framework
- 🛡️ Helmet for security headers
- 📝 Request logging with Morgan
- 🔧 Environment configuration with dotenv
- 🔄 CORS support
- 📦 In-memory data storage

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

## Scripts

### Development (with hot reload)
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Run production build
```bash
npm start
```

### Type checking
```bash
npm run typecheck
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Posts
- `GET /api/posts` - Get all posts (query params: `userId`, `sort`)
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

## Example API Calls

### Create a user
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "email": "alice@example.com"}'
```

### Create a post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "My Post", "content": "Post content", "userId": 1}'
```

### Get filtered posts
```bash
curl "http://localhost:3000/api/posts?userId=1&sort=desc"
```

## Project Structure

```
src/
├── server.ts          # Main server file
├── types/             # TypeScript type definitions
│   └── index.ts      
└── routes/            # API routes
    ├── api.ts        # Main API router
    ├── users.ts      # User endpoints
    └── posts.ts      # Post endpoints
```

## Type Definitions

The application uses strongly typed interfaces for all data models:

- `User` - User entity
- `Post` - Post entity
- `CreateUserDto` - User creation data
- `UpdateUserDto` - User update data
- `CreatePostDto` - Post creation data
- `UpdatePostDto` - Post update data

## Technologies

- **TypeScript** - Type-safe JavaScript
- **Express** - Web framework
- **tsx** - TypeScript execution for development
- **cors** - Cross-origin resource sharing
- **helmet** - Security headers
- **morgan** - HTTP request logger
- **dotenv** - Environment variables

## Requirements

- Node.js 18+
- npm or yarn