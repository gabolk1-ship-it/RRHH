-- =============================================
-- SCHEMA: RRHH - Hospital 24 Horas
-- Sistema de Control de Asistencia Biométrica
-- =============================================

-- =============================================
-- EXTENSIONES
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. TABLA: DEPARTMENTS (Departamentos)
-- =============================================
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    head_id UUID,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. TABLA: POSITIONS (Posiciones/Cargos)
-- =============================================
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    department_id UUID REFERENCES departments(id),
    salary_range_min DECIMAL(10,2),
    salary_range_max DECIMAL(10,2),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. TABLA: USERS (Empleados)
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Datos básicos
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    -- Corporativo
    department_id UUID REFERENCES departments(id),
    position_id UUID REFERENCES positions(id),
    hire_date DATE NOT NULL,
    -- Autenticación
    password_hash VARCHAR(255),
    password_salt VARCHAR(255),
    -- Estado
    active BOOLEAN DEFAULT true,
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Índices para búsqueda rápida
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_department ON users(department_id);

-- =============================================
-- 4. TABLA: BIOMETRIC_DEVICES (Dispositivos Biométricos)
-- =============================================
CREATE TABLE biometric_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_code VARCHAR(50) NOT NULL UNIQUE,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL, -- 'FINGERPRINT', 'FACIAL', 'RFID'
    manufacturer VARCHAR(100), -- 'ZK_TECO', 'ANVIZ', 'OTHER'
    ip_address INET,
    port INTEGER DEFAULT 8200,
    location VARCHAR(255), -- Ubicación física (piso, área, etc)
    -- Configuración
    enabled BOOLEAN DEFAULT true,
    sync_enabled BOOLEAN DEFAULT true,
    last_sync TIMESTAMP,
    sync_status VARCHAR(50), -- 'ONLINE', 'OFFLINE', 'ERROR'
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_biometric_devices_type ON biometric_devices(device_type);
CREATE INDEX idx_biometric_devices_status ON biometric_devices(sync_status);

-- =============================================
-- 5. TABLA: BIOMETRIC_TEMPLATES (Plantillas Biométricas)
-- =============================================
CREATE TABLE biometric_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES biometric_devices(id),
    biometric_type VARCHAR(50) NOT NULL, -- 'FINGERPRINT_1', 'FINGERPRINT_2', 'FACIAL'
    template_data BYTEA, -- Datos biométricos encriptados
    fingerprint_index INTEGER, -- Para huella: 0-9 representando dedos
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_biometric_templates_user ON biometric_templates(user_id);
CREATE INDEX idx_biometric_templates_device ON biometric_templates(device_id);

-- =============================================
-- 6. TABLA: SCHEDULES (Horarios y Turnos)
-- =============================================
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schedule_name VARCHAR(100) NOT NULL, -- 'Turno Mañana', 'Turno Noche', 'Turno Rotativo'
    -- Horarios
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER, -- Minutos de jornada
    -- Días de la semana (0=Domingo, 6=Sábado)
    monday BOOLEAN DEFAULT true,
    tuesday BOOLEAN DEFAULT true,
    wednesday BOOLEAN DEFAULT true,
    thursday BOOLEAN DEFAULT true,
    friday BOOLEAN DEFAULT true,
    saturday BOOLEAN DEFAULT false,
    sunday BOOLEAN DEFAULT false,
    -- Período de validez
    valid_from DATE NOT NULL,
    valid_to DATE, -- NULL = sin fecha de fin
    -- Tolerancia
    grace_period_minutes INTEGER DEFAULT 5, -- Minutos de tolerancia
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedules_user ON schedules(user_id);
CREATE INDEX idx_schedules_valid ON schedules(valid_from, valid_to);

-- =============================================
-- 7. TABLA: ATTENDANCE_RECORDS (Registros de Asistencia)
-- =============================================
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES biometric_devices(id),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    record_date DATE NOT NULL,
    -- Biométrico
    biometric_type VARCHAR(50), -- 'FINGERPRINT', 'FACIAL', 'RFID', 'MANUAL'
    biometric_quality DECIMAL(3,2), -- 0-1 (score de calidad)
    -- Estado
    status VARCHAR(50) DEFAULT 'NORMAL', -- 'NORMAL', 'LATE', 'EARLY', 'ABSENT', 'JUSTIFED'
    minutes_late INTEGER DEFAULT 0,
    minutes_early INTEGER DEFAULT 0,
    -- Notas
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_user_date ON attendance_records(user_id, record_date);
CREATE INDEX idx_attendance_status ON attendance_records(status);
CREATE INDEX idx_attendance_date ON attendance_records(record_date);

-- =============================================
-- 8. TABLA: ABSENCES (Ausencias/Justificaciones)
-- =============================================
CREATE TABLE absences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    absence_date DATE NOT NULL,
    absence_type VARCHAR(50) NOT NULL, -- 'SICK_LEAVE', 'UNJUSTIFIED', 'EXCUSED', 'HALF_DAY'
    hours_missing INTEGER,
    reason TEXT,
    attachment_url VARCHAR(512), -- URL de documento adjunto (certificado médico, etc)
    submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_by UUID REFERENCES users(id), -- Usuario que subió la justificación
    -- Aprobación
    approval_status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    approved_by UUID REFERENCES users(id),
    approval_date TIMESTAMP,
    approval_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_absences_user_date ON absences(user_id, absence_date);
CREATE INDEX idx_absences_status ON absences(approval_status);

-- =============================================
-- 9. TABLA: MEDICAL_LEAVES (Permisos Médicos)
-- =============================================
CREATE TABLE medical_leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_start_date DATE NOT NULL,
    leave_end_date DATE NOT NULL,
    hours_per_day DECIMAL(4,2) DEFAULT 8.00, -- Horas diarias de permiso
    total_hours DECIMAL(8,2), -- Total calculado
    reason VARCHAR(255),
    medical_certificate_url VARCHAR(512), -- Certificado médico
    -- Tipo de permiso
    leave_type VARCHAR(50) NOT NULL, -- 'MATERNITY', 'MEDICAL', 'EMERGENCY', 'COMPASSION'
    -- Estado
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'
    approved_by UUID REFERENCES users(id),
    approval_date TIMESTAMP,
    approval_notes TEXT,
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medical_leaves_user ON medical_leaves(user_id);
CREATE INDEX idx_medical_leaves_dates ON medical_leaves(leave_start_date, leave_end_date);

-- =============================================
-- 10. TABLA: VACATIONS (Vacaciones)
-- =============================================
CREATE TABLE vacations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vacation_start_date DATE NOT NULL,
    vacation_end_date DATE NOT NULL,
    total_days INTEGER,
    balance_before DECIMAL(6,2),
    balance_after DECIMAL(6,2),
    -- Estado
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'
    approved_by UUID REFERENCES users(id),
    approval_date TIMESTAMP,
    notes TEXT,
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vacations_user ON vacations(user_id);
CREATE INDEX idx_vacations_status ON vacations(status);

-- =============================================
-- 11. TABLA: VACATION_BALANCE (Saldo de Vacaciones)
-- =============================================
CREATE TABLE vacation_balance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_year INTEGER NOT NULL,
    days_earned DECIMAL(6,2) DEFAULT 0,
    days_used DECIMAL(6,2) DEFAULT 0,
    days_available DECIMAL(6,2) DEFAULT 0,
    carryover_days DECIMAL(6,2) DEFAULT 0, -- Días del año anterior
    last_accrual_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 12. TABLA: REPORTS (Reportes Generados)
-- =============================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(100) NOT NULL, -- 'ATTENDANCE', 'VACATION', 'ABSENCE', 'MONTHLY_SUMMARY'
    report_name VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id),
    user_id UUID REFERENCES users(id),
    report_date_from DATE,
    report_date_to DATE,
    file_url VARCHAR(512),
    file_format VARCHAR(50), -- 'PDF', 'XLSX', 'CSV'
    generated_by UUID NOT NULL REFERENCES users(id),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_date ON reports(generated_at);

-- =============================================
-- 13. TABLA: AUDIT_LOGS (Auditoría)
-- =============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL, -- 'LOGIN', 'CLOCK_IN', 'REPORT_GENERATED', etc
    resource_type VARCHAR(100), -- 'ATTENDANCE', 'USER', 'DEVICE', etc
    resource_id UUID,
    old_values JSONB, -- Valores anteriores
    new_values JSONB, -- Valores nuevos
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(50), -- 'SUCCESS', 'FAILURE', 'WARNING'
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at);

-- =============================================
-- 14. TABLA: API_LOGS (Logs de API)
-- =============================================
CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL, -- 'GET', 'POST', 'PUT', 'DELETE'
    status_code INTEGER,
    response_time_ms INTEGER,
    request_size BIGINT,
    response_size BIGINT,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX idx_api_logs_date ON api_logs(created_at);

-- =============================================
-- 15. TABLA: DEVICE_SYNC_LOGS (Logs de Sincronización)
-- =============================================
CREATE TABLE device_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES biometric_devices(id) ON DELETE CASCADE,
    sync_type VARCHAR(50), -- 'PULL', 'PUSH', 'FULL_SYNC'
    records_synced INTEGER,
    status VARCHAR(50), -- 'SUCCESS', 'PARTIAL', 'FAILED'
    error_message TEXT,
    sync_duration_seconds INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_device_sync_device ON device_sync_logs(device_id);
CREATE INDEX idx_device_sync_date ON device_sync_logs(created_at);

-- =============================================
-- TRIGGERS: Actualizar updated_at automáticamente
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas que lo necesitan
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_absences_updated_at BEFORE UPDATE ON absences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_biometric_devices_updated_at BEFORE UPDATE ON biometric_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCIONES ÚTILES
-- =============================================

-- Calcular edad del empleado
CREATE OR REPLACE FUNCTION calculate_age(hire_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN DATE_PART('year', CURRENT_DATE) - DATE_PART('year', hire_date)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Obtener saldo de vacaciones
CREATE OR REPLACE FUNCTION get_vacation_balance(p_user_id UUID, p_year INTEGER)
RETURNS DECIMAL(6,2) AS $$
DECLARE
    v_balance DECIMAL(6,2);
BEGIN
    SELECT days_available INTO v_balance
    FROM vacation_balance
    WHERE user_id = p_user_id AND current_year = p_year;

    RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Resumen de asistencia del día
CREATE OR REPLACE VIEW v_today_attendance AS
SELECT
    u.id,
    u.employee_id,
    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
    d.name as department,
    ar.check_in_time,
    ar.check_out_time,
    ar.status,
    ar.minutes_late
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN attendance_records ar ON u.id = ar.user_id AND ar.record_date = CURRENT_DATE
ORDER BY u.employee_id;

-- Resumen de vacaciones por usuario
CREATE OR REPLACE VIEW v_vacation_summary AS
SELECT
    u.id,
    u.employee_id,
    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
    vb.current_year,
    vb.days_earned,
    vb.days_used,
    vb.days_available,
    vb.carryover_days
FROM users u
LEFT JOIN vacation_balance vb ON u.id = vb.user_id
WHERE u.active = true
ORDER BY u.employee_id;

-- Resumen de faltas
CREATE OR REPLACE VIEW v_absences_summary AS
SELECT
    u.id,
    u.employee_id,
    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
    COUNT(*) as total_absences,
    COUNT(CASE WHEN approval_status = 'APPROVED' THEN 1 END) as approved_absences,
    COUNT(CASE WHEN approval_status = 'PENDING' THEN 1 END) as pending_absences,
    COUNT(CASE WHEN approval_status = 'REJECTED' THEN 1 END) as rejected_absences
FROM users u
LEFT JOIN absences a ON u.id = a.user_id
GROUP BY u.id, u.employee_id, u.first_name, u.last_name
ORDER BY u.employee_id;

-- =============================================
-- COMENTARIOS DE TABLA
-- =============================================
COMMENT ON TABLE users IS 'Empleados del hospital con información personal y corporativa';
COMMENT ON TABLE attendance_records IS 'Registros de entrada/salida capturados por dispositivos biométricos';
COMMENT ON TABLE biometric_devices IS 'Dispositivos biométricos instalados (lectores de huella, cámaras facial, etc)';
COMMENT ON TABLE schedules IS 'Horarios y turnos de trabajo por empleado';
COMMENT ON TABLE vacations IS 'Solicitudes de vacaciones';
COMMENT ON TABLE medical_leaves IS 'Permisos médicos y de ausencia';
COMMENT ON TABLE absences IS 'Justificaciones de faltas';

-- =============================================
-- FIN DEL SCHEMA
-- =============================================
