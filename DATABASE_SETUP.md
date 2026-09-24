# Configuración de Base de Datos PostgreSQL

## Inicio Rápido (Docker Compose)

### Requisitos
- Docker instalado
- Docker Compose v3.8+

### Paso 1: Levantar la Base de Datos

```bash
# Desde la carpeta raíz del proyecto
docker-compose up -d
```

**Esto inicia:**
- PostgreSQL 15 en puerto 5432
- pgAdmin (UI visual) en puerto 5050
- Volumen persistente para datos

### Paso 2: Verificar Estado

```bash
# Ver logs
docker-compose logs -f postgres

# Verificar que esté healthy
docker-compose ps
```

Esperado:
```
STATUS: Up (healthy)
```

### Paso 3: Crear archivo .env

```bash
cp backend/.env.example backend/.env
```

Contenido básico:
```env
DATABASE_URL=postgresql://rrhh_user:rrhh_password_dev@localhost:5432/rrhh_db
JWT_SECRET=dev-secret-key-change-in-production
```

### Paso 4: Conectar desde la Aplicación

El servidor se conectará automáticamente a PostgreSQL en startup.

```bash
cd backend
npm run dev
```

---

## Acceder a pgAdmin (UI Visual)

**URL:** http://localhost:5050

**Credenciales:**
- Email: `admin@hospital.ec`
- Contraseña: `admin123`

**Agregar servidor en pgAdmin:**
1. Right-click → Register → Server
2. Name: `rrhh-postgres`
3. Connection:
   - Host: `postgres` (o `localhost` si falla)
   - Port: `5432`
   - Username: `rrhh_user`
   - Password: `rrhh_password_dev`
   - Database: `rrhh_db`

---

## Comandos Útiles

### Ver contenedores
```bash
docker ps
```

### Ver logs
```bash
docker logs rrhh-postgres
```

### Acceder a PostgreSQL CLI
```bash
docker exec -it rrhh-postgres psql -U rrhh_user -d rrhh_db
```

**Comandos SQL útiles:**
```sql
-- Ver tablas
\dt

-- Ver usuarios
SELECT * FROM users;

-- Ver estructura de tabla
\d users

-- Salir
\q
```

### Detener contenedores
```bash
docker-compose down
```

### Detener y eliminar datos (destructivo)
```bash
docker-compose down -v
```

---

## Estructura de Base de Datos

### Tablas principales:
```
users              - Empleados del sistema
attendance_records - Registros de entrada/salida
schedules         - Horarios y turnos
vacations         - Solicitudes de vacaciones
medical_leaves    - Permisos médicos
absences          - Justificaciones de faltas
biometric_devices - Dispositivos biométricos
audit_logs        - Registro de auditoría
permissions       - Matriz de permisos
role_permissions  - Permisos por rol
```

---

## Datos Iniciales

### Usuario Admin Predeterminado
```
Email: admin@hospital.ec
Contraseña: admin123
Rol: ADMIN
```

### Crear más usuarios
```bash
# Usar el endpoint de importación
curl -X POST http://localhost:3000/api/users/import \
  -H "Authorization: Bearer TOKEN" \
  -d @backend/scripts/sample_import_data.json
```

---

## Backup y Restore

### Hacer backup
```bash
docker exec rrhh-postgres pg_dump -U rrhh_user -d rrhh_db > backup.sql
```

### Restaurar desde backup
```bash
docker exec -i rrhh-postgres psql -U rrhh_user -d rrhh_db < backup.sql
```

---

## Troubleshooting

### Puerto 5432 ya está en uso
```bash
# Cambiar puerto en docker-compose.yml:
ports:
  - "5433:5432"  # Cambiar a 5433
```

### Conexión rechazada
```bash
# Verificar que el contenedor esté corriendo
docker ps | grep postgres

# Ver logs de error
docker logs rrhh-postgres
```

### pgAdmin no se conecta
- Usar hostname `postgres` en lugar de `localhost`
- Verificar que ambos contenedores estén en la misma red: `rrhh_network`

---

## Estado

1. Docker Compose configurado
2. ORM (Prisma) integrado en el backend
3. Servicios de negocio conectados a la base de datos vía Prisma
4. Migraciones definidas en `backend/prisma/schema.prisma`
5. Script de datos de prueba en `backend/scripts/seed.ts`

Pendiente: ejecutar `docker-compose up -d` y `npx prisma migrate dev` contra una base de datos real (no probado en este entorno por falta de Docker).

---

## Producción

Para producción (Google Cloud SQL, AWS RDS, etc.):

1. Cambiar `DATABASE_URL` en `.env`
2. Usar credenciales seguras (secrets manager)
3. Configurar SSL/TLS
4. Habilitar backups automáticos
5. Monitorear performance

Ejemplo Google Cloud SQL:
```env
DATABASE_URL=postgresql://user:password@cloudsql-proxy/database?sslmode=require
```
