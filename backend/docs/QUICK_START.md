# Quick Start Guide - RRHH System with Prisma

## Get Running in 5 Minutes

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- npm or yarn

### Step 1: Start Database

```bash
docker-compose up -d
```

### Step 2: Install Dependencies & Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
```

### Step 3: Start Server

```bash
npm run dev
```

Server will be available at `http://localhost:3000`

## Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.ec",
    "password": "admin123"
  }'
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Current user (protected)

### Users Management
- `POST /api/users` - Create user (protected)
- `POST /api/users/import` - Bulk import 1-1000 users (protected)
- `GET /api/users` - List all users (protected)
- `GET /api/users/:id` - Get user (protected)
- `PUT /api/users/:id` - Update user (protected)
- `POST /api/users/:id/role` - Change role (protected)

### Demo User
- Email: `admin@hospital.ec`
- Password: `admin123` (auto-generated during setup)
- Role: ADMIN (full permissions)

## Roles & Permissions

### Available Roles
1. **ADMIN** - Full system access
2. **HR_MANAGER** - Employee management, reports, approvals
3. **DEPARTMENT_HEAD** - Team management, attendance review
4. **SUPERVISOR** - Attendance monitoring
5. **EMPLOYEE** - Self-service (vacations, medical leave, absences)

## Key Files

- `src/main.ts` - Server entry point
- `src/modules/auth/auth.service.prisma.ts` - Authentication
- `src/modules/users/users.service.prisma.ts` - User management
- `prisma/schema.prisma` - Database schema
- `docs/PRISMA_INTEGRATION.md` - Detailed Prisma guide
- `docs/ROLES_AND_PERMISSIONS.md` - Complete RBAC documentation

## Development Commands

```bash
# Start development server with auto-reload
npm run dev

# Compile TypeScript
npm run build

# Run TypeScript type checking
npx tsc --noEmit

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (web UI for database)
npx prisma studio

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset
```

## Database Management

```bash
# View database logs
docker-compose logs postgres

# Access PostgreSQL CLI
docker-compose exec postgres psql -U rrhh_user -d rrhh_db

# Stop everything
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## What's Working

- Authentication with JWT (15min access token, 7day refresh token)
- Role-based access control (5 roles, 40+ permissions)
- User CRUD operations and bulk import (up to 1000 users, per-row error reporting)
- Schedules and shift management (multiple schedules per user, supports 24/7 rotation)
- Attendance recording (entry/exit, manual entries, corrections)
- Vacation requests with seniority-based balance calculation
- Medical leave with hourly granularity
- Absence justification workflow
- Biometric device registration and sync endpoints
- Reporting module (dashboard, attendance, vacations, medical leaves, absences, department)
- Password hashing with bcryptjs
- Database persistence with Prisma ORM
- TypeScript strict mode compliance
- Full API documentation (`docs/API_REFERENCE.md`)

## Coming Next

- Physical device SDK integration (ZK Teco / Anviz connector)
- React frontend dashboard
- Automated test suite
- Email notifications
- CI/CD pipeline

## Troubleshooting

**Database won't connect?**
```bash
docker-compose restart postgres
```

**Prisma client out of sync?**
```bash
npx prisma generate
```

**Need to reset everything?**
```bash
docker-compose down -v
docker-compose up -d
npx prisma migrate reset
```

## More Documentation

- `PRISMA_INTEGRATION.md` - Complete Prisma setup & usage
- `ROLES_AND_PERMISSIONS.md` - Detailed RBAC matrix
- `BULK_IMPORT_GUIDE.md` - User migration guide
- `../CLAUDE.md` - Project architecture & requirements

---

**Status:** Backend feature-complete, pending live database validation
**Last Updated:** 2026-09-24
**Branch:** claude/rh-app-ecuador-info-fa5ffp
