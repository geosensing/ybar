# Testing Guide

This guide covers all aspects of testing the ybar web application, including backend unit/integration tests, frontend E2E tests, and best practices for writing new tests.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Backend Testing](#backend-testing)
3. [Frontend Testing](#frontend-testing)
4. [Running Tests](#running-tests)
5. [Writing New Tests](#writing-new-tests)
6. [Test Data Management](#test-data-management)
7. [Continuous Integration](#continuous-integration)
8. [Troubleshooting](#troubleshooting)

## Testing Philosophy

The ybar application follows a comprehensive testing strategy:

- **Backend**: Unit tests, integration tests, property-based tests, and scenario tests using Jest
- **Frontend**: End-to-end tests using Playwright, unit tests with Vitest
- **Test Coverage**: Focus on critical user workflows and API endpoints
- **Test Data**: Isolated test databases and fixtures to ensure consistency

## Backend Testing

The backend uses **Jest** as the primary testing framework with several testing approaches:

### Test Structure

```
backend/
├── __tests__/
│   ├── routes/              # API route unit tests
│   ├── integration/         # Integration tests
│   ├── property/            # Property-based tests
│   └── scenarios/           # End-to-end scenario tests
└── jest.config.js           # Jest configuration
```

### Types of Backend Tests

#### 1. Unit Tests (Route Tests)

Located in `__tests__/routes/`, these test individual API endpoints in isolation.

**Example test files:**
- Route handlers for auth, jobs, tasks, payments, etc.

**What they test:**
- Request/response handling
- Input validation
- Authentication and authorization
- Error handling

#### 2. Integration Tests

Located in `__tests__/integration/`, these test multiple components working together.

**Test files:**
- `csv-upload.test.ts` - Tests CSV import functionality
- `worker-rating.test.ts` - Tests worker rating system

**What they test:**
- Database operations
- File upload processing
- Multi-step workflows
- Cross-component interactions

#### 3. Property-Based Tests

Located in `__tests__/property/`, these use **fast-check** library for property-based testing.

**Test files:**
- `points.property.test.ts` - Tests point calculation properties

**What they test:**
- Mathematical properties (e.g., commutativity, associativity)
- Edge cases through random input generation
- System invariants

#### 4. Scenario Tests

Located in `__tests__/scenarios/`, these test complete user workflows.

**Test files:**
- `complete-workflow.test.ts` - Tests full admin and worker workflows

**What they test:**
- End-to-end business processes
- Multi-step user interactions
- Real-world usage patterns

### Running Backend Tests

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# Run tests in watch mode (for development)
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- routes/auth.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="login"
```

### Backend Test Configuration

Jest configuration is in `backend/jest.config.js`:

- Uses `ts-jest` for TypeScript support
- Test environment: Node.js
- Coverage thresholds can be configured
- Supports ES modules

## Frontend Testing

The frontend uses two testing frameworks:

### 1. Playwright (E2E Tests)

End-to-end tests that simulate real user interactions in a browser.

#### Test Structure

```
frontend/
├── e2e/
│   ├── auth.spec.ts         # Authentication tests
│   ├── admin.spec.ts        # Admin workflow tests
│   ├── worker.spec.ts       # Worker workflow tests
│   └── prd-features.spec.ts # Product requirement tests
└── playwright.config.ts     # Playwright configuration
```

#### What E2E Tests Cover

**Authentication (`auth.spec.ts`):**
- User login
- Login validation
- Logout functionality
- Session persistence

**Admin Workflows (`admin.spec.ts`):**
- Create new jobs
- Add tasks to jobs
- Review worker submissions
- Approve/reject tasks
- Manage payments

**Worker Workflows (`worker.spec.ts`):**
- Browse available jobs
- Accept tasks
- Submit completed work with files
- View payment status
- Track earnings

**Product Requirements (`prd-features.spec.ts`):**
- Validate features from PRD
- Integration with product specs

#### Running E2E Tests

```bash
# Navigate to frontend directory
cd frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests (headless)
npm run test:e2e

# Run tests in UI mode (recommended for development)
npx playwright test --ui

# Run tests in headed mode (see the browser)
npx playwright test --headed

# Run specific test file
npx playwright test e2e/admin.spec.ts

# Run specific test by name
npx playwright test --grep "admin can create a job"

# Run tests in debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

#### Playwright Configuration

Configuration in `frontend/playwright.config.ts`:

- Base URL: `http://localhost:3000`
- Browsers: Chromium, Firefox, WebKit
- Screenshot on failure
- Video recording on failure
- Retries: 2 (on CI)

### 2. Vitest (Unit Tests)

Unit tests for React components, hooks, and utilities.

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm test -- --ui

# Run tests with coverage
npm test -- --coverage
```

**Note:** Unit test files should follow the pattern `*.test.ts` or `*.test.tsx` and be co-located with source files.

## Running Tests

### Prerequisites

Before running tests, ensure:

1. **Dependencies are installed:**
   ```bash
   # Backend
   cd backend && npm install

   # Frontend
   cd frontend && npm install
   npx playwright install  # First time only
   ```

2. **Application is running (for E2E tests):**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

### Quick Test Commands

```bash
# Backend tests only
cd backend && npm test

# Frontend E2E tests only
cd frontend && npm run test:e2e

# Frontend unit tests only
cd frontend && npm test

# Run all tests (requires separate terminals for each)
# Terminal 1: cd backend && npm test
# Terminal 2: cd frontend && npm run test:e2e
# Terminal 3: cd frontend && npm test
```

### Test Database

Backend tests use an in-memory SQLite database to ensure:
- Test isolation
- Fast execution
- No pollution of development database
- Consistent test data

The test database is automatically:
- Created before each test suite
- Seeded with test fixtures
- Destroyed after tests complete

## Writing New Tests

### Backend Test Template

```typescript
// __tests__/routes/example.test.ts
import request from 'supertest';
import app from '../../src/index';
import { setupTestDB, teardownTestDB } from '../helpers/db';

describe('Example API Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('should do something', async () => {
    const response = await request(app)
      .post('/api/example')
      .send({ data: 'test' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });
});
```

### Frontend E2E Test Template

```typescript
// e2e/example.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Example Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login or setup
    await page.goto('http://localhost:3000');
  });

  test('should perform an action', async ({ page }) => {
    // Navigate
    await page.click('text=Button');

    // Verify
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Frontend Unit Test Template

```typescript
// src/components/Example.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Example from './Example';

describe('Example Component', () => {
  it('should render correctly', () => {
    render(<Example />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Best Practices

1. **Descriptive Test Names**: Use clear, behavior-focused test descriptions
   ```typescript
   // Good
   test('admin can create a job with valid data');

   // Avoid
   test('test1');
   ```

2. **Arrange-Act-Assert Pattern**:
   ```typescript
   test('example', async () => {
     // Arrange - Set up test data
     const data = { name: 'test' };

     // Act - Perform action
     const response = await api.post('/endpoint', data);

     // Assert - Verify results
     expect(response.status).toBe(200);
   });
   ```

3. **Test Isolation**: Each test should be independent
   ```typescript
   beforeEach(() => {
     // Reset state before each test
   });
   ```

4. **Use Page Objects** (for E2E tests): Encapsulate page interactions
   ```typescript
   class LoginPage {
     constructor(private page) {}

     async login(email: string, password: string) {
       await this.page.fill('[name="email"]', email);
       await this.page.fill('[name="password"]', password);
       await this.page.click('button[type="submit"]');
     }
   }
   ```

5. **Avoid Test Interdependence**: Don't rely on test execution order

6. **Use Fixtures**: Create reusable test data
   ```typescript
   const testUser = {
     email: 'test@example.com',
     password: 'password123',
     role: 'worker'
   };
   ```

## Test Data Management

### Backend Test Data

Backend tests use fixtures and factories:

```typescript
// Example: Creating test users
const createTestUser = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'password123',
  role: 'worker',
  ...overrides
});
```

### Frontend Test Data

E2E tests use the seeded database:

```bash
# Seed the database before running E2E tests
cd backend
npm run seed
```

**Test Accounts:**
- Admin: `admin@ybar.com` / `admin123`
- Worker 1: `worker1@ybar.com` / `worker123`
- Worker 2: `worker2@ybar.com` / `worker123`

### Resetting Test Data

```bash
# Backend: Tests handle their own database
# No manual reset needed

# Frontend E2E: Re-seed if needed
cd backend
npm run migrate  # Reset schema
npm run seed     # Add test data
```

## Continuous Integration

### CI Pipeline Recommendations

```yaml
# Example GitHub Actions workflow
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm test

  frontend-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm run migrate
      - run: cd backend && npm run seed
      - run: cd backend && npm run dev &
      - run: cd frontend && npm install
      - run: cd frontend && npx playwright install --with-deps
      - run: cd frontend && npm run dev &
      - run: cd frontend && npm run test:e2e
```

### Pre-commit Hooks

Consider using **husky** for pre-commit test execution:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "cd backend && npm test",
      "pre-push": "cd frontend && npm run test:e2e"
    }
  }
}
```

## Troubleshooting

### Backend Tests

**Problem: Tests fail with database errors**
```bash
# Solution: Ensure test database is properly initialized
# Check test setup/teardown hooks
```

**Problem: Tests timeout**
```bash
# Solution: Increase Jest timeout
jest.setTimeout(10000);  // 10 seconds
```

**Problem: Port conflicts**
```bash
# Solution: Use different port for tests
# In test setup, set PORT env variable
process.env.PORT = '3002';
```

### Frontend E2E Tests

**Problem: Tests can't connect to server**
```bash
# Solution: Ensure both backend and frontend are running
cd backend && npm run dev  # Terminal 1
cd frontend && npm run dev # Terminal 2
```

**Problem: Browser not installed**
```bash
# Solution: Install Playwright browsers
npx playwright install
```

**Problem: Tests are flaky**
```bash
# Solution: Add explicit waits
await page.waitForSelector('text=Expected Text');
await page.waitForLoadState('networkidle');
```

**Problem: Tests fail on CI but pass locally**
```bash
# Solution: Check for timing issues
# Use Playwright retry functionality
# Ensure CI has proper browser dependencies
npx playwright install --with-deps
```

### General Tips

1. **Run tests in isolation**: Test one file at a time when debugging
   ```bash
   npm test -- specific-test.test.ts
   ```

2. **Use debug mode**:
   ```bash
   # Backend
   node --inspect-brk node_modules/.bin/jest

   # Frontend E2E
   npx playwright test --debug
   ```

3. **Check logs**: Review console output and error messages

4. **Verify environment**: Ensure Node.js version (18+) is correct

5. **Clear cache**: Sometimes old builds cause issues
   ```bash
   # Backend
   rm -rf node_modules dist && npm install

   # Frontend
   rm -rf node_modules .vite && npm install
   ```

## Test Coverage

### Viewing Coverage Reports

```bash
# Backend coverage
cd backend
npm test -- --coverage
# Report: backend/coverage/lcov-report/index.html

# Frontend coverage
cd frontend
npm test -- --coverage
# Report: frontend/coverage/index.html
```

### Coverage Goals

Aim for:
- **Critical paths**: 90%+ coverage
- **API routes**: 80%+ coverage
- **Utilities**: 70%+ coverage
- **UI components**: 60%+ coverage

## Additional Resources

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Playwright Documentation**: https://playwright.dev/docs/intro
- **Vitest Documentation**: https://vitest.dev/guide/
- **Testing Library**: https://testing-library.com/docs/
- **Fast-check (Property Testing)**: https://github.com/dubzzz/fast-check

## Summary

This testing strategy ensures:
- **Backend reliability** through comprehensive unit and integration tests
- **Frontend quality** through E2E testing of critical user workflows
- **Confidence in deployments** through automated test suites
- **Maintainability** through well-structured, isolated tests

Run tests frequently during development and before committing changes!
