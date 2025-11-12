# ybar Web Application - Modern Stack

A modernized web application for the ybar crowdsourced data collection platform, rebuilt with React, TypeScript, Node.js, and SQLite.

## Overview

ybar is a platform for collecting statistically sound metrics for geographic regions through crowdsourced data collection. This modern web application replaces the legacy AngularJS/Ionic mobile app with a responsive web interface.

### Key Features

**For Administrators:**
- Create and manage data collection jobs
- Add tasks with specific locations and requirements
- Review worker submissions with photos/videos
- Approve or reject task submissions
- Manage worker payments

**For Workers:**
- Browse and accept available tasks
- View task details with location information
- Submit completed tasks with photos/videos
- Track submission status and earnings
- View payment history

## Technology Stack

### Backend
- **Node.js** with **Express** - REST API server
- **TypeScript** - Type-safe backend development
- **SQLite** with **better-sqlite3** - Lightweight database
- **JWT** - Secure authentication
- **Multer** - File upload handling
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe frontend development
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Zustand** - State management
- **TailwindCSS** - Utility-first styling
- **Axios** - HTTP client
- **React Hook Form** - Form handling

### Testing
- **Playwright** - E2E testing framework
- **Vitest** - Unit testing (configured)

## Project Structure

```
ybar-web/
├── backend/                # Node.js/Express backend
│   ├── src/
│   │   ├── db/            # Database schema and migrations
│   │   ├── middleware/    # Express middleware (auth)
│   │   ├── routes/        # API route handlers
│   │   └── index.ts       # Server entry point
│   ├── data/              # SQLite database file (created on first run)
│   ├── uploads/           # Uploaded files (created on first run)
│   └── package.json
│
└── frontend/              # React/Vite frontend
    ├── src/
    │   ├── components/    # Reusable React components
    │   ├── pages/         # Page components
    │   │   ├── admin/     # Admin dashboard pages
    │   │   └── worker/    # Worker interface pages
    │   ├── lib/           # API client and utilities
    │   ├── store/         # State management
    │   ├── types/         # TypeScript types
    │   └── App.tsx        # Main app component
    ├── e2e/               # Playwright E2E tests
    └── package.json
```

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- Git

### Installation

1. **Clone the repository** (if not already cloned):
   ```bash
   cd ybar/ybar-web
   ```

2. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

### Database Setup

1. **Create and migrate the database**:
   ```bash
   cd backend
   npm run migrate
   ```

2. **Seed the database with test data**:
   ```bash
   npm run seed
   ```

This creates:
- Admin user: `admin@ybar.com` / `admin123`
- Worker users: `worker1@ybar.com` / `worker123`, `worker2@ybar.com` / `worker123`
- Sample jobs and tasks

### Running the Application

You'll need two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:3000`

### Access the Application

Open your browser to `http://localhost:3000`

**Test Accounts:**
- **Admin**: admin@ybar.com / admin123
- **Worker**: worker1@ybar.com / worker123

## Usage Guide

### Admin Workflow

1. **Login** with admin credentials
2. **Create Jobs**: Navigate to Jobs → Create Job
   - Fill in job details (title, description, pay rate, dates)
   - Submit to create the job
3. **Add Tasks**: Click on a job → Add Task
   - Specify task location (coordinates or location name)
   - Add task description and requirements
4. **Review Submissions**: Navigate to Review Tasks
   - View submitted tasks with uploaded files
   - Add reviewer notes
   - Approve or reject submissions
5. **Manage Payments**: Navigate to Payments
   - View all pending and paid payments
   - Mark payments as paid

### Worker Workflow

1. **Login** with worker credentials
2. **Browse Jobs**: Navigate to Browse Jobs
   - View available tasks
   - Filter by job
3. **Accept Tasks**: Click "Accept Task" on available tasks
4. **Submit Work**: Navigate to My Tasks → Click on assigned task
   - Add submission notes
   - Upload photos/videos
   - Submit for review
5. **Track Earnings**: Navigate to Payments
   - View payment status
   - Track total earnings

## Testing

### E2E Tests with Playwright

The application includes comprehensive E2E tests for both admin and worker workflows.

**Install Playwright browsers** (first time only):
```bash
cd frontend
npx playwright install
```

**Run all E2E tests**:
```bash
npm run test:e2e
```

**Run tests in UI mode** (recommended for development):
```bash
npx playwright test --ui
```

**Run specific test file**:
```bash
npx playwright test e2e/admin.spec.ts
npx playwright test e2e/worker.spec.ts
npx playwright test e2e/auth.spec.ts
```

**Test Coverage:**
- Authentication (login, logout, validation)
- Admin workflows (create jobs, add tasks, review submissions, manage payments)
- Worker workflows (browse jobs, accept tasks, submit work, view payments)

### Unit Tests

```bash
cd frontend
npm run test
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Job Endpoints

- `GET /api/jobs` - Get all active jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job (admin only)
- `PUT /api/jobs/:id` - Update job (admin only)
- `DELETE /api/jobs/:id` - Delete job (admin only)
- `GET /api/jobs/:id/stats` - Get job statistics (admin only)

### Task Endpoints

- `GET /api/tasks/job/:jobId` - Get tasks for a job
- `GET /api/tasks/available` - Get available tasks (worker)
- `GET /api/tasks/my-tasks` - Get worker's tasks
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create task (admin only)
- `POST /api/tasks/:id/assign` - Accept task (worker)
- `POST /api/tasks/:id/submit` - Submit task (worker)
- `POST /api/tasks/:id/review` - Review task (admin only)
- `GET /api/tasks/pending/review` - Get tasks pending review (admin only)

### Payment Endpoints

- `GET /api/payments/my-payments` - Get worker's payments
- `GET /api/payments` - Get all payments (admin only)
- `POST /api/payments/:id/pay` - Mark payment as paid (admin only)
- `GET /api/payments/stats/summary` - Get payment statistics (admin only)

## Development

### Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

### Environment Variables

**Backend (.env):**
```
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
DATABASE_PATH=./data/ybar.db
UPLOADS_DIR=./uploads
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3001/api
```

## Database Schema

### Users
- Stores admin and worker accounts
- Roles: `admin` | `worker`
- Password hashing with bcrypt

### Jobs
- Data collection job definitions
- Pay rates, task counts, date ranges
- Linked to clients

### Tasks
- Individual task assignments
- Location data (lat/long)
- Status tracking: available → assigned → submitted → approved/rejected

### Task Files
- Uploaded photos/videos from workers
- Linked to task submissions

### Payments
- Payment records for approved tasks
- Status: pending → paid

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (admin/worker)
- File upload validation
- SQL injection prevention (parameterized queries)
- XSS protection

## Modernization Improvements

Compared to the legacy AngularJS/Ionic app:

✅ **Modern Framework**: React 18 with TypeScript
✅ **Type Safety**: Full TypeScript coverage
✅ **Responsive Design**: TailwindCSS for mobile-first design
✅ **Fast Development**: Vite for instant HMR
✅ **Simple Database**: SQLite (no MySQL server required)
✅ **E2E Testing**: Comprehensive Playwright tests
✅ **Clean Architecture**: Separated concerns, RESTful API
✅ **Better Security**: JWT tokens, password hashing
✅ **No WordPress**: Custom Node.js/Express backend

## Troubleshooting

**Port already in use:**
```bash
# Change port in backend/.env (PORT=3002)
# Change port in frontend/vite.config.ts (port: 3001)
```

**Database locked error:**
```bash
# Stop all running instances and restart
```

**File upload not working:**
```bash
# Ensure uploads directory exists and has write permissions
mkdir -p backend/uploads
```

## License

MIT License - See the main repository [README](../README.md) for full details.

## Contributing

This modernized web application maintains compatibility with the original ybar concept while providing a cleaner, more maintainable codebase for future development.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review E2E test examples for usage patterns
3. Check backend logs for API errors
4. Refer to the original [ybar.pdf](../ybar.pdf) specification
