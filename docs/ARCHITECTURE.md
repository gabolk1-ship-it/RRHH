# Arquitectura del Sistema - Control Biométrico Hospital

## Índice
1. [Visión General](#visión-general)
2. [Arquitectura de Capas](#arquitectura-de-capas)
3. [Componentes Principales](#componentes-principales)
4. [Flujo de Datos](#flujo-de-datos)
5. [Seguridad](#seguridad)
6. [Escalabilidad](#escalabilidad)

---

## Visión General

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React.js)                       │
│         Dashboard | Portal Empleado | Reportes              │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTPS/JWT
┌──────────────▼──────────────────────────────────────────────┐
│           API GATEWAY (Express.js / NestJS)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Authentication | Validation | Rate Limiting | Logging  │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────┬───────────────┬────────────────────────────────┘
               │               │
       ┌───────▼───────┐  ┌────▼──────────────────┐
       │  Core APIs    │  │ Biometric Service    │
       │ - Attendance  │  │ - ZK Teco SDK        │
       │ - Schedule    │  │ - Anviz API          │
       │ - Reports     │  │ - Facial Recognition │
       │ - Employee    │  │ - Device Sync        │
       └───────┬───────┘  └────┬──────────────────┘
               │               │
       ┌───────▼───────────────▼──────────────────┐
       │     PostgreSQL Database                  │
       │  ┌────────────────────────────────────┐  │
       │  │ - Users & Schedules                │  │
       │  │ - Attendance Records               │  │
       │  │ - Biometric Templates              │  │
       │  │ - Vacations & Medical Leaves       │  │
       │  │ - Audit Logs                       │  │
       │  └────────────────────────────────────┘  │
       └───────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│           Biometric Devices (Hospital Network)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ ZK Teco 1    │  │ Facial Cam 1 │  │ Anviz Dev 1  │     │
│  │ (Entrance)   │  │ (Main Gate)   │  │ (Lab Area)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────────────────────────────────────────┘
```

---

## Arquitectura de Capas

### 1. **Presentation Layer (Frontend)**

```
Frontend (React.js)
├── Pages/
│   ├── Dashboard
│   ├── Attendance Report
│   ├── Vacation Management
│   ├── Medical Leave
│   └── Employee Profile
├── Components/
│   ├── Header/Navigation
│   ├── Sidebar
│   ├── Charts/Graphs
│   ├── Forms
│   └── Tables
├── Services/
│   └── API Client (axios)
├── State Management (Redux/Zustand)
└── Styling (Material-UI/Tailwind)
```

### 2. **API Gateway Layer**

```
Express.js / NestJS
├── Routes/
│   ├── /api/auth
│   ├── /api/attendance
│   ├── /api/employees
│   ├── /api/schedules
│   ├── /api/vacations
│   ├── /api/medical-leaves
│   ├── /api/absences
│   ├── /api/reports
│   ├── /api/devices
│   └── /api/biometric
├── Middlewares/
│   ├── Authentication (JWT)
│   ├── Authorization (Role-based)
│   ├── Validation
│   ├── Error Handling
│   ├── Rate Limiting
│   └── Logging
└── Controllers/
    └── Business Logic
```

### 3. **Business Logic Layer**

```
Services/Repositories
├── AttendanceService
│   ├── recordAttendance()
│   ├── getAttendanceReport()
│   ├── calculateLateArrival()
│   └── handleAbsences()
├── ScheduleService
│   ├── getEmployeeSchedule()
│   ├── validateScheduleCompliance()
│   ├── handleScheduleConflicts()
│   └── applyRotatingShifts()
├── VacationService
│   ├── requestVacation()
│   ├── approveVacation()
│   ├── calculateBalance()
│   └── generateVacationReport()
├── BiometricService
│   ├── registerBiometric()
│   ├── syncDevices()
│   ├── verifyBiometric()
│   └── handleDeviceFailure()
└── ReportService
    ├── generateAttendanceReport()
    ├── generatePayrollData()
    ├── exportToExcel/PDF()
    └── generateAnalytics()
```

### 4. **Data Access Layer**

```
Repositories (ORM/Query Builder)
├── UserRepository
├── AttendanceRepository
├── ScheduleRepository
├── VacationRepository
├── BiometricRepository
├── AuditLogRepository
└── DeviceSyncRepository
```

### 5. **Database Layer**

```
PostgreSQL 14+
├── Users & Authentication
├── Biometric Templates
├── Attendance Records
├── Schedules & Shifts
├── Vacations & Medical Leaves
├── Absences & Justifications
├── Audit Logs
└── Device Sync Logs
```

---

## Componentes Principales

### A. **Biometric Service**

Módulo independiente para integración con dispositivos:

```
BiometricService/
├── adapters/
│   ├── ZKTecoAdapter
│   │   ├── connect()
│   │   ├── getAttendanceRecords()
│   │   ├── registerUser()
│   │   └── syncData()
│   ├── AnvizAdapter
│   ├── FacialRecognitionAdapter
│   └── DeviceFactory
├── models/
│   ├── BiometricTemplate
│   ├── AttendanceData
│   └── DeviceStatus
├── utils/
│   ├── DataEncryption
│   ├── ImageProcessing
│   └── DeviceProtocols
└── controllers/
    ├── SyncController
    ├── VerificationController
    └── DeviceManagementController
```

### B. **Core Modules**

#### Attendance Module
- Captura de entrada/salida
- Validación contra horarios
- Cálculo de tardanzas
- Generación de reportes

#### Schedule Module
- Gestión de horarios y turnos (24/7)
- Validación de cambios de turno
- Solapamiento de horarios
- Rotación de turnos

#### Vacation Management
- Solicitud y aprobación
- Cálculo de saldo
- Historial de vacaciones
- Generación de documentos

#### Medical Leave Module
- Solicitudes de permiso médico (por horas)
- Adjunto de certificados
- Aprobación
- Impacto en nómina

#### Absence Module
- Justificación de faltas
- Carga de evidencia
- Workflow de aprobación
- Notificaciones

---

## Flujo de Datos

### Flujo: Registro de Asistencia

```
┌─────────────────────────────────────────────────────────┐
│ Empleado llega al reloj biométrico                       │
└──────────┬──────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│ Captura biométrica (huella/facial)                      │
└──────────┬──────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│ Dispositivo encripta datos + timestamp                  │
└──────────┬──────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│ Sincronización con servidor (TCP/REST)                  │
│ - Cada 5 minutos o en tiempo real                       │
└──────────┬──────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│ Biometric Service recibe dato                           │
│ - Valida integridad                                     │
│ - Desencripta                                           │
│ - Verifica dispositivo                                  │
└──────────┬──────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│ Attendance Service procesa                              │
│ - Identifica usuario                                    │
│ - Obtiene horario esperado                              │
│ - Calcula si llegó tarde                                │
│ - Marca como check-in o check-out                       │
└──────────┬──────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│ Guardar en BD: attendance_records                       │
└──────────┬──────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│ Auditado en audit_logs                                  │
│ - Usuario, timestamp, resultado                        │
└──────────┬──────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│ Disponible en Dashboard y reportes                      │
└─────────────────────────────────────────────────────────┘
```

### Flujo: Justificación de Falta

```
Empleado solicita justificación (vía Portal)
    ↓
Carga evidencia (certificado médico, etc)
    ↓
Sistema registra en tabla absences
    ↓
Notifica a supervisor/RH
    ↓
RH revisa y aprueba/rechaza
    ↓
Se actualiza estado de asistencia
    ↓
Cambio registrado en audit_logs
```

---

## Seguridad

### 1. **Encriptación de Datos**

```
- Datos biométricos: AES-256 (en reposo)
- Contraseñas: bcrypt (10+ rounds)
- Transmisión: HTTPS/SSL TLS 1.3+
- JWT: HS256/RS256
- Datos sensibles (SSN, ID): column-level encryption
```

### 2. **Autenticación**

```
Frontend → JWT Token → Backend
├── Email + Contraseña
├── Multi-factor (opcional: SMS/Email)
└── Biométrico (futuro)

Token payload:
{
  "sub": "user_id",
  "email": "user@hospital.ec",
  "roles": ["employee", "supervisor"],
  "exp": 1695052800
}
```

### 3. **Autorización (Role-Based Access Control)**

```
Roles:
- ADMIN: Acceso total
- SUPERVISOR: Aprobación de permisos/vacaciones
- HR_MANAGER: Reportes y configuración
- EMPLOYEE: Autoservicio (ver datos, justificaciones)
- DEVICE_MANAGER: Gestión de dispositivos biométricos

Permisos por endpoint:
GET    /api/attendance      → [ADMIN, HR_MANAGER, SUPERVISOR, EMPLOYEE (own data)]
POST   /api/absences        → [ADMIN, HR_MANAGER, SUPERVISOR, EMPLOYEE]
PUT    /api/absences/:id    → [ADMIN, HR_MANAGER, SUPERVISOR]
DELETE /api/devices         → [ADMIN, DEVICE_MANAGER]
```

### 4. **Auditoría**

```
Toda acción registrada:
- Usuario
- Timestamp
- Acción
- Tabla/Recurso afectado
- Valores anteriores/nuevos
- IP address
- User agent
- Resultado (success/failure)

Retención: Mínimo 7 años (cumplimiento legal)
```

### 5. **Compliance**

```
Ecuador:
  - Código del Trabajo
  - IESS (aportes)
  - SRI (impuestos)
  - Regulaciones de datos personales

OWASP Top 10:
  - Injection prevention
  - Broken authentication
  - Sensitive data exposure
  - XML External Entities (XXE)
  - Broken access control
  - Insecure deserialization
  - Using components with known vulnerabilities
  - Insufficient logging & monitoring
```

---

## Escalabilidad

### Horizontal Scaling

```
Load Balancer (Nginx)
    ↓
    ├─→ API Server 1
    ├─→ API Server 2
    ├─→ API Server 3
    └─→ API Server N

Database:
    ├─→ Primary (Write)
    ├─→ Read Replica 1
    ├─→ Read Replica 2
    └─→ Read Replica N
```

### Caching Strategy

```
Redis Cache:
├── User sessions
├── Schedule data (hot)
├── Biometric templates
├── Recent attendance records
└── Report cache (1 hour TTL)

Invalidation:
- On user update
- On schedule change
- On attendance sync
```

### Async Processing

```
Message Queue (RabbitMQ/Redis)
├── Attendance sync from devices
├── Report generation
├── Email notifications
├── Audit log writing
└── Report exports

Workers:
├── BiometricSyncWorker
├── ReportGenerationWorker
├── NotificationWorker
└── AuditLogWorker
```

---

## Deployment Architecture

```
Development
├── Docker Compose (local)
└── PostgreSQL local

Staging
├── AWS ECS / Digital Ocean App
├── RDS PostgreSQL
├── CloudFront CDN
└── Route53 DNS

Production
├── AWS ECS (auto-scaling)
├── RDS PostgreSQL (Multi-AZ)
├── ElastiCache (Redis)
├── S3 (backups, reports)
├── CloudWatch (monitoring)
└── Route53 (DNS)
```

---

## Monitoreo y Observabilidad

```
Logging:
├── Winston (application logs)
├── CloudWatch (AWS)
└── ELK Stack (Elasticsearch/Kibana)

Metrics:
├── Prometheus + Grafana
├── API response times
├── Database query performance
├── Device sync status
└── Error rates

Alerting:
├── Slack notifications
├── Email alerts
├── PagerDuty (critical)
└── Custom webhooks
```

---

## Performance Targets

```
API Response Times:
├── Login: < 200ms
├── Attendance Query: < 100ms
├── Report Generation: < 5s
└── Search: < 500ms

Database:
├── Connection pool: 20-50
├── Query timeout: 30s
├── Backup: Daily
└── PITR: 7 days

Device Sync:
├── Frequency: Every 5 minutes
├── Batch size: 1000 records
├── Timeout: 60 seconds
└── Retry: 3 attempts
```

---

## Roadmap Arquitectónico

### v1.0 (MVP)
- Asistencia básica
- Huella dactilar
- Reportes simples
- Gestión de horarios

### v1.1
- Reconocimiento facial
- Mobile app
- Integraciones nómina

### v2.0
- Multi-hospital
- BI avanzado
- Machine learning (predicción de ausencias)

---

**Última actualización:** 2026-09-19
