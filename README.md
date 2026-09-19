# 🏥 Sistema de Control de Asistencia Biométrica

Aplicación integral de gestión de asistencia y recursos humanos para hospital de 24 horas con integración de dispositivos biométricos (huella dactilar, reconocimiento facial).

## ✨ Características Principales

- 📱 **Control Biométrico Multimodal**
  - Huella dactilar (ZK Teco, Anviz)
  - Reconocimiento facial con IA
  - Múltiples dispositivos sincronizados

- 👥 **Gestión de Personal**
  - Múltiples horarios por usuario (turnos 24/7)
  - Gestión de antigüedad
  - Permisos médicos por horas
  - Vacaciones y descansos

- 📊 **Reportes y Análitica**
  - Reportes de asistencia en tiempo real
  - Análisis de faltas y permisos
  - Exportación a Excel/PDF
  - Dashboards interactivos

- 💻 **Portal de Empleado**
  - Autoservicio de justificaciones
  - Solicitud de permisos
  - Visualización de datos personales
  - Histórico de asistencia

- 🔐 **Seguridad**
  - Encriptación de datos sensibles
  - Autenticación multi-factor
  - Auditoría de accesos
  - Cumplimiento RGPD/Ecuador

## 🚀 Quick Start

### Requisitos Previos
- Node.js 18+
- PostgreSQL 14+
- Docker (opcional)

### Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/gabolk1-ship-it/RRHH.git
cd RRHH

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Crear base de datos
npm run db:setup

# 5. Iniciar servidor
npm run dev
```

## 📁 Estructura del Proyecto

```
RRHH/
├── backend/              # API Node.js/Express
│   ├── src/
│   │   ├── routes/       # Rutas de API
│   │   ├── controllers/  # Lógica de negocio
│   │   ├── models/       # Modelos de BD
│   │   └── middlewares/  # Middlewares
│   ├── package.json
│   └── .env
├── frontend/             # React.js Dashboard
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── pages/        # Páginas
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Utilidades
│   ├── package.json
│   └── .env
├── biometric-service/    # Servicio de integración
│   ├── src/
│   │   ├── zk-teco/      # Integración ZK Teco
│   │   ├── anviz/        # Integración Anviz
│   │   ├── facial/       # Reconocimiento facial
│   │   └── utils/        # Utilidades
│   └── package.json
├── database/             # Scripts SQL
│   ├── schema.sql        # Esquema inicial
│   ├── migrations/       # Migraciones
│   └── seeds/            # Datos iniciales
├── docs/                 # Documentación
│   ├── API.md            # Documentación API
│   ├── DEPLOYMENT.md     # Guía de despliegue
│   └── ARCHITECTURE.md   # Arquitectura del sistema
├── tests/                # Tests
│   ├── unit/             # Tests unitarios
│   └── e2e/              # Tests E2E
├── config/               # Configuraciones globales
├── docker-compose.yml    # Orquestación Docker
├── .env.example          # Variables de entorno (template)
├── CLAUDE.md             # Documentación del proyecto
└── README.md             # Este archivo
```

## 🔌 Dispositivos Soportados

### Huella Dactilar
- **ZK Teco (Serie uFace)**
  - Modelos: uFace100, uFace202, uFace302
  - Protocolo: TCP/UDP
  - Puerto: 8200

- **Anviz CrossChex**
  - Integración: WebAPI
  - Protocolo: HTTPS
  - Sincronización: Tiempo real

### Reconocimiento Facial
- **Cámaras IP** con soporte ONVIF
- **APIs de IA:**
  - OpenCV + TensorFlow
  - Google Cloud Vision
  - Microsoft Azure Face API

## 🗄️ Base de Datos

PostgreSQL 14+ con esquema:

```sql
-- Tablas principales
- users              -- Empleados del hospital
- positions          -- Posiciones/cargos
- departments        -- Departamentos
- biometric_devices  -- Dispositivos registrados
- attendance_records -- Registros de entrada/salida
- schedules          -- Horarios y turnos
- vacations          -- Solicitudes de vacaciones
- medical_leaves     -- Permisos médicos
- absences           -- Justificaciones de faltas
- reports            -- Reportes generados
- audit_logs         -- Auditoría de accesos
```

## 🔐 Seguridad

- ✅ Encriptación de datos sensibles (AES-256)
- ✅ Hashing de contraseñas (bcrypt)
- ✅ JWT para autenticación
- ✅ HTTPS/SSL en producción
- ✅ Validación de entrada (sanitización)
- ✅ Rate limiting en APIs
- ✅ CORS configurado
- ✅ Logs de auditoría
- ✅ Cumplimiento OWASP Top 10

## 📝 API Endpoints (principales)

```
POST   /api/auth/login              -- Iniciar sesión
POST   /api/auth/logout             -- Cerrar sesión

GET    /api/attendance              -- Listar asistencia
POST   /api/attendance/clock-in     -- Registrar entrada
POST   /api/attendance/clock-out    -- Registrar salida

GET    /api/employees/:id           -- Datos empleado
PUT    /api/employees/:id           -- Actualizar empleado

GET    /api/schedules               -- Listar horarios
POST   /api/schedules               -- Crear horario

GET    /api/reports/attendance      -- Reporte asistencia
GET    /api/reports/vacations       -- Reporte vacaciones

POST   /api/biometric/sync          -- Sincronizar dispositivos
GET    /api/biometric/status        -- Estado dispositivos
```

## 🛠️ Desarrollo

### Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar en modo desarrollo
npm run watch           # Watch mode

# Testing
npm run test            # Tests unitarios
npm run test:e2e        # Tests E2E
npm test:coverage       # Cobertura

# Base de datos
npm run db:setup        # Crear BD
npm run db:seed         # Cargar datos iniciales
npm run db:migrate      # Ejecutar migraciones

# Producción
npm run build           # Build
npm run start           # Iniciar servidor
npm run lint            # Linting
npm run format          # Format código

# Docker
docker-compose up       # Iniciar stack
docker-compose down     # Detener stack
```

## 📊 Stack Tecnológico

### Backend
- Node.js 18+
- Express.js / NestJS
- PostgreSQL 14+
- JWT, bcrypt
- Winston (logging)

### Frontend
- React.js 18+
- Redux / Zustand
- Material-UI / Tailwind CSS
- Recharts (gráficos)
- Axios (HTTP)

### Biométricos
- SDK ZK Teco
- Anviz API
- OpenCV + TensorFlow (facial)

### DevOps
- Docker / Docker Compose
- GitHub Actions (CI/CD)
- Nginx (reverse proxy)

## 📖 Documentación Completa

- [API Documentation](./docs/API.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Database Schema](./database/schema.sql)
- [Installation Guide](./docs/INSTALLATION.md)

## 🤝 Contribuir

Este es un proyecto privado. Para cambios:

1. Crear rama: `git checkout -b feature/nueva-caracteristica`
2. Commit: `git commit -am 'Add nueva caracteristica'`
3. Push: `git push origin feature/nueva-caracteristica`
4. Pull Request

## 📞 Soporte

Para reportar bugs o sugerencias:
- Crear un Issue en GitHub
- Contactar al equipo de desarrollo

## 📄 Licencia

Privado - Hospital 24 Horas Ecuador

## ✅ Versiones de Características

### v1.0 (MVP)
- [x] Control biométrico básico
- [x] Reportes de asistencia
- [x] Gestión de horarios
- [ ] Portal de empleado

### v1.1
- [ ] Reconocimiento facial
- [ ] Móvil app
- [ ] Integración nómina

### v2.0
- [ ] Multi-hospital
- [ ] BI avanzado
- [ ] Integración ERP

---

**Última actualización:** 2026-09-19  
**Versión:** 1.0.0-beta
