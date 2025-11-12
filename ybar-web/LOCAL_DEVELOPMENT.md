# Local Development Guide

This guide provides detailed instructions for setting up, running, and developing the ybar web application on your local machine.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Project Structure](#project-structure)
4. [Configuration](#configuration)
5. [Database Management](#database-management)
6. [Running the Application](#running-the-application)
7. [Development Workflow](#development-workflow)
8. [Common Development Tasks](#common-development-tasks)
9. [Debugging](#debugging)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js** 18+ and npm
  ```bash
  # Check versions
  node --version  # Should be v18.0.0 or higher
  npm --version   # Should be 9.0.0 or higher
  ```

  **Installation:**
  - **macOS**: `brew install node@18`
  - **Linux**: Use [nvm](https://github.com/nvm-sh/nvm) or package manager
  - **Windows**: Download from [nodejs.org](https://nodejs.org/)

- **Git**
  ```bash
  # Check version
  git --version
  ```

### Optional but Recommended

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Playwright Test for VS Code

- **Database viewer** (optional):
  - [DB Browser for SQLite](https://sqlitebrowser.org/)
  - VS Code SQLite extension

## Initial Setup

### 1. Clone the Repository

```bash
# If you haven't cloned yet
git clone <repository-url>
cd ybar/ybar-web
```

### 2. Install Dependencies

Install dependencies for both backend and frontend:

```bash
# Backend dependencies
cd backend
npm install
cd ..

# Frontend dependencies
cd frontend
npm install
cd ..
```

**What gets installed:**

**Backend:**
- Express server and middleware
- TypeScript and type definitions
- Database libraries (better-sqlite3)
- Authentication libraries (JWT, bcrypt)
- Testing frameworks (Jest, supertest)
- File upload handling (multer)

**Frontend:**
- React 18 and React Router
- TypeScript and type definitions
- Vite (dev server and build tool)
- TailwindCSS and PostCSS
- State management (Zustand)
- HTTP client (Axios)
- Form handling (React Hook Form)
- E2E testing (Playwright)
- Unit testing (Vitest)

### 3. Environment Configuration

**Backend:**

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your settings:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key-change-in-production-use-long-random-string

# Database
DATABASE_PATH=./data/ybar.db

# File Uploads
UPLOADS_DIR=./uploads
```

**Important:** Change `JWT_SECRET` to a secure random string for production!

**Frontend:**

Create `frontend/.env`:

```bash
cd frontend
cat > .env << EOF
VITE_API_URL=http://localhost:3001/api
EOF
```

### 4. Database Setup

Initialize the database:

```bash
cd backend

# Create database and run migrations
npm run migrate

# Seed with test data
npm run seed
```

**What this creates:**

- **Database file**: `backend/data/ybar.db`
- **Tables**: users, jobs, tasks, task_files, payments, clients, devices, points
- **Test data**:
  - 1 admin user
  - 2 worker users
  - Sample jobs and tasks

**Test Accounts Created:**
- Admin: `admin@ybar.com` / `admin123`
- Worker 1: `worker1@ybar.com` / `worker123`
- Worker 2: `worker2@ybar.com` / `worker123`

### 5. Verify Installation

```bash
# Check backend
cd backend
npm run dev
# Should see: "Server running on port 3001"

# In another terminal, check frontend
cd frontend
npm run dev
# Should see: "Local: http://localhost:3000"
```

If both start successfully, you're ready to develop!

## Project Structure

```
ybar-web/
├── backend/                      # Node.js/Express backend
│   ├── src/
│   │   ├── db/                   # Database management
│   │   │   ├── schema.sql       # Database schema
│   │   │   ├── migrate.ts       # Migration script
│   │   │   └── seed.ts          # Test data seeder
│   │   ├── middleware/           # Express middleware
│   │   │   └── auth.ts          # JWT authentication
│   │   ├── routes/               # API route handlers
│   │   │   ├── auth.ts          # Authentication endpoints
│   │   │   ├── jobs.ts          # Job management endpoints
│   │   │   ├── tasks.ts         # Task management endpoints
│   │   │   ├── payments.ts      # Payment endpoints
│   │   │   ├── profile.ts       # User profile endpoints
│   │   │   ├── clients.ts       # Client management
│   │   │   ├── devices.ts       # Device tracking
│   │   │   └── points.ts        # Points/rewards system
│   │   └── index.ts             # Server entry point
│   ├── __tests__/               # Test files
│   │   ├── routes/              # API route tests
│   │   ├── integration/         # Integration tests
│   │   ├── property/            # Property-based tests
│   │   └── scenarios/           # Scenario tests
│   ├── data/                    # Database storage (gitignored)
│   ├── uploads/                 # File uploads (gitignored)
│   ├── package.json             # Dependencies and scripts
│   ├── tsconfig.json            # TypeScript configuration
│   └── jest.config.js           # Jest test configuration
│
└── frontend/                    # React/TypeScript frontend
    ├── src/
    │   ├── components/          # Reusable components
    │   │   ├── Layout.tsx       # Page layout wrapper
    │   │   ├── ProtectedRoute.tsx  # Auth guard
    │   │   └── ...              # Other shared components
    │   ├── pages/               # Page components
    │   │   ├── admin/           # Admin-only pages
    │   │   │   ├── Dashboard.tsx
    │   │   │   ├── Jobs.tsx
    │   │   │   ├── JobDetail.tsx
    │   │   │   ├── ReviewTasks.tsx
    │   │   │   └── Payments.tsx
    │   │   ├── worker/          # Worker-only pages
    │   │   │   ├── Dashboard.tsx
    │   │   │   ├── Jobs.tsx
    │   │   │   ├── MyTasks.tsx
    │   │   │   ├── TaskDetail.tsx
    │   │   │   ├── Payments.tsx
    │   │   │   └── Profile.tsx
    │   │   ├── Login.tsx        # Login page
    │   │   └── Register.tsx     # Registration page
    │   ├── lib/                 # Utilities and API client
    │   │   └── api.ts           # Axios API client
    │   ├── store/               # State management
    │   │   └── auth.ts          # Auth state (Zustand)
    │   ├── types/               # TypeScript type definitions
    │   │   └── index.ts         # Shared types
    │   ├── App.tsx              # Main app component
    │   ├── main.tsx             # React entry point
    │   └── index.css            # Global styles
    ├── e2e/                     # Playwright E2E tests
    │   ├── auth.spec.ts         # Authentication tests
    │   ├── admin.spec.ts        # Admin workflow tests
    │   ├── worker.spec.ts       # Worker workflow tests
    │   └── prd-features.spec.ts # Product requirements tests
    ├── public/                  # Static assets
    ├── package.json             # Dependencies and scripts
    ├── tsconfig.json            # TypeScript configuration
    ├── vite.config.ts           # Vite configuration
    ├── tailwind.config.js       # TailwindCSS configuration
    └── playwright.config.ts     # Playwright configuration
```

## Configuration

### Backend Configuration (`backend/.env`)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3001` | No |
| `NODE_ENV` | Environment | `development` | No |
| `JWT_SECRET` | Secret for JWT tokens | - | Yes |
| `DATABASE_PATH` | SQLite database path | `./data/ybar.db` | No |
| `UPLOADS_DIR` | File upload directory | `./uploads` | No |

### Frontend Configuration (`frontend/.env`)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001/api` | Yes |

### Vite Proxy Configuration

The frontend proxies API requests to the backend (configured in `vite.config.ts`):

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true
    }
  }
}
```

This allows frontend to make requests to `/api/*` which get forwarded to `http://localhost:3001/api/*`.

## Database Management

### SQLite Database

The application uses **SQLite** for simplicity and portability. The database file is stored at `backend/data/ybar.db`.

### Database Operations

**View database structure:**
```bash
cd backend
sqlite3 data/ybar.db ".schema"
```

**Query data:**
```bash
sqlite3 data/ybar.db "SELECT * FROM users;"
```

**Reset database:**
```bash
cd backend
rm -rf data/ybar.db    # Delete database
npm run migrate         # Recreate schema
npm run seed           # Add test data
```

**Backup database:**
```bash
cd backend
cp data/ybar.db data/ybar.backup.db
```

### Database Schema

**Main Tables:**

- **users**: User accounts (admin/worker roles)
- **jobs**: Data collection jobs created by admins
- **tasks**: Individual tasks within jobs
- **task_files**: Photos/videos uploaded by workers
- **payments**: Payment records for completed tasks
- **clients**: Client organizations (optional)
- **devices**: Worker device tracking
- **points**: Gamification/rewards system

### Migrations

Migrations are run with:
```bash
npm run migrate
```

The migration script (`src/db/migrate.ts`) reads `src/db/schema.sql` and creates all tables.

### Seeding

Test data seeding:
```bash
npm run seed
```

The seed script (`src/db/seed.ts`) creates:
- Admin and worker users
- Sample jobs
- Sample tasks
- Test payments

## Running the Application

### Development Mode

You need **two terminal windows** to run the full application:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Output:
```
Server running on port 3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Output:
```
  VITE v7.2.2  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Access the Application

Open your browser to: **http://localhost:3000**

### Available Scripts

**Backend (`backend/package.json`):**
```bash
npm run dev      # Start dev server with hot reload (tsx)
npm run build    # Compile TypeScript to JavaScript
npm start        # Run compiled JavaScript (production)
npm test         # Run Jest tests
npm run migrate  # Run database migrations
npm run seed     # Seed database with test data
```

**Frontend (`frontend/package.json`):**
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run Vitest unit tests
npm run test:e2e # Run Playwright E2E tests
```

## Development Workflow

### Typical Development Session

1. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend (new terminal):**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open browser:**
   - Navigate to `http://localhost:3000`
   - Login with test account

4. **Make changes:**
   - Edit files in `src/`
   - Changes auto-reload in browser (HMR)

5. **Test changes:**
   - Manual testing in browser
   - Run automated tests

6. **Commit changes:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

### Hot Module Replacement (HMR)

**Frontend:**
- Vite provides instant HMR
- Changes to React components update immediately
- State is preserved during updates

**Backend:**
- `tsx` provides automatic restart on file changes
- Server restarts when backend files are modified
- Active connections may need to refresh

### Code Organization

**Backend:**
- **Routes**: Add new endpoints in `src/routes/`
- **Middleware**: Add shared logic in `src/middleware/`
- **Database**: Modify `src/db/schema.sql` for schema changes
- **Types**: Define TypeScript types inline or in route files

**Frontend:**
- **Components**: Reusable UI in `src/components/`
- **Pages**: Full page components in `src/pages/`
- **API**: HTTP requests in `src/lib/api.ts`
- **State**: Global state in `src/store/`
- **Types**: TypeScript types in `src/types/`

## Common Development Tasks

### Adding a New API Endpoint

1. **Create route handler** (`backend/src/routes/example.ts`):
   ```typescript
   import { Router } from 'express';
   import { authenticateToken } from '../middleware/auth';

   const router = Router();

   router.get('/example', authenticateToken, (req, res) => {
     res.json({ message: 'Hello World' });
   });

   export default router;
   ```

2. **Register route** (`backend/src/index.ts`):
   ```typescript
   import exampleRoutes from './routes/example';
   app.use('/api/example', exampleRoutes);
   ```

3. **Test endpoint**:
   ```bash
   curl http://localhost:3001/api/example \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Adding a New Page

1. **Create page component** (`frontend/src/pages/Example.tsx`):
   ```typescript
   export default function Example() {
     return (
       <div>
         <h1>Example Page</h1>
       </div>
     );
   }
   ```

2. **Add route** (`frontend/src/App.tsx`):
   ```typescript
   import Example from './pages/Example';

   <Route path="/example" element={<Example />} />
   ```

3. **Navigate to page**: `http://localhost:3000/example`

### Adding Database Columns

1. **Update schema** (`backend/src/db/schema.sql`):
   ```sql
   ALTER TABLE users ADD COLUMN phone TEXT;
   ```

2. **Reset database**:
   ```bash
   cd backend
   rm data/ybar.db
   npm run migrate
   npm run seed
   ```

   **Note:** In production, use proper migration tools.

### Working with File Uploads

Files are uploaded to `backend/uploads/` via Multer.

**Test file upload:**
```bash
curl -X POST http://localhost:3001/api/tasks/1/submit \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "notes=Task completed"
```

**Access uploaded files:**
- Files are served statically from `/uploads/`
- Example: `http://localhost:3001/uploads/filename.jpg`

### Authentication Flow

1. **Register/Login**: Get JWT token
2. **Store token**: Saved in localStorage
3. **API requests**: Include token in Authorization header
4. **Token validation**: Backend middleware checks token
5. **Role-based access**: Admin vs Worker endpoints

**Test authentication:**
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ybar.com","password":"admin123"}'

# Use token
curl http://localhost:3001/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Debugging

### Backend Debugging

**VS Code launch config** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

**Console logging:**
```typescript
console.log('Debug info:', variable);
console.error('Error:', error);
```

**Node debugger:**
```bash
node --inspect-brk node_modules/.bin/tsx src/index.ts
```

### Frontend Debugging

**Browser DevTools:**
- Open Chrome DevTools (F12)
- Sources tab → Set breakpoints
- Console tab → View logs

**React DevTools:**
- Install React DevTools browser extension
- Inspect component state and props

**VS Code debugging:**
```json
{
  "type": "chrome",
  "request": "launch",
  "name": "Debug Frontend",
  "url": "http://localhost:3000",
  "webRoot": "${workspaceFolder}/frontend/src"
}
```

### Database Debugging

**View queries:**
```typescript
// Add logging to database operations
console.log('Executing query:', query);
```

**SQLite CLI:**
```bash
sqlite3 backend/data/ybar.db
.tables           # List tables
.schema users     # View table schema
SELECT * FROM users;  # Query data
.exit             # Exit
```

### API Debugging

**Use curl:**
```bash
curl -v http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

**Use Postman or Insomnia:**
- Import API endpoints
- Test requests interactively
- View response data

**Check network tab:**
- Open browser DevTools
- Network tab → Filter by XHR
- Inspect request/response

## Troubleshooting

### Common Issues and Solutions

#### Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Find and kill process using port
lsof -ti:3001 | xargs kill -9

# Or change port in backend/.env
PORT=3002
```

#### Database Locked

**Error:**
```
Error: SQLITE_BUSY: database is locked
```

**Solution:**
```bash
# Stop all running instances
# Delete database and recreate
cd backend
rm data/ybar.db
npm run migrate
npm run seed
```

#### Module Not Found

**Error:**
```
Cannot find module 'express'
```

**Solution:**
```bash
# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors

**Error:**
```
TS2304: Cannot find name 'Request'
```

**Solution:**
```bash
# Install type definitions
npm install --save-dev @types/express @types/node
```

#### CORS Errors

**Error:**
```
Access-Control-Allow-Origin header is missing
```

**Solution:**
- Backend already has CORS enabled
- Check `backend/src/index.ts` for CORS configuration
- Ensure frontend proxy is configured in `vite.config.ts`

#### Build Errors

**Error:**
```
Build failed with errors
```

**Solution:**
```bash
# Clear build cache and rebuild
cd frontend
rm -rf node_modules .vite dist
npm install
npm run build
```

#### Authentication Issues

**Error:**
```
401 Unauthorized
```

**Solution:**
- Check JWT token in localStorage
- Verify token hasn't expired
- Ensure Authorization header is set
- Check JWT_SECRET matches between backend and token

#### File Upload Fails

**Error:**
```
Error: ENOENT: no such file or directory
```

**Solution:**
```bash
# Create uploads directory
mkdir -p backend/uploads

# Check permissions
chmod 755 backend/uploads
```

#### E2E Tests Fail

**Error:**
```
Playwright test timeout
```

**Solution:**
```bash
# Ensure servers are running
cd backend && npm run dev
cd frontend && npm run dev

# Install browsers
cd frontend
npx playwright install
```

### Getting Help

If you encounter issues not covered here:

1. **Check logs**: Review terminal output for error messages
2. **Check browser console**: Look for JavaScript errors
3. **Check network tab**: Verify API requests/responses
4. **Check database**: Query database directly to verify data
5. **Search issues**: Check GitHub issues for similar problems
6. **Reset everything**: Delete node_modules, database, reinstall

### Clean Slate Reset

If all else fails, start fresh:

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json data uploads
npm install
npm run migrate
npm run seed

# Frontend
cd frontend
rm -rf node_modules package-lock.json .vite dist
npm install
npx playwright install
```

## Performance Tips

### Backend Performance

- **Use database indexes**: Add indexes for frequently queried columns
- **Connection pooling**: Consider connection pooling for production
- **Caching**: Add Redis for session/data caching
- **Compression**: Enable gzip compression

### Frontend Performance

- **Code splitting**: Use React.lazy() for route-based splitting
- **Memoization**: Use React.memo() for expensive components
- **Optimize images**: Compress images before uploading
- **Lazy load**: Defer loading of non-critical resources

## Next Steps

Once you're comfortable with local development:

1. **Write tests**: See [TESTING.md](./TESTING.md) for testing guide
2. **Read API docs**: Review [README.md](./README.md) for API reference
3. **Explore features**: Test admin and worker workflows
4. **Add features**: Implement new functionality
5. **Deploy**: Set up production deployment

## Additional Resources

- **Express.js**: https://expressjs.com/
- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Vite**: https://vitejs.dev/guide/
- **TailwindCSS**: https://tailwindcss.com/docs
- **SQLite**: https://www.sqlite.org/docs.html
- **JWT**: https://jwt.io/introduction

Happy coding!
