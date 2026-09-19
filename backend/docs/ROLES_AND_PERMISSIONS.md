# Sistema de Roles y Permisos (RBAC)

## Descripción General

El sistema RRHH implementa un modelo de Control de Acceso Basado en Roles (RBAC) que proporciona seguridad granular y gestión flexible de permisos. Cada usuario tiene un rol que determina automáticamente sus permisos en el sistema.

---

## Roles Disponibles

### 1. ADMIN (Administrador)
**Descripción:** Acceso total al sistema  
**Permisos:** 40+ permisos (todos)

```
Puede:
✅ Crear, leer, actualizar, eliminar cualquier usuario
✅ Asignar roles y permisos
✅ Importar usuarios masivamente
✅ Visualizar auditoría completa
✅ Acceder al panel de administración
✅ Configurar dispositivos biométricos
✅ Generar reportes personalizados
✅ Realizar backups
✅ Gestionar todos los aspectos del sistema
```

---

### 2. HR_MANAGER (Gerente de RRHH)
**Descripción:** Gestión de personal y reportes  
**Permisos:** 18 permisos

```
Puede:
✅ Crear, leer, actualizar, eliminar empleados
✅ Importar usuarios masivamente (migración)
✅ Registrar asistencia manual
✅ Corregir registros de asistencia
✅ Crear y gestionar horarios/turnos
✅ Aprobar vacaciones y permisos médicos
✅ Visualizar ausencias y justificaciones
✅ Generar reportes de asistencia
✅ Ver auditoría del sistema
✅ Autenticación y logout

No puede:
❌ Crear otros ADMIN
❌ Cambiar su propio rol
❌ Acceder a panel de administración
❌ Configurar dispositivos biométricos
```

---

### 3. DEPARTMENT_HEAD (Jefe de Departamento)
**Descripción:** Aprobaciones de equipo  
**Permisos:** 9 permisos

```
Puede:
✅ Leer empleados del departamento
✅ Ver asistencia del equipo
✅ Corregir asistencia del equipo
✅ Aprobar vacaciones del equipo
✅ Rechazar vacaciones del equipo
✅ Ver y aprobar permisos médicos
✅ Ver y aprobar justificaciones
✅ Generar reportes del departamento
✅ Autenticación y logout

No puede:
❌ Crear nuevos empleados
❌ Eliminar empleados
❌ Cambiar roles
❌ Importar usuarios
❌ Registrar asistencia manual
```

---

### 4. SUPERVISOR (Supervisor)
**Descripción:** Revisión de asistencia  
**Permisos:** 10 permisos

```
Puede:
✅ Leer empleados asignados
✅ Ver asistencia propia y del equipo
✅ Ver vacaciones del equipo
✅ Aprobar vacaciones menores
✅ Ver permisos médicos
✅ Ver y aprobar justificaciones
✅ Generar reportes básicos
✅ Autenticación y logout

No puede:
❌ Crear o eliminar empleados
❌ Registrar asistencia
❌ Cambiar roles
❌ Importar usuarios
❌ Acceder a datos de otros departamentos
```

---

### 5. EMPLOYEE (Empleado)
**Descripción:** Acceso a datos personales  
**Permisos:** 7 permisos

```
Puede:
✅ Ver su propio perfil
✅ Ver su propia asistencia
✅ Solicitar vacaciones
✅ Solicitar permiso médico
✅ Solicitar justificación de falta
✅ Ver reportes propios
✅ Autenticación y logout

No puede:
❌ Ver datos de otros empleados
❌ Aprobar solicitudes
❌ Generar reportes
❌ Acceder a datos del departamento
❌ Cambiar su rol
```

---

## Matriz de Permisos Detallada

| Permiso | Descripción | ADMIN | HR_MGR | DEPT_HEAD | SUPERVISOR | EMPLOYEE |
|---------|-------------|:-----:|:------:|:---------:|:----------:|:--------:|
| **AUTENTICACIÓN** |
| AUTH_LOGIN | Iniciar sesión | ✅ | ✅ | ✅ | ✅ | ✅ |
| AUTH_LOGOUT | Cerrar sesión | ✅ | ✅ | ✅ | ✅ | ✅ |
| AUTH_2FA | Autenticación de dos factores | ✅ | ❌ | ❌ | ❌ | ❌ |
| **GESTIÓN DE USUARIOS** |
| USERS_CREATE | Crear usuarios | ✅ | ❌ | ❌ | ❌ | ❌ |
| USERS_READ | Leer usuarios | ✅ | ✅ | ✅ | ✅ | ✅ |
| USERS_UPDATE | Actualizar usuarios | ✅ | ✅ | ❌ | ❌ | ❌ |
| USERS_DELETE | Eliminar/desactivar usuarios | ✅ | ✅ | ❌ | ❌ | ❌ |
| USERS_EXPORT | Exportar datos de usuarios | ✅ | ✅ | ❌ | ❌ | ❌ |
| USERS_IMPORT | Importar usuarios (migración) | ✅ | ✅ | ❌ | ❌ | ❌ |
| **GESTIÓN DE EMPLEADOS** |
| EMPLOYEES_CREATE | Crear empleados | ✅ | ✅ | ❌ | ❌ | ❌ |
| EMPLOYEES_READ | Leer empleados | ✅ | ✅ | ✅ | ✅ | ✅ |
| EMPLOYEES_UPDATE | Actualizar empleados | ✅ | ✅ | ❌ | ❌ | ❌ |
| EMPLOYEES_DELETE | Eliminar empleados | ✅ | ✅ | ❌ | ❌ | ❌ |
| EMPLOYEES_VIEW_BIOMETRIC | Ver datos biométricos | ✅ | ✅ | ❌ | ❌ | ❌ |
| **GESTIÓN DE ROLES** |
| ROLES_MANAGE | Gestionar roles y permisos | ✅ | ❌ | ❌ | ❌ | ❌ |
| ROLES_ASSIGN | Asignar roles a usuarios | ✅ | ✅ | ❌ | ❌ | ❌ |
| **ASISTENCIA** |
| ATTENDANCE_VIEW | Ver registros de asistencia | ✅ | ✅ | ✅ | ✅ | ✅ |
| ATTENDANCE_RECORD | Registrar asistencia (biométrica) | ✅ | ✅ | ❌ | ❌ | ❌ |
| ATTENDANCE_MANUAL | Registrar asistencia manual | ✅ | ✅ | ❌ | ❌ | ❌ |
| ATTENDANCE_CORRECT | Corregir registros de asistencia | ✅ | ✅ | ✅ | ❌ | ❌ |
| ATTENDANCE_EXPORT | Exportar registros de asistencia | ✅ | ✅ | ❌ | ❌ | ❌ |
| **DISPOSITIVOS BIOMÉTRICOS** |
| DEVICES_MANAGE | Gestionar dispositivos biométricos | ✅ | ❌ | ❌ | ❌ | ❌ |
| DEVICES_SYNC | Sincronizar dispositivos | ✅ | ❌ | ❌ | ❌ | ❌ |
| DEVICES_CONFIG | Configurar dispositivos | ✅ | ❌ | ❌ | ❌ | ❌ |
| **HORARIOS Y TURNOS** |
| SCHEDULES_CREATE | Crear horarios | ✅ | ✅ | ❌ | ❌ | ❌ |
| SCHEDULES_READ | Ver horarios | ✅ | ✅ | ✅ | ✅ | ✅ |
| SCHEDULES_UPDATE | Actualizar horarios | ✅ | ✅ | ❌ | ❌ | ❌ |
| SCHEDULES_DELETE | Eliminar horarios | ✅ | ✅ | ❌ | ❌ | ❌ |
| **VACACIONES** |
| VACATIONS_REQUEST | Solicitar vacaciones | ✅ | ✅ | ✅ | ✅ | ✅ |
| VACATIONS_APPROVE | Aprobar vacaciones | ✅ | ✅ | ✅ | ✅ | ❌ |
| VACATIONS_REJECT | Rechazar vacaciones | ✅ | ✅ | ✅ | ✅ | ❌ |
| VACATIONS_VIEW | Ver vacaciones | ✅ | ✅ | ✅ | ✅ | ✅ |
| **PERMISOS MÉDICOS** |
| MEDICAL_LEAVES_REQUEST | Solicitar permiso médico | ✅ | ✅ | ✅ | ✅ | ✅ |
| MEDICAL_LEAVES_APPROVE | Aprobar permiso médico | ✅ | ✅ | ✅ | ✅ | ❌ |
| MEDICAL_LEAVES_VIEW | Ver permisos médicos | ✅ | ✅ | ✅ | ✅ | ✅ |
| **JUSTIFICACIONES** |
| ABSENCES_REQUEST | Solicitar justificación | ✅ | ✅ | ✅ | ✅ | ✅ |
| ABSENCES_APPROVE | Aprobar justificación | ✅ | ✅ | ✅ | ✅ | ❌ |
| ABSENCES_VIEW | Ver justificaciones | ✅ | ✅ | ✅ | ✅ | ✅ |
| **REPORTES** |
| REPORTS_VIEW | Ver reportes | ✅ | ✅ | ✅ | ✅ | ✅ |
| REPORTS_GENERATE | Generar reportes | ✅ | ✅ | ✅ | ✅ | ❌ |
| REPORTS_EXPORT | Exportar reportes | ✅ | ✅ | ❌ | ❌ | ❌ |
| REPORTS_CUSTOM | Crear reportes personalizados | ✅ | ✅ | ❌ | ❌ | ❌ |
| **AUDITORÍA** |
| AUDIT_VIEW | Ver logs de auditoría | ✅ | ✅ | ❌ | ❌ | ❌ |
| AUDIT_EXPORT | Exportar auditoría | ✅ | ✅ | ❌ | ❌ | ❌ |
| **ADMINISTRACIÓN** |
| ADMIN_PANEL | Acceder panel de administración | ✅ | ❌ | ❌ | ❌ | ❌ |
| ADMIN_CONFIG | Configurar sistema | ✅ | ❌ | ❌ | ❌ | ❌ |
| ADMIN_BACKUP | Realizar backups | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Cómo Funciona el Sistema

### 1. Autenticación
```
Usuario → Login (email/password) → JWT Token → Incluye rol + permisos
```

### 2. Verificación de Permisos
```
Request → Middleware → Valida JWT → Verifica permiso → ✅ Acceso o ❌ Rechaza
```

### 3. Asignación de Permisos en Importación
```
Importar Usuario (rol: EMPLOYEE) → Sistema asigna automáticamente 7 permisos
```

---

## Endpoints de Gestión de Roles

### Cambiar rol de usuario

```bash
POST /api/users/:id/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "newRole": "HR_MANAGER"
}
```

**Respuesta:**
```json
{
  "status": "success",
  "message": "Rol actualizado",
  "data": {
    "user": {
      "id": "user-123",
      "email": "juan@hospital.ec",
      "role": "HR_MANAGER",
      "permissions": [
        "auth:login",
        "auth:logout",
        "employees:create",
        "employees:read",
        "employees:update",
        "employees:delete",
        "users:import",
        "attendance:view",
        "attendance:manual",
        "attendance:correct",
        "schedules:create",
        "schedules:read",
        "schedules:update",
        "schedules:delete",
        "vacations:request",
        "vacations:approve",
        "vacations:reject",
        "vacations:view",
        "medical_leaves:request",
        "medical_leaves:approve",
        "medical_leaves:view",
        "absences:approve",
        "absences:view",
        "reports:view",
        "reports:generate",
        "reports:export",
        "audit:view"
      ]
    }
  }
}
```

### Obtener usuario con sus permisos

```bash
GET /api/users/:id
Authorization: Bearer <token>
```

### Listar usuarios por rol

```bash
GET /api/users/role/EMPLOYEE
Authorization: Bearer <token>
```

---

## Ejemplo Práctico: Migración de Roles

### Caso: Importar empleados desde DINAWEB

```bash
# 1. Autenticarse como ADMIN
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.ec",
    "password": "admin123"
  }'

# 2. Importar 100 empleados (cada uno recibe rol EMPLOYEE automáticamente)
curl -X POST http://localhost:3000/api/users/import \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d @empleados.json

# 3. Después, cambiar algunos a SUPERVISOR
curl -X POST http://localhost:3000/api/users/user-123/role \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "newRole": "SUPERVISOR" }'
```

---

## Flujo de Permisos en Acción

### Escenario: HR_MANAGER intenta crear nuevo usuario

```
1. HR_MANAGER hace login
   ↓
2. JWT generado con: role: "HR_MANAGER", permissions: [18 permisos]
   ↓
3. POST /api/users requiere: Permission.USERS_CREATE ❌ (no incluido en HR_MANAGER)
   ↓
4. Sistema verifica: usuario tiene permiso?
   → NO, respuesta: 403 Forbidden "Permiso insuficiente"
```

### Escenario: HR_MANAGER intenta importar usuarios

```
1. HR_MANAGER hace login
   ↓
2. JWT generado con: role: "HR_MANAGER", permissions: [18 permisos]
   ↓
3. POST /api/users/import requiere: Permission.USERS_IMPORT ✅ (incluido en HR_MANAGER)
   ↓
4. Sistema verifica: usuario tiene permiso?
   → SÍ, procede con importación
   ↓
5. Importa 100 usuarios, cada uno con rol EMPLOYEE + 7 permisos
```

---

## Políticas de Seguridad

### 1. Principio de Menor Privilegio
- Cada rol tiene **solo** los permisos necesarios
- No se otorgan permisos "por si acaso"

### 2. No se puede auto-promocionar
- Un usuario no puede cambiar su propio rol
- Requiere ADMIN o superior

### 3. Auditoría de cambios
- Todo cambio de rol se registra: `[AUDIT] Cambio de rol para usuario X: EMPLOYEE → SUPERVISOR`
- Permite rastrear quién cambió qué y cuándo

### 4. Separación de responsabilidades
- ADMIN: Configuración y seguridad
- HR_MANAGER: Gestión de personal
- DEPARTMENT_HEAD: Aprobaciones
- SUPERVISOR: Monitoreo
- EMPLOYEE: Autoservicio

---

## Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| "Permiso insuficiente" en /api/users | No tienes USERS_CREATE | Pide al ADMIN que te asigne rol HR_MANAGER |
| No puedo cambiar mi propio rol | Política de seguridad | Solicita a ADMIN que cambie tu rol |
| No veo empleados de otros departamentos | Eres DEPARTMENT_HEAD | Solo ves tu departamento por diseño |
| Token expirado | Sesión de 15 min | Usa /api/auth/refresh con el refresh token |
| No aparece permiso después de cambiar rol | Cache | Cierra sesión y vuelve a iniciar sesión |

---

## Próximas Implementaciones

- [ ] 2FA para ADMIN
- [ ] Roles personalizados (custom roles)
- [ ] Expiración de permisos temporales
- [ ] Permisos a nivel de registro (fila)
- [ ] Auditoría completa de todas las acciones
- [ ] Dashboard de control de acceso

---

## Referencia Rápida de Permisos por Tarea

**Necesito importar usuarios:**
→ Rol: HR_MANAGER | Permiso: USERS_IMPORT

**Necesito aprobar vacaciones:**
→ Rol: DEPARTMENT_HEAD+ | Permiso: VACATIONS_APPROVE

**Necesito ver auditoría:**
→ Rol: ADMIN o HR_MANAGER | Permiso: AUDIT_VIEW

**Necesito generar reportes personalizados:**
→ Rol: ADMIN o HR_MANAGER | Permiso: REPORTS_CUSTOM

**Necesito cambiar rol de empleado:**
→ Rol: ADMIN | Permiso: ROLES_ASSIGN
