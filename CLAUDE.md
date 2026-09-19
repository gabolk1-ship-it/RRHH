# 🏥 Sistema de Control de Asistencia Biométrica - Hospital 24h

**Proyecto:** RRHH - Control Biométrico y Gestión de Personal  
**Versión:** 1.0  
**Última actualización:** 2026-09-19  
**Estado:** En Diseño Arquitectónico

---

## 📋 Descripción del Proyecto

Sistema integral de gestión de asistencia y recursos humanos para hospital de 24 horas que integra:

- **Control Biométrico Multimodal:** Huella dactilar, reconocimiento facial
- **Gestión de Turnos:** Múltiples horarios por usuario (turnos 24/7)
- **Reportes Avanzados:** Asistencia, vacaciones, permisos médicos
- **Portal de Empleado:** Autoservicio, justificaciones, solicitudes
- **Cumplimiento Normativo:** Ecuador (IESS, SRI, Código del Trabajo)

---

## 🎯 Requisitos Principales

### Funcionalidades Core
- ✅ Captura de biométricos (entrada/salida)
- ✅ Gestión de múltiples horarios por usuario
- ✅ Control de vacaciones y antigüedad
- ✅ Permisos médicos con granularidad de horas
- ✅ Justificación de faltas digital
- ✅ Reportes en tiempo real
- ✅ Datos sensibles encriptados

### Dispositivos Soportados
- ZK Teco (huella dactilar)
- Anviz (huella + reconocimiento)
- Cámaras de reconocimiento facial
- Escalable a otros dispositivos

---

## 🏗️ Estructura del Proyecto

```
RRHH/
├── backend/              # API Node.js/Express
├── frontend/             # React.js Dashboard
├── biometric-service/    # Servicio de integración biométrica
├── database/             # Scripts SQL PostgreSQL
├── docs/                 # Documentación
├── config/               # Configuraciones
└── tests/                # Tests unitarios
```

---

## 💾 Stack Tecnológico (Propuesto)

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js / NestJS
- **Base de Datos:** PostgreSQL 14+ (encriptación de datos sensibles)
- **APIs:** RESTful + WebSocket (reportes en tiempo real)
- **Seguridad:** JWT, bcrypt, SSL/TLS

### Frontend
- **Framework:** React.js / Vue.js
- **UI:** Material-UI / Tailwind CSS
- **Reportes:** Chart.js / Recharts
- **Estado:** Redux / Zustand

### Integración Biométrica
- **SDK Dispositivos:** SDK ZK Teco, Anviz
- **Computer Vision:** OpenCV / TensorFlow (facial recognition)
- **API Gateway:** Kong / AWS API Gateway

### DevOps
- **Containerización:** Docker
- **Orquestación:** Docker Compose
- **CI/CD:** GitHub Actions
- **Hosting:** AWS / DigitalOcean / Local

---

## 👥 Equipo y Tareas

### Fase 1: Análisis y Diseño
- [ ] Arquitectura de base de datos
- [ ] Integración con dispositivos biométricos
- [ ] Diseño de API REST
- [ ] Especificación de seguridad

### Fase 2: Backend
- [ ] Setup inicial + DB
- [ ] Autenticación y autorización
- [ ] Módulo de captura biométrica
- [ ] Lógica de horarios y turnos
- [ ] Cálculo de asistencia/vacaciones

### Fase 3: Frontend
- [ ] Dashboard principal
- [ ] Portal de empleado
- [ ] Módulo de reportes
- [ ] Justificaciones de faltas

### Fase 4: Integración y Testing
- [ ] Integración biométrica
- [ ] Tests E2E
- [ ] Seguridad (OWASP Top 10)
- [ ] Performance testing

### Fase 5: Deployment
- [ ] Setup producción
- [ ] Capacitación
- [ ] Go-live

---

## 🔐 Consideraciones de Seguridad

1. **Datos Biométricos:** Encriptación en tránsito y reposo
2. **RGPD/Privacidad:** Cumplimiento Ecuador
3. **Autenticación:** Multi-factor (contraseña + biométrico)
4. **Auditoría:** Logs de acceso y cambios
5. **Backup:** Redundancia y recuperación

---

## 📊 Base de Datos (Esquema Principal)

```sql
-- Tablas principales
- users (empleados)
- biometric_devices (dispositivos registrados)
- attendance_records (registros de entrada/salida)
- schedules (horarios y turnos)
- vacations (solicitudes de vacaciones)
- medical_leaves (permisos médicos)
- absences (justificaciones de faltas)
- reports (reportes generados)
```

---

## 🚀 Próximos Pasos

1. Revisión del plan arquitectónico completo
2. Setup inicial del proyecto
3. Creación de estructura de carpetas
4. Inicialización de repositorio git
5. Configuración de entorno de desarrollo

---

## 📞 Notas Importantes

- **Hospital 24h:** Considerar turnos rotativos y solapamientos
- **Cumplimiento:** IESS y SRI (nómina ecuatoriana)
- **Escalabilidad:** Diseño para crecer (múltiples hospitales futuros)
- **Integraciones:** Conectar con sistemas contables existentes

