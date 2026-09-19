# Guía de Importación Masiva de Usuarios

## Descripción

El sistema RRHH proporciona un endpoint `/api/users/import` que permite migrar múltiples usuarios desde sistemas antiguos (como DINAWEB, Evolution) hacia la plataforma de control biométrico. Soporta hasta 1,000 usuarios por importación con reporte detallado de errores por fila.

---

## Características

✅ **Importación masiva:** Hasta 1,000 usuarios por solicitud  
✅ **Validación individual:** Cada usuario se valida por separado  
✅ **Reporte detallado:** Errores por fila (número de fila, email, mensaje de error)  
✅ **Transacciones parciales:** Los usuarios válidos se crean incluso si otros fallan  
✅ **Permisos basados en roles:** Solo usuarios con permiso `USERS_IMPORT` pueden importar  
✅ **Asignación automática de roles:** Define rol por usuario en la importación  

---

## Autenticación Requerida

Antes de importar, necesitas autenticarte como usuario con permiso `USERS_IMPORT` (HR_MANAGER o ADMIN):

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.ec",
    "password": "admin123"
  }'
```

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "admin-1",
      "email": "admin@hospital.ec",
      "firstName": "Admin",
      "lastName": "System",
      "role": "ADMIN",
      "active": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

Usa el `accessToken` en el header `Authorization: Bearer <accessToken>` para las siguientes solicitudes.

---

## Endpoint de Importación

### Ruta
```
POST /api/users/import
```

### Headers Requeridos
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Estructura de Solicitud

```json
{
  "users": [
    {
      "email": "juan.perez@hospital.ec",
      "firstName": "Juan",
      "lastName": "Pérez García",
      "role": "EMPLOYEE",
      "departmentId": "dept-001",
      "employeeId": "EMP0001",
      "password": "TempPassword123!" 
    },
    {
      "email": "maria.lopez@hospital.ec",
      "firstName": "Maria",
      "lastName": "López Rodríguez",
      "role": "SUPERVISOR",
      "departmentId": "dept-002",
      "employeeId": "EMP0002"
    }
  ]
}
```

### Validaciones

Cada usuario **debe** tener:
- ✅ `email` - Válido y único en el sistema
- ✅ `firstName` - Mínimo 2 caracteres
- ✅ `lastName` - Mínimo 2 caracteres
- ✅ `role` - Uno de: `ADMIN`, `HR_MANAGER`, `DEPARTMENT_HEAD`, `SUPERVISOR`, `EMPLOYEE`

Campos opcionales:
- `password` - Si no se proporciona, se genera una contraseña aleatoria de 12 caracteres
- `departmentId` - Para asociar a un departamento
- `employeeId` - ID del empleado en el sistema antiguo (opcional pero recomendado para auditoría)

### Respuesta Exitosa

```json
{
  "status": "success",
  "message": "Importación completada: 2 usuarios creados, 0 errores",
  "data": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "errors": [],
    "users": [
      {
        "id": "uuid-1",
        "email": "juan.perez@hospital.ec",
        "firstName": "Juan",
        "lastName": "Pérez García",
        "role": "EMPLOYEE",
        "permissions": [
          "auth:login",
          "auth:logout",
          "employees:read",
          "attendance:view",
          "vacations:request",
          "medical_leaves:request",
          "absences:request",
          "reports:view"
        ],
        "active": true,
        "createdAt": "2026-09-19T10:30:00Z",
        "updatedAt": "2026-09-19T10:30:00Z"
      },
      {
        "id": "uuid-2",
        "email": "maria.lopez@hospital.ec",
        "firstName": "Maria",
        "lastName": "López Rodríguez",
        "role": "SUPERVISOR",
        "permissions": [
          "auth:login",
          "auth:logout",
          "employees:read",
          "attendance:view",
          "vacations:view",
          "vacations:approve",
          "medical_leaves:view",
          "absences:view",
          "absences:approve",
          "reports:view",
          "reports:generate"
        ],
        "active": true,
        "createdAt": "2026-09-19T10:30:01Z",
        "updatedAt": "2026-09-19T10:30:01Z"
      }
    ]
  }
}
```

### Respuesta con Errores Parciales

```json
{
  "status": "success",
  "message": "Importación completada: 1 usuario creado, 2 errores",
  "data": {
    "total": 3,
    "successful": 1,
    "failed": 2,
    "errors": [
      {
        "row": 2,
        "email": "invalid-email@",
        "error": "Email formato inválido"
      },
      {
        "row": 3,
        "email": "juan.perez@hospital.ec",
        "error": "Usuario con email juan.perez@hospital.ec ya existe"
      }
    ],
    "users": [
      {
        "id": "uuid-1",
        "email": "maria.lopez@hospital.ec",
        "firstName": "Maria",
        "lastName": "López Rodríguez",
        "role": "SUPERVISOR",
        "permissions": [...],
        "active": true,
        "createdAt": "2026-09-19T10:30:01Z",
        "updatedAt": "2026-09-19T10:30:01Z"
      }
    ]
  }
}
```

---

## Ejemplos de Uso

### Ejemplo 1: Importar 10 empleados desde CSV procesado

```bash
#!/bin/bash

# 1. Autenticarse
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.ec","password":"admin123"}' \
  | jq -r '.data.tokens.accessToken')

# 2. Preparar datos desde CSV (convertir a JSON)
# Suponiendo archivo: empleados.csv con columnas: email, firstName, lastName, role, departmentId, employeeId

# 3. Importar
curl -X POST http://localhost:3000/api/users/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @migration_data.json \
  | jq '.'
```

### Ejemplo 2: Script de migración de DINAWEB

```javascript
// migration.js - Convertir datos de DINAWEB a formato RRHH
const fs = require('fs');
const csv = require('csv-parser');

async function migrateFromDINAWEB(csvFilePath) {
  const users = [];
  
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      users.push({
        email: row.correo_electronico.toLowerCase(),
        firstName: row.nombres.split(' ')[0],
        lastName: row.apellidos || row.nombres.split(' ').slice(1).join(' '),
        role: mapRoleFromDINAWEB(row.puesto),
        departmentId: row.departamento_id,
        employeeId: row.cedula, // Use ID number as employee ID
        password: generateTemporaryPassword()
      });
    })
    .on('end', async () => {
      // Send to API
      const response = await fetch('http://localhost:3000/api/users/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ users })
      });
      
      const result = await response.json();
      console.log(`Importados: ${result.data.successful}, Errores: ${result.data.failed}`);
      if (result.data.errors.length > 0) {
        console.error('Errores:', result.data.errors);
      }
    });
}

function mapRoleFromDINAWEB(dinawebRole) {
  const roleMap = {
    'administrador': 'ADMIN',
    'gerente_rh': 'HR_MANAGER',
    'jefe_departamento': 'DEPARTMENT_HEAD',
    'supervisor': 'SUPERVISOR',
    'empleado': 'EMPLOYEE'
  };
  return roleMap[dinawebRole?.toLowerCase()] || 'EMPLOYEE';
}

function generateTemporaryPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
```

### Ejemplo 3: Monitoreo de importación con Postman

**Colección Postman:**
```json
{
  "info": {
    "name": "RRHH Bulk Import",
    "description": "API de importación masiva de usuarios"
  },
  "item": [
    {
      "name": "1. Login",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/api/auth/login",
        "body": {
          "email": "admin@hospital.ec",
          "password": "admin123"
        }
      }
    },
    {
      "name": "2. Import Users",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/api/users/import",
        "headers": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          }
        ],
        "body": {
          "users": [
            {
              "email": "test@hospital.ec",
              "firstName": "Test",
              "lastName": "User",
              "role": "EMPLOYEE"
            }
          ]
        }
      }
    }
  ]
}
```

---

## Matriz de Roles y Permisos Automáticos

Cuando se importa un usuario con un rol específico, automáticamente recibe todos los permisos asociados:

### ADMIN
- ✅ Todos los 40+ permisos disponibles

### HR_MANAGER
- ✅ Gestión completa de empleados (crear, leer, actualizar, eliminar)
- ✅ Importación de usuarios
- ✅ Control de asistencia manual
- ✅ Aprobación de vacaciones y permisos médicos
- ✅ Visualización de auditoría

### DEPARTMENT_HEAD
- ✅ Lectura de empleados del departamento
- ✅ Corrección de asistencia
- ✅ Aprobación de vacaciones y permisos médicos
- ✅ Visualización de reportes

### SUPERVISOR
- ✅ Lectura de empleados
- ✅ Visualización de asistencia
- ✅ Aprobación de vacaciones y permisos
- ✅ Visualización de reportes

### EMPLOYEE
- ✅ Ver datos propios
- ✅ Ver asistencia propia
- ✅ Solicitar vacaciones/permisos médicos
- ✅ Ver reportes propios

---

## Consideraciones de Migración

### Para migrar desde DINAWEB:

1. **Exportar datos** desde DINAWEB en formato CSV
2. **Mapear campos** a la estructura RRHH
3. **Validar emails** - Deben ser únicos
4. **Asignar roles** apropiados según posición
5. **Establecer departamentos** - Mapear IDs de departamentos
6. **Generar contraseñas** temporales (enviadas por email)
7. **Ejecutar importación** en lotes (máx 1,000 usuarios)
8. **Verificar errores** - Corregir y reintentar filas fallidas

### Mejores prácticas:

- 📋 **Divide importaciones grandes** - Si tienes 5,000 empleados, divide en 5 lotes de 1,000
- ✅ **Valida antes de importar** - Verifica que no existan duplicados
- 🔐 **Notifica empleados** - Envía contraseña temporal por email seguro
- 📊 **Monitorea la importación** - Revisa el reporte de errores
- 🔄 **Reintentos** - Corrije datos y reimporta filas fallidas
- 📝 **Auditoría** - El sistema registra cada importación

---

## Endpoints Relacionados

### Crear usuario individual
```bash
POST /api/users
```

### Listar usuarios
```bash
GET /api/users?limit=100&offset=0
```

### Cambiar rol de usuario
```bash
POST /api/users/:id/role
Body: { "newRole": "HR_MANAGER" }
```

### Desactivar/Activar usuario
```bash
POST /api/users/:id/deactivate
POST /api/users/:id/activate
```

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| "Permiso insuficiente" | Verifica que tu usuario tenga permiso `USERS_IMPORT` |
| "Email ya existe" | El email ya está registrado - usa otro o actualiza usuario existente |
| "Token expirado" | Genera nuevo token con `/api/auth/login` |
| "Rol no válido" | Usa uno de: ADMIN, HR_MANAGER, DEPARTMENT_HEAD, SUPERVISOR, EMPLOYEE |
| "Campos requeridos" | email, firstName, lastName y role son obligatorios |

---

## Auditoría

Todos los eventos de importación se registran en auditoría:

```
[AUDIT] Importación de usuarios: 100 exitosos, 2 fallidos
```

Esto permite rastrear:
- ✅ Quién realizó la importación
- ✅ Cuándo se ejecutó
- ✅ Cuántos usuarios se crearon
- ✅ Cuáles fallaron y por qué

---

## Próximos Pasos

Después de importar usuarios:

1. **Configura dispositivos biométricos** - Registra los dispositivos (ZK Teco, Anviz, etc.)
2. **Sincroniza biométricos** - Carga huellas/rostros desde dispositivos
3. **Configura horarios** - Define turnos y jornadas laborales
4. **Activa portal de empleado** - Permite autenticación y solicitudes
5. **Genera reportes iniciales** - Verifica asistencia y auditoría
