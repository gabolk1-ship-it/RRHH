# Referencia de API - Sistema RRHH

Documento de referencia completo de todos los endpoints disponibles en el backend.

Formato de respuesta estandar:

```
Exito:  { "status": "success", "data": { ... } }
Error:  { "status": "error", "message": "..." }
```

Todos los endpoints marcados como `(protegido)` requieren el header:

```
Authorization: Bearer <access_token>
```

---

## Autenticacion

| Metodo | Ruta | Descripcion | Permiso requerido |
|--------|------|-------------|--------------------|
| POST | /api/auth/login | Iniciar sesion | - |
| POST | /api/auth/register | Registrar usuario | - |
| POST | /api/auth/refresh | Renovar access token | - |
| POST | /api/auth/logout | Cerrar sesion | protegido |
| GET | /api/auth/me | Datos del usuario autenticado | protegido |

## Usuarios

| Metodo | Ruta | Descripcion | Permiso requerido |
|--------|------|-------------|--------------------|
| POST | /api/users | Crear usuario | USERS_CREATE |
| POST | /api/users/import | Importacion masiva (1-1000) | USERS_IMPORT |
| GET | /api/users | Listar usuarios | USERS_READ |
| GET | /api/users/:id | Obtener usuario | USERS_READ |
| PUT | /api/users/:id | Actualizar usuario | USERS_UPDATE |
| POST | /api/users/:id/role | Cambiar rol | ROLES_ASSIGN |
| POST | /api/users/:id/deactivate | Desactivar usuario | USERS_DELETE |
| POST | /api/users/:id/activate | Reactivar usuario | USERS_DELETE |
| GET | /api/users/role/:role | Listar por rol | USERS_READ |

## Horarios y Turnos

Soporta multiples horarios activos por usuario (necesario para turnos 24/7).

| Metodo | Ruta | Descripcion | Permiso requerido |
|--------|------|-------------|--------------------|
| POST | /api/schedules | Crear horario | SCHEDULES_CREATE |
| GET | /api/schedules/user/:userId | Horarios de un usuario | SCHEDULES_READ |
| GET | /api/schedules | Listar horarios activos | SCHEDULES_READ |
| PUT | /api/schedules/:id | Actualizar horario | SCHEDULES_UPDATE |
| DELETE | /api/schedules/:id | Desactivar horario | SCHEDULES_DELETE |

**Body de creacion:**
```json
{
  "userId": "uuid",
  "name": "Turno Nocturno 24h",
  "startTime": "19:00",
  "endTime": "07:00",
  "monday": true,
  "tuesday": false,
  "wednesday": true,
  "startDate": "2026-01-01T00:00:00Z"
}
```

## Asistencia Biometrica

| Metodo | Ruta | Descripcion | Permiso requerido |
|--------|------|-------------|--------------------|
| POST | /api/attendance/entry | Registrar entrada | ATTENDANCE_RECORD |
| POST | /api/attendance/exit | Registrar salida | ATTENDANCE_RECORD |
| POST | /api/attendance/manual | Registro manual retroactivo | ATTENDANCE_MANUAL |
| PUT | /api/attendance/:id/correct | Corregir registro | ATTENDANCE_CORRECT |
| GET | /api/attendance/user/:userId | Historial de un usuario | ATTENDANCE_VIEW |
| GET | /api/attendance/date/:date | Registros de un dia | ATTENDANCE_VIEW |
| GET | /api/attendance/open/:userId | Verificar entrada abierta | ATTENDANCE_VIEW |

Reglas de negocio:
- No se permite una nueva entrada si existe un registro abierto (sin salida) el mismo dia.
- La salida se aplica al registro abierto mas reciente del usuario.
- Todo registro creado fuera del flujo entrada/salida normal queda marcado `isManual: true`.

## Vacaciones

Calculo de antiguedad segun articulo 69 del Codigo del Trabajo de Ecuador: 15 dias habiles anuales desde el primer ano de servicio, mas 1 dia adicional por cada ano que exceda los primeros 5 anos.

| Metodo | Ruta | Descripcion | Permiso requerido |
|--------|------|-------------|--------------------|
| GET | /api/vacations/balance/:userId | Saldo disponible por antiguedad | VACATIONS_VIEW |
| POST | /api/vacations | Solicitar vacaciones | VACATIONS_REQUEST |
| POST | /api/vacations/:id/approve | Aprobar solicitud | VACATIONS_APPROVE |
| POST | /api/vacations/:id/reject | Rechazar solicitud | VACATIONS_REJECT |
| GET | /api/vacations/user/:userId | Historial de un usuario | VACATIONS_VIEW |
| GET | /api/vacations/pending | Solicitudes pendientes | VACATIONS_APPROVE |

La solicitud se valida contra el saldo disponible; si los dias solicitados exceden el saldo, se rechaza automaticamente antes de crear el registro.

## Permisos Medicos

Soporta granularidad por horas (mismo dia) o por dias completos (8 horas laborales por dia).

| Metodo | Ruta | Descripcion | Permiso requerido |
|--------|------|-------------|--------------------|
| POST | /api/medical-leaves | Solicitar permiso medico | MEDICAL_LEAVES_REQUEST |
| POST | /api/medical-leaves/:id/approve | Aprobar permiso | MEDICAL_LEAVES_APPROVE |
| POST | /api/medical-leaves/:id/reject | Rechazar permiso | MEDICAL_LEAVES_APPROVE |
| GET | /api/medical-leaves/user/:userId | Historial de un usuario | MEDICAL_LEAVES_VIEW |
| GET | /api/medical-leaves/pending | Permisos pendientes | MEDICAL_LEAVES_APPROVE |

**Body de creacion (permiso por horas):**
```json
{
  "userId": "uuid",
  "startDate": "2026-03-10T00:00:00Z",
  "startTime": "08:00",
  "endDate": "2026-03-10T00:00:00Z",
  "endTime": "12:00",
  "reason": "Cita medica",
  "certificateUrl": "https://..."
}
```

## Justificacion de Faltas

| Metodo | Ruta | Descripcion | Permiso requerido |
|--------|------|-------------|--------------------|
| POST | /api/absences | Justificar falta | ABSENCES_REQUEST |
| POST | /api/absences/:id/approve | Aprobar justificacion | ABSENCES_APPROVE |
| POST | /api/absences/:id/reject | Rechazar justificacion | ABSENCES_APPROVE |
| GET | /api/absences/user/:userId | Historial de un usuario | ABSENCES_VIEW |
| GET | /api/absences/pending | Justificaciones pendientes | ABSENCES_APPROVE |

## Dispositivos Biometricos

| Metodo | Ruta | Descripcion | Permiso requerido |
|--------|------|-------------|--------------------|
| POST | /api/devices | Registrar dispositivo | DEVICES_MANAGE |
| GET | /api/devices | Listar dispositivos | DEVICES_MANAGE |
| PUT | /api/devices/:id | Actualizar configuracion | DEVICES_CONFIG |
| POST | /api/devices/:id/sync | Registrar sincronizacion | DEVICES_SYNC |
| DELETE | /api/devices/:id | Eliminar dispositivo | DEVICES_MANAGE |

Tipos soportados: `FINGERPRINT`, `FACIAL_RECOGNITION`, `HYBRID`.
Estados: `ACTIVE`, `INACTIVE`, `MAINTENANCE`, `ERROR`.

## Reportes

| Metodo | Ruta | Descripcion | Permiso requerido |
|--------|------|-------------|--------------------|
| GET | /api/reports/dashboard | Indicadores generales | REPORTS_VIEW |
| GET | /api/reports/attendance/:userId | Reporte de asistencia | REPORTS_VIEW |
| GET | /api/reports/vacations | Reporte consolidado de vacaciones | REPORTS_VIEW |
| GET | /api/reports/medical-leaves | Reporte consolidado de permisos | REPORTS_VIEW |
| GET | /api/reports/absences | Reporte consolidado de faltas | REPORTS_VIEW |
| GET | /api/reports/department/:departmentId | Reporte por departamento | REPORTS_VIEW |

Parametros de consulta comunes: `from`, `to` (ISO 8601). Sin especificar, el periodo por defecto es el mes en curso.

---

## Resumen de Modulos

| Modulo | Archivos | Estado |
|--------|----------|--------|
| Autenticacion | auth.service.prisma.ts, auth.controller.ts | Completo |
| Usuarios | users.service.prisma.ts, users.controller.ts | Completo |
| Horarios | schedules.service.ts, schedules.controller.ts | Completo |
| Asistencia | attendance.service.ts, attendance.controller.ts | Completo |
| Vacaciones | vacations.service.ts, vacations.controller.ts | Completo |
| Permisos medicos | medical-leaves.service.ts, medical-leaves.controller.ts | Completo |
| Justificacion de faltas | absences.service.ts, absences.controller.ts | Completo |
| Dispositivos biometricos | devices.service.ts, devices.controller.ts | Completo |
| Reportes | reports.service.ts, reports.controller.ts | Completo |

Pendiente: frontend (React), integracion real con SDK de dispositivos fisicos, notificaciones por correo.
