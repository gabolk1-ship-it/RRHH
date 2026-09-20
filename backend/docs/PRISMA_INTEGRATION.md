# Prisma ORM Integration Guide

## Overview

The RRHH system has been fully integrated with Prisma ORM, providing a complete database abstraction layer using PostgreSQL.

## Architecture

### Service Layer Structure

```
src/modules/
├── auth/
│   ├── auth.service.ts (mock/in-memory)
│   ├── auth.service.prisma.ts (database-backed) ✓ ACTIVE
│   ├── auth.controller.ts
│   └── ...
├── users/
│   ├── users.service.ts (mock/in-memory)
│   ├── users.service.prisma.ts (database-backed) ✓ ACTIVE
│   ├── users.controller.ts
│   └── ...
```

### Database Configuration

**File:** `backend/.env`

```bash
DATABASE_URL=postgresql://rrhh_user:rrhh_password_dev@localhost:5432/rrhh_db
BCRYPT_ROUNDS=10
JWT_SECRET=dev-secret-key-change-in-production-12345678
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production-87654321
```

## Setup Instructions

### 1. Start PostgreSQL Database

```bash
# From project root
docker-compose up -d

# Verify database is running
docker-compose ps
```

### 2. Generate Prisma Client

```bash
cd backend
npx prisma generate
```

### 3. Run Migrations

```bash
# Create initial schema
npx prisma migrate dev --name init

# View Prisma Studio (optional - web UI for data management)
npx prisma studio
```

### 4. Seed Database (Optional)

```bash
# Create test data
npm run db:seed
```

### 5. Start Server

```bash
npm run dev
```

## Database Schema

### User Model

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  firstName     String
  lastName      String
  passwordHash  String
  role          UserRole  @default(EMPLOYEE)
  active        Boolean   @default(true)
  departmentId  String?
  employeeId    String?   @unique
  lastLogin     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Other Models

- **AttendanceRecord**: Track entry/exit times
- **Schedule**: Employee shift schedules
- **Vacation**: Vacation requests and approvals
- **MedicalLeave**: Medical leave with hourly granularity
- **Absence**: Absence justifications
- **BiometricDevice**: Biometric device registration
- **AuditLog**: Complete audit trail

## Service API

### Authentication Service (Prisma)

**File:** `src/modules/auth/auth.service.prisma.ts`

```typescript
// Login with database persistence
const result = await authService.login(email, password);
// Returns: { user, tokens }

// Register new user
const newUser = await authService.register(
  email, 
  password, 
  firstName, 
  lastName, 
  role
);

// Refresh access token
const newTokens = await authService.refreshAccessToken(refreshToken);

// Get user data
const user = await authService.getUserById(userId);
```

### Users Service (Prisma)

**File:** `src/modules/users/users.service.prisma.ts`

```typescript
// Create single user
const user = await usersService.createUser({
  email: 'user@hospital.ec',
  firstName: 'Juan',
  lastName: 'Pérez',
  password: 'secure-password',
  role: UserRole.EMPLOYEE,
  departmentId: 'dept-123'
});

// Bulk import (up to 1000 users)
const result = await usersService.importMultipleUsers(users);
// Returns: { total, successful, failed, errors[], users[] }

// Get user by ID
const user = await usersService.getUserById(userId);

// List all users with pagination
const { users, total } = await usersService.listUsers(limit, offset);

// Update user
const updated = await usersService.updateUser(userId, updates);

// Change user role
const updated = await usersService.changeUserRole(userId, newRole);

// Deactivate/Activate user
await usersService.deactivateUser(userId);
await usersService.activateUser(userId);

// Get users by role
const employees = await usersService.getUsersByRole(UserRole.EMPLOYEE);
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user  
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (protected)
- `GET /api/auth/me` - Get current user (protected)

### Users

- `POST /api/users` - Create user (requires USERS_CREATE permission)
- `POST /api/users/import` - Bulk import (requires USERS_IMPORT permission)
- `GET /api/users` - List users (requires USERS_READ permission)
- `GET /api/users/:id` - Get user (requires USERS_READ permission)
- `PUT /api/users/:id` - Update user (requires USERS_UPDATE permission)
- `POST /api/users/:id/role` - Change role (requires ROLES_ASSIGN permission)
- `POST /api/users/:id/deactivate` - Deactivate (requires USERS_DELETE permission)
- `POST /api/users/:id/activate` - Activate (requires USERS_DELETE permission)
- `GET /api/users/role/:role` - Get users by role (requires USERS_READ permission)

## Testing

### Test User Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.ec",
    "password": "admin123"
  }'
```

### Test Bulk Import

```bash
curl -X POST http://localhost:3000/api/users/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "users": [
      {
        "email": "juan@hospital.ec",
        "firstName": "Juan",
        "lastName": "Pérez",
        "role": "EMPLOYEE",
        "employeeId": "EMP001"
      }
    ]
  }'
```

## Migration Management

### Create Migration

```bash
npx prisma migrate dev --name <migration_name>
```

### Reset Database

```bash
npx prisma migrate reset
```

### View Migration Status

```bash
npx prisma migrate status
```

## Troubleshooting

### Database Connection Failed

**Error:** `Can't reach database server at localhost:5432`

**Solution:**
```bash
docker-compose ps
docker-compose logs postgres
docker-compose restart postgres
```

### Prisma Client Out of Sync

```bash
npx prisma generate
```

### Reset Everything

```bash
docker-compose down -v
docker-compose up -d
npx prisma migrate reset
npm run dev
```

## Performance Optimization

### Queries Indexed

- `User.role` - For role-based queries
- `User.active` - For active user filtering
- `AttendanceRecord.userId` + `AttendanceRecord.date` - For attendance lookups
- `Schedule.userId` - For schedule retrieval
- All status fields - `Vacation.status`, `MedicalLeave.status`, `Absence.status`

### Best Practices

1. **Always paginate** - Use `take` and `skip` for large result sets
2. **Selective queries** - Only request needed fields
3. **Use transactions** - For multi-table operations
4. **Enable query logging** - In development for debugging

## Production Deployment

### Environment Variables

Update for production:

```bash
DATABASE_URL=postgresql://prod_user:prod_secure_password@prod-host:5432/rrhh_prod
NODE_ENV=production
JWT_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>
```

### Database Backup

```bash
docker-compose exec postgres pg_dump -U rrhh_user rrhh_db > backup.sql
```

### Database Restore

```bash
docker-compose exec -T postgres psql -U rrhh_user rrhh_db < backup.sql
```

## Next Steps

1. Implement attendance recording service
2. Create vacation/medical leave management services
3. Build reporting module
4. Integrate with biometric devices
5. Create frontend dashboard

## Support

For issues or questions, refer to:
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- Project CLAUDE.md for architecture overview
