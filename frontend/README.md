# Santé Frontend

Modern medical appointment platform frontend built with Next.js 14, React, and TypeScript.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run unit tests
npm test

# Run E2E tests (interactive)
npm run test:e2e

# Run E2E tests (headless)
npm run test:e2e:headless

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js 14 App Router pages
│   │   ├── patient/      # Patient portal pages
│   │   ├── doctor/       # Doctor portal pages
│   │   ├── admin/        # Admin portal pages
│   │   └── ...
│   ├── components/       # Reusable React components
│   │   └── ui/          # UI component library
│   ├── contexts/        # React Context providers
│   ├── lib/             # Utility libraries
│   │   ├── api.ts       # API client
│   │   └── logger.ts    # Frontend logger
│   ├── types/           # TypeScript type definitions
│   └── test/            # Test files and setup
├── docs/                # Documentation
│   └── LOGGER.md        # Logger documentation
├── public/              # Static assets
└── vitest.config.ts     # Test configuration
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **API Client**: Axios
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + React Testing Library
- **Icons**: Lucide React

## 📝 Key Features

### Logging System

The frontend includes a comprehensive logging system for better debugging and monitoring. See [docs/LOGGER.md](./docs/LOGGER.md) for full documentation.

**Quick Example:**
```typescript
import logger from '@/lib/logger';

// Log an error with context
logger.error('Failed to load data', {
  userId: user.id,
  errorMessage: error.message,
}, error);
```

**Features:**
- Environment-aware (dev/production)
- Multiple log levels (error, warn, info, debug)
- Structured logging with context
- Production error storage
- Full TypeScript support

### API Client

Centralized API client with automatic token management and refresh:

```typescript
import api from '@/lib/api';

// Use API methods
const appointments = await api.appointments.list();
const profile = await api.users.me();
```

## 🧪 Testing

The project uses **Vitest** for unit tests and **Cypress** for E2E tests:

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

Current test coverage:
- Logger: 22 tests, 100% pass rate
- Comprehensive test suite for all log levels and contexts

### E2E Tests (Cypress)

```bash
# Run E2E tests interactively
npm run test:e2e

# Run E2E tests in headless mode (CI/CD)
npm run test:e2e:headless

# Run specific test file
npx cypress run --spec "cypress/e2e/auth.cy.ts"

# Run with specific browser
npx cypress run --browser firefox

# Using the helper script
./scripts/run-e2e-tests.sh -b chrome -h
```

**E2E Test Coverage:**
- ✅ **155+ tests** across 10 categories
- ✅ Authentication & Authorization
- ✅ Patient Dashboard (appointments, prescriptions, documents)
- ✅ Doctor Dashboard (patients, consultations, schedules)
- ✅ Admin Dashboard (user management, settings)
- ✅ Navigation & Routing
- ✅ Accessibility (WCAG compliance)
- ✅ Responsive Design (mobile, tablet, desktop)
- ✅ Performance Testing
- ✅ Error Handling
- ✅ Security (XSS, CSRF, injection protection)

**Documentation:**
- [E2E Testing Guide](./TESTING_E2E.md) - Complete E2E testing guide
- [Cypress README](./cypress/README.md) - Detailed Cypress documentation
- [Advanced Examples](./cypress/ADVANCED_EXAMPLES.md) - Advanced testing patterns

## 🏗️ Development

### Phase 2 Components (Current)

✅ **Patient Portal**
- Dashboard
- Profile management
- Doctor search
- Appointment booking
- Medical records viewer
- Prescription management

✅ **Doctor Portal**
- Dashboard with statistics
- Appointment management

✅ **Admin Portal**
- Dashboard with analytics
- User management

### Adding a New Page

1. Create page in appropriate directory:
   ```typescript
   // src/app/patient/new-page/page.tsx
   'use client';
   
   import logger from '@/lib/logger';
   
   export default function NewPage() {
     // Your component code
   }
   ```

2. Add logging for errors:
   ```typescript
   try {
     await api.someCall();
   } catch (error: any) {
     logger.error('Operation failed', {
       userId: user?.id,
       errorMessage: error?.message,
     }, error);
   }
   ```

3. Add tests if needed

### Code Style

- Use TypeScript for all new files
- Follow existing component patterns
- Use the logger instead of console.*
- Add proper error handling with context
- Write tests for critical functionality

## 📦 Building

```bash
# Production build
npm run build

# Start production server
npm start
```

## 🔧 Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📚 Documentation

### Frontend
- [E2E Testing Guide](./TESTING_E2E.md) - Complete E2E testing guide
- [Cypress Documentation](./cypress/README.md) - Cypress setup and usage
- [Advanced Testing Examples](./cypress/ADVANCED_EXAMPLES.md) - Advanced patterns
- [Logger Documentation](./docs/LOGGER.md) - Frontend logging system

### Backend & General
- [API Documentation](../docs/API.md) - Backend API reference
- [Architecture](../docs/ARCHITECTURE.md) - System architecture

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Use the logger for error handling
5. Ensure type safety

## 📄 License

See [LICENSE](../LICENSE) file in the root directory.
