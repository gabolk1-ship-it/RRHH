/**
 * RBAC - Role Based Access Control
 * Sistema de roles y permisos para Hospital 24h
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  HR_MANAGER = 'HR_MANAGER',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  SUPERVISOR = 'SUPERVISOR',
  EMPLOYEE = 'EMPLOYEE'
}

export enum Permission {
  // Autenticación
  AUTH_LOGIN = 'auth:login',
  AUTH_LOGOUT = 'auth:logout',
  AUTH_2FA = 'auth:2fa',

  // Gestión de Usuarios
  USERS_CREATE = 'users:create',
  USERS_READ = 'users:read',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',
  USERS_EXPORT = 'users:export',
  USERS_IMPORT = 'users:import',

  // Gestión de Empleados
  EMPLOYEES_CREATE = 'employees:create',
  EMPLOYEES_READ = 'employees:read',
  EMPLOYEES_UPDATE = 'employees:update',
  EMPLOYEES_DELETE = 'employees:delete',
  EMPLOYEES_VIEW_BIOMETRIC = 'employees:view_biometric',

  // Gestión de Roles
  ROLES_MANAGE = 'roles:manage',
  ROLES_ASSIGN = 'roles:assign',

  // Asistencia
  ATTENDANCE_VIEW = 'attendance:view',
  ATTENDANCE_RECORD = 'attendance:record',
  ATTENDANCE_MANUAL = 'attendance:manual',
  ATTENDANCE_CORRECT = 'attendance:correct',
  ATTENDANCE_EXPORT = 'attendance:export',

  // Dispositivos Biométricos
  DEVICES_MANAGE = 'devices:manage',
  DEVICES_SYNC = 'devices:sync',
  DEVICES_CONFIG = 'devices:config',

  // Horarios y Turnos
  SCHEDULES_CREATE = 'schedules:create',
  SCHEDULES_READ = 'schedules:read',
  SCHEDULES_UPDATE = 'schedules:update',
  SCHEDULES_DELETE = 'schedules:delete',

  // Vacaciones
  VACATIONS_REQUEST = 'vacations:request',
  VACATIONS_APPROVE = 'vacations:approve',
  VACATIONS_REJECT = 'vacations:reject',
  VACATIONS_VIEW = 'vacations:view',

  // Permisos Médicos
  MEDICAL_LEAVES_REQUEST = 'medical_leaves:request',
  MEDICAL_LEAVES_APPROVE = 'medical_leaves:approve',
  MEDICAL_LEAVES_VIEW = 'medical_leaves:view',

  // Justificaciones
  ABSENCES_REQUEST = 'absences:request',
  ABSENCES_APPROVE = 'absences:approve',
  ABSENCES_VIEW = 'absences:view',

  // Reportes
  REPORTS_VIEW = 'reports:view',
  REPORTS_GENERATE = 'reports:generate',
  REPORTS_EXPORT = 'reports:export',
  REPORTS_CUSTOM = 'reports:custom',

  // Auditoría
  AUDIT_VIEW = 'audit:view',
  AUDIT_EXPORT = 'audit:export',

  // Administración
  ADMIN_PANEL = 'admin:panel',
  ADMIN_CONFIG = 'admin:config',
  ADMIN_BACKUP = 'admin:backup'
}

export interface RolePermissions {
  [key in UserRole]: Permission[];
}

/**
 * Matriz de permisos por rol
 * Define qué permisos tiene cada rol
 */
export const ROLE_PERMISSIONS: RolePermissions = {
  [UserRole.ADMIN]: [
    // ADMIN tiene todos los permisos
    ...Object.values(Permission)
  ],

  [UserRole.HR_MANAGER]: [
    // Login y autenticación
    Permission.AUTH_LOGIN,
    Permission.AUTH_LOGOUT,

    // Gestión de empleados
    Permission.EMPLOYEES_CREATE,
    Permission.EMPLOYEES_READ,
    Permission.EMPLOYEES_UPDATE,
    Permission.EMPLOYEES_DELETE,
    Permission.EMPLOYEES_EXPORT,
    Permission.USERS_IMPORT,

    // Asistencia
    Permission.ATTENDANCE_VIEW,
    Permission.ATTENDANCE_MANUAL,
    Permission.ATTENDANCE_CORRECT,
    Permission.ATTENDANCE_EXPORT,

    // Horarios
    Permission.SCHEDULES_CREATE,
    Permission.SCHEDULES_READ,
    Permission.SCHEDULES_UPDATE,
    Permission.SCHEDULES_DELETE,

    // Vacaciones
    Permission.VACATIONS_REQUEST,
    Permission.VACATIONS_APPROVE,
    Permission.VACATIONS_REJECT,
    Permission.VACATIONS_VIEW,

    // Permisos médicos
    Permission.MEDICAL_LEAVES_REQUEST,
    Permission.MEDICAL_LEAVES_APPROVE,
    Permission.MEDICAL_LEAVES_VIEW,

    // Justificaciones
    Permission.ABSENCES_APPROVE,
    Permission.ABSENCES_VIEW,

    // Reportes
    Permission.REPORTS_VIEW,
    Permission.REPORTS_GENERATE,
    Permission.REPORTS_EXPORT,

    // Auditoría
    Permission.AUDIT_VIEW
  ],

  [UserRole.DEPARTMENT_HEAD]: [
    // Login y autenticación
    Permission.AUTH_LOGIN,
    Permission.AUTH_LOGOUT,

    // Lectura de empleados del departamento
    Permission.EMPLOYEES_READ,

    // Asistencia del equipo
    Permission.ATTENDANCE_VIEW,
    Permission.ATTENDANCE_CORRECT,

    // Vacaciones - aprobación
    Permission.VACATIONS_VIEW,
    Permission.VACATIONS_APPROVE,
    Permission.VACATIONS_REJECT,

    // Permisos médicos
    Permission.MEDICAL_LEAVES_VIEW,
    Permission.MEDICAL_LEAVES_APPROVE,

    // Justificaciones
    Permission.ABSENCES_APPROVE,
    Permission.ABSENCES_VIEW,

    // Reportes
    Permission.REPORTS_VIEW,
    Permission.REPORTS_GENERATE
  ],

  [UserRole.SUPERVISOR]: [
    // Login y autenticación
    Permission.AUTH_LOGIN,
    Permission.AUTH_LOGOUT,

    // Lectura de empleados
    Permission.EMPLOYEES_READ,

    // Asistencia
    Permission.ATTENDANCE_VIEW,

    // Vacaciones
    Permission.VACATIONS_VIEW,
    Permission.VACATIONS_APPROVE,

    // Permisos médicos
    Permission.MEDICAL_LEAVES_VIEW,

    // Justificaciones
    Permission.ABSENCES_VIEW,
    Permission.ABSENCES_APPROVE,

    // Reportes básicos
    Permission.REPORTS_VIEW,
    Permission.REPORTS_GENERATE
  ],

  [UserRole.EMPLOYEE]: [
    // Login y autenticación
    Permission.AUTH_LOGIN,
    Permission.AUTH_LOGOUT,

    // Ver datos propios
    Permission.EMPLOYEES_READ, // solo su perfil

    // Asistencia propia
    Permission.ATTENDANCE_VIEW, // solo propia

    // Solicitudes propias
    Permission.VACATIONS_REQUEST,
    Permission.MEDICAL_LEAVES_REQUEST,
    Permission.ABSENCES_REQUEST,

    // Ver propios reportes
    Permission.REPORTS_VIEW // solo propios
  ]
};

/**
 * Describir el rol de un usuario
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador - Acceso total al sistema',
  [UserRole.HR_MANAGER]: 'Gerente de RRHH - Gestión de personal y reportes',
  [UserRole.DEPARTMENT_HEAD]: 'Jefe de Departamento - Aprobaciones de equipo',
  [UserRole.SUPERVISOR]: 'Supervisor - Revisión de asistencia',
  [UserRole.EMPLOYEE]: 'Empleado - Acceso a datos personales'
};

export interface UserWithRoles {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  active: boolean;
  createdAt: Date;
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
}
