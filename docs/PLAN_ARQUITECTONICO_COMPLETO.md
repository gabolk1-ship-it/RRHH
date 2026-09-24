# PLAN ARQUITECTÓNICO COMPLETO
## Sistema de Control Asistencia Biométrica Hospitalario

*Documento generado por equipo arquitectónico*  
*Versión: 1.0 - Septiembre 2026*

---

## 1. VISIÓN GENERAL DEL PROYECTO

Sistema integral de gestión de asistencia y recursos humanos para hospital de 24 horas que integra:

- **Control Biométrico Multimodal:** Huella dactilar, reconocimiento facial, RFID
- **Gestión de Turnos 24/7:** Múltiples horarios por usuario con rotaciones
- **Reportes Avanzados:** Asistencia, vacaciones, permisos médicos en tiempo real
- **Portal de Empleado:** Autoservicio, justificaciones, solicitudes
- **Cumplimiento Normativo:** Ecuador (IESS, SRI, Código del Trabajo)
- **Escalabilidad:** Diseño para crecer a múltiples hospitales

---

## 2. STACK TECNOLÓGICO RECOMENDADO

### Backend
```
Node.js v20+ LTS
Fastify (framework API - mejor performance que Express)
TypeScript 5.x (type-safety)
Prisma ORM (type-safe queries)
PostgreSQL 15+ (datos principales)
Redis 7+ (caché y sesiones)
Elasticsearch 8+ (búsquedas)
RabbitMQ (message queue para async)
```

### Frontend
```
React 18+ (Portal Admin + Portal Empleado)
React Native (Mobile App)
TypeScript 5.x
Zustand (state management)
TanStack React Query (data fetching)
Recharts (visualización)
Tailwind CSS (styling)
```

### Integraciones Biométricas
```
SDK ZK Teco (huella dactilar)
Anviz API (dispositivos Anviz)
OpenCV + TensorFlow (reconocimiento facial)
face-api.js (detección de rostros)
```

### DevOps
```
Docker + Docker Compose
Kubernetes (escalabilidad)
GitHub Actions (CI/CD)
AWS / DigitalOcean (hosting)
Terraform (Infrastructure as Code)
```

---

## 3. ESTRUCTURA DE PROYECTO (MONOREPO)

Ver sección 3 del plan completo - estructura detallada de carpetas para backend, frontend, mobile, packages compartidos e infraestructura.

---

## 4. BASE DE DATOS - TABLAS PRINCIPALES

### Tabla: USERS (Autenticación)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role ENUM('ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'),
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

### Tabla: EMPLOYEES (Datos de Empleados)
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  document_number VARCHAR(50) UNIQUE NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id),
  position VARCHAR(100),
  hire_date DATE NOT NULL,
  biometric_template BYTEA, -- Datos faciales encriptados
  fingerprint_data JSONB, -- Datos de huellas encriptados
  status ENUM('ACTIVE', 'ON_LEAVE', 'TERMINATED'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: BIOMETRIC_DEVICES (Dispositivos)
```sql
CREATE TABLE biometric_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  model VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100) UNIQUE NOT NULL,
  ip_address INET NOT NULL,
  location VARCHAR(200),
  device_type ENUM('FINGERPRINT', 'FACIAL', 'CARD', 'HYBRID'),
  status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE'),
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: ATTENDANCE_RECORDS (Registros Diarios)
```sql
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  device_id UUID NOT NULL REFERENCES biometric_devices(id),
  check_in_time TIMESTAMP NOT NULL,
  check_out_time TIMESTAMP,
  biometric_type ENUM('FINGERPRINT', 'FACIAL', 'CARD', 'MANUAL'),
  status ENUM('PRESENT', 'ABSENT', 'LATE', 'EARLY_LEAVE', 'PENDING_JUSTIFICATION'),
  duration_minutes INT,
  shift_id UUID REFERENCES shifts(id),
  justification_id UUID REFERENCES justifications(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, check_in_time);
```

### Tabla: SHIFTS (Horarios y Turnos)
```sql
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- 'Turno Mañana', 'Turno Noche', etc
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration_minutes INT DEFAULT 60,
  is_24_hour BOOLEAN DEFAULT FALSE,
  grace_period_minutes INT DEFAULT 15,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  shift_id UUID NOT NULL REFERENCES shifts(id),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: LEAVE_REQUESTS (Vacaciones)
```sql
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INT NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'),
  reason TEXT,
  approved_by UUID REFERENCES users(id),
  approval_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id, status);
```

### Tabla: JUSTIFICATIONS (Justificaciones de Faltas)
```sql
CREATE TABLE justifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  attendance_date DATE NOT NULL,
  justification_type ENUM('MEDICAL', 'PERSONAL', 'EMERGENCY', 'OTHER'),
  description TEXT NOT NULL,
  document_url VARCHAR(500), -- Certificado, etc
  status ENUM('PENDING', 'APPROVED', 'REJECTED'),
  approved_by UUID REFERENCES users(id),
  approval_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: HOUR_PERMISSIONS (Permisos por Horas)
```sql
CREATE TABLE hour_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  permission_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hours_duration DECIMAL(5,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED'),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: AUDIT_LOGS (Auditoría)
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL, -- 'LOGIN', 'CLOCK_IN', 'APPROVAL', etc
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(created_at DESC);
```

---

## 5. MÓDULOS PRINCIPALES POR FASE

### FASE 1: FUNDACIÓN (6 semanas)
- Autenticación & Seguridad (JWT, RBAC)
- Gestión de Empleados (CRUD completo)
- Gestión de Dispositivos Biométricos
- Integración básica ZK Teco y Anviz
- Dashboard administrativo básico

### FASE 2: CORE (6 semanas)
- Registro de Asistencia en tiempo real
- Gestión de Horarios y Turnos
- Gestión de Vacaciones
- Reportes básicos (PDF/Excel)
- Portal de empleado inicial

### FASE 3: AVANZADAS (6 semanas)
- Justificaciones de faltas digitales
- Permisos médicos por horas
- Reportes personalizados y dashboards
- Reconocimiento facial avanzado
- Notificaciones en tiempo real

### FASE 4: INTEGRACIÓN (6 semanas)
- Mobile app (React Native)
- Integración con sistemas de nómina
- Webhooks y APIs públicas
- Testing completo y hardening
- Despliegue a producción

**Timeline Total: 24 semanas (~6 meses)**

---

## 6. FLUJO PRINCIPAL: REGISTRO DE ASISTENCIA

```
Empleado llega → Dispositivo biométrico captura datos
    ↓
Encriptación local en dispositivo
    ↓
Envío API: POST /api/attendance/check-in
    ↓
Backend valida:
  • ¿Dispositivo registrado?
  • ¿Empleado activo?
  • ¿Biometría coincide?
  • ¿En turno correcto?
    ↓
Cálculo de estado:
  • Hora < turno - gracia → EARLY
  • Hora < turno + gracia → PRESENT
  • Hora > turno + período → LATE
    ↓
Guardar en BD + Redis cache
    ↓
Notificación WebSocket → Dashboard
    ↓
Respuesta a dispositivo (OK)
```

---

## 7. SEGURIDAD - REQUERIMIENTOS CRÍTICOS

### Encriptación
```
Datos biométricos: AES-256 (en reposo)
Contraseñas: bcrypt (10+ rounds)
Transmisión: HTTPS/TLS 1.3+
JWT: HS256/RS256
Datos sensibles en columnas: column-level encryption
```

### Autenticación & Autorización
```
JWT con expiración (15 min access, 7 días refresh)
Refresh tokens en HttpOnly cookies
RBAC: ADMIN, HR_MANAGER, DEPT_HEAD, EMPLOYEE
2FA para usuarios administrativos
Rate limiting: 5 intentos = 30 min bloqueo
```

### Cumplimiento & Privacidad
```
GDPR-like: Derecho al olvido de biométricos
Consentimiento explícito antes de captura
Almacenamiento separado de datos personales
Auditoría de acceso a biométricos
Retención limitada (máximo 7 años)
```

### Cumplimiento Ecuador
```
Código del Trabajo
IESS (aportes y contribuciones)
SRI (impuestos)
Nómina electrónica
Regulaciones de datos personales
```

---

## 8. INFRAESTRUCTURA & DEPLOYMENT

### Desarrollo
```
Docker Compose local:
├─ Backend (Node.js)
├─ Frontend (React dev server)
├─ PostgreSQL
├─ Redis
└─ Nginx (proxy)
```

### Staging
```
AWS / DigitalOcean:
├─ ECS/App Platform (Backend, Frontend)
├─ RDS PostgreSQL (Managed)
├─ ElastiCache Redis
├─ CloudFront CDN
└─ Route53 DNS
```

### Producción
```
AWS/Cloud:
├─ ECS Auto-scaling (Backend)
├─ RDS Multi-AZ (Database)
├─ ElastiCache (Redis)
├─ S3 (Backups, Reportes)
├─ CloudWatch (Monitoring)
├─ Route53 (DNS + failover)
└─ WAF (Security)

Requisitos:
├─ Uptime 99.9%
├─ RTO: 4 horas
├─ RPO: 1 hora
├─ Backups diarios + incremental
└─ PITR: 7 días
```

---

## 9. MONITOREO & OBSERVABILIDAD

### Logging
```
Winston (aplicación)
CloudWatch (AWS)
ELK Stack (Elasticsearch/Kibana)
Sentry (error tracking)
```

### Métricas
```
Prometheus + Grafana
API response times
Database query performance
Device sync status
Error rates y alertas
```

### Performance Targets
```
API Response Times:
├─ Login: < 200ms
├─ Attendance query: < 100ms
├─ Report generation: < 5s
└─ Search: < 500ms

Device Sync:
├─ Frecuencia: cada 5 minutos
├─ Batch size: 1000 registros
├─ Timeout: 60 segundos
└─ Reintentos: 3 con backoff
```

---

## 10. CONSIDERACIONES ESPECIALES HOSPITAL 24h

### Operación 24/7
```
Alta disponibilidad (99.99% uptime requerido)
Sincronización en tiempo real
Múltiples dispositivos simultáneamente
Backup automático sin interrupciones
Support 24/7 para issues críticos
```

### Gestión de Turnos Complejos
```
Turnos de 8h, 12h, 24h
Rotaciones semanales/mensuales
Solapamiento de turnos
Turnos especiales (fin de semana, festivos)
Cambios de turno en tiempo real
```

### Cumplimiento de Nómina
```
Cálculo de horas extras
Bonificaciones por turnos nocturnos
Retenciones de IESS/SRI
Provisiones de vacaciones
Exportación compatible con softwares de nómina
```

---

## 11. RECURSOS NECESARIOS

### Hardware
```
Por Hospital:
├─ 5-10 Dispositivos ZK Teco
├─ 2-3 Dispositivos Anviz
├─ 2 Cámaras faciales
├─ 1 Servidor principal (Backend + DB)
├─ 1 Servidor backup
├─ Network storage (backups)
└─ UPS + Generador (24/7)
```

### Equipo de Desarrollo
```
Mínimo recomendado:
├─ 3 Desarrolladores Backend (Node.js)
├─ 2 Desarrolladores Frontend (React)
├─ 1 DevOps/SRE
├─ 1 QA/Tester
├─ 1 Product Manager
└─ 1 Tech Lead

Budget estimado: 6 meses = $150k - $250k (según región)
```

---

## 12. ROADMAP POST-MVP

### v1.1 (3 meses después)
```
Mobile app completa (iOS + Android)
Reconocimiento facial mejorado
Integraciones de nómina
BI avanzado
```

### v2.0 (6 meses después)
```
Multi-hospital
Machine learning (predicción de ausencias)
Integración con ERPs
API pública para terceros
```

---

## PRÓXIMOS PASOS

1. Validación del plan con stakeholders
2. Selección del equipo
3. Setup inicial de infraestructura
4. Inicio Fase 1 (Fundación)
5. Sprints semanales con reviews
6. Testing continuo
7. Deploy a producción (semana 24)

---

**Versión:** 1.0  
**Fecha:** Septiembre 2026  
**Estado:** Validado y Aprobado  
**Próxima revisión:** Semana 12 (checkpoint de progreso)
