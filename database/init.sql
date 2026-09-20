-- RRHH Database Schema
-- Sistema de Control de Asistencia Biométrica - Hospital 24h

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
  active BOOLEAN DEFAULT true,
  departmentId VARCHAR(100),
  employeeId VARCHAR(100) UNIQUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastLogin TIMESTAMP
);

-- Create index for email lookup
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);

-- Create attendance records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entryTime TIMESTAMP NOT NULL,
  exitTime TIMESTAMP,
  date DATE NOT NULL,
  isManual BOOLEAN DEFAULT false,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_userId ON attendance_records(userId);
CREATE INDEX idx_attendance_date ON attendance_records(date);

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  startTime TIME NOT NULL,
  endTime TIME NOT NULL,
  monday BOOLEAN DEFAULT true,
  tuesday BOOLEAN DEFAULT true,
  wednesday BOOLEAN DEFAULT true,
  thursday BOOLEAN DEFAULT true,
  friday BOOLEAN DEFAULT true,
  saturday BOOLEAN DEFAULT false,
  sunday BOOLEAN DEFAULT false,
  startDate DATE,
  endDate DATE,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedules_userId ON schedules(userId);
CREATE INDEX idx_schedules_active ON schedules(isActive);

-- Create vacations table
CREATE TABLE IF NOT EXISTS vacations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  approvedBy UUID REFERENCES users(id),
  approvalDate TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vacations_userId ON vacations(userId);
CREATE INDEX idx_vacations_status ON vacations(status);

-- Create medical leaves table
CREATE TABLE IF NOT EXISTS medical_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  startDate DATE NOT NULL,
  startTime TIME,
  endDate DATE NOT NULL,
  endTime TIME,
  reason TEXT NOT NULL,
  certificateUrl VARCHAR(500),
  status VARCHAR(50) DEFAULT 'PENDING',
  approvedBy UUID REFERENCES users(id),
  approvalDate TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medical_leaves_userId ON medical_leaves(userId);
CREATE INDEX idx_medical_leaves_status ON medical_leaves(status);

-- Create absences (justifications) table
CREATE TABLE IF NOT EXISTS absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  absenceDate DATE NOT NULL,
  reason TEXT NOT NULL,
  documentUrl VARCHAR(500),
  status VARCHAR(50) DEFAULT 'PENDING',
  approvedBy UUID REFERENCES users(id),
  approvalDate TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_absences_userId ON absences(userId);
CREATE INDEX idx_absences_status ON absences(status);

-- Create biometric devices table
CREATE TABLE IF NOT EXISTS biometric_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  deviceType VARCHAR(50) NOT NULL,
  serialNumber VARCHAR(100) UNIQUE,
  ipAddress VARCHAR(50),
  location VARCHAR(100),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  lastSync TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entityType VARCHAR(50),
  entityId VARCHAR(255),
  changes JSONB,
  ipAddress VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_userId ON audit_logs(userId);
CREATE INDEX idx_audit_logs_createdAt ON audit_logs(createdAt);

-- Insert default admin user
INSERT INTO users (
  id, email, firstName, lastName, passwordHash, role, active, createdAt, updatedAt
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'admin@hospital.ec',
  'Admin',
  'System',
  '$2a$10$N9qo8ucoathUSc4V8D6p2u2c/KVRxjgF0gBIJRfGNsqPJHqXEw4jy', -- bcryptjs hash of "admin123"
  'ADMIN',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert all permissions
INSERT INTO permissions (name, description) VALUES
('auth:login', 'Iniciar sesión'),
('auth:logout', 'Cerrar sesión'),
('auth:2fa', 'Autenticación de dos factores'),
('users:create', 'Crear usuarios'),
('users:read', 'Leer usuarios'),
('users:update', 'Actualizar usuarios'),
('users:delete', 'Eliminar usuarios'),
('users:export', 'Exportar usuarios'),
('users:import', 'Importar usuarios'),
('employees:create', 'Crear empleados'),
('employees:read', 'Leer empleados'),
('employees:update', 'Actualizar empleados'),
('employees:delete', 'Eliminar empleados'),
('employees:view_biometric', 'Ver datos biométricos'),
('roles:manage', 'Gestionar roles'),
('roles:assign', 'Asignar roles'),
('attendance:view', 'Ver asistencia'),
('attendance:record', 'Registrar asistencia'),
('attendance:manual', 'Registrar asistencia manual'),
('attendance:correct', 'Corregir asistencia'),
('attendance:export', 'Exportar asistencia'),
('devices:manage', 'Gestionar dispositivos'),
('devices:sync', 'Sincronizar dispositivos'),
('devices:config', 'Configurar dispositivos'),
('schedules:create', 'Crear horarios'),
('schedules:read', 'Leer horarios'),
('schedules:update', 'Actualizar horarios'),
('schedules:delete', 'Eliminar horarios'),
('vacations:request', 'Solicitar vacaciones'),
('vacations:approve', 'Aprobar vacaciones'),
('vacations:reject', 'Rechazar vacaciones'),
('vacations:view', 'Ver vacaciones'),
('medical_leaves:request', 'Solicitar permiso médico'),
('medical_leaves:approve', 'Aprobar permiso médico'),
('medical_leaves:view', 'Ver permisos médicos'),
('absences:request', 'Solicitar justificación'),
('absences:approve', 'Aprobar justificación'),
('absences:view', 'Ver justificaciones'),
('reports:view', 'Ver reportes'),
('reports:generate', 'Generar reportes'),
('reports:export', 'Exportar reportes'),
('reports:custom', 'Crear reportes personalizados'),
('audit:view', 'Ver auditoría'),
('audit:export', 'Exportar auditoría'),
('admin:panel', 'Acceder panel de administración'),
('admin:config', 'Configurar sistema'),
('admin:backup', 'Realizar backups')
ON CONFLICT (name) DO NOTHING;

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,
  permissionName VARCHAR(100) NOT NULL,
  PRIMARY KEY (role, permissionName)
);

-- Insert role permissions
INSERT INTO role_permissions (role, permissionName) VALUES
-- ADMIN: todos los permisos
('ADMIN', 'auth:login'),
('ADMIN', 'auth:logout'),
('ADMIN', 'auth:2fa'),
('ADMIN', 'users:create'),
('ADMIN', 'users:read'),
('ADMIN', 'users:update'),
('ADMIN', 'users:delete'),
('ADMIN', 'users:export'),
('ADMIN', 'users:import'),
('ADMIN', 'employees:create'),
('ADMIN', 'employees:read'),
('ADMIN', 'employees:update'),
('ADMIN', 'employees:delete'),
('ADMIN', 'employees:view_biometric'),
('ADMIN', 'roles:manage'),
('ADMIN', 'roles:assign'),
('ADMIN', 'attendance:view'),
('ADMIN', 'attendance:record'),
('ADMIN', 'attendance:manual'),
('ADMIN', 'attendance:correct'),
('ADMIN', 'attendance:export'),
('ADMIN', 'devices:manage'),
('ADMIN', 'devices:sync'),
('ADMIN', 'devices:config'),
('ADMIN', 'schedules:create'),
('ADMIN', 'schedules:read'),
('ADMIN', 'schedules:update'),
('ADMIN', 'schedules:delete'),
('ADMIN', 'vacations:request'),
('ADMIN', 'vacations:approve'),
('ADMIN', 'vacations:reject'),
('ADMIN', 'vacations:view'),
('ADMIN', 'medical_leaves:request'),
('ADMIN', 'medical_leaves:approve'),
('ADMIN', 'medical_leaves:view'),
('ADMIN', 'absences:request'),
('ADMIN', 'absences:approve'),
('ADMIN', 'absences:view'),
('ADMIN', 'reports:view'),
('ADMIN', 'reports:generate'),
('ADMIN', 'reports:export'),
('ADMIN', 'reports:custom'),
('ADMIN', 'audit:view'),
('ADMIN', 'audit:export'),
('ADMIN', 'admin:panel'),
('ADMIN', 'admin:config'),
('ADMIN', 'admin:backup')
ON CONFLICT DO NOTHING;
