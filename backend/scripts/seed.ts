/**
 * Database Seed Script
 * Crea datos iniciales: usuario administrador, usuarios de prueba y dispositivos
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de base de datos...');

  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

  // Usuario administrador
  const adminPasswordHash = await bcrypt.hash('admin123', saltRounds);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hospital.ec' },
    update: {},
    create: {
      email: 'admin@hospital.ec',
      firstName: 'Admin',
      lastName: 'Sistema',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      active: true,
      employeeId: 'ADM001',
    },
  });
  console.log(`Usuario administrador creado: ${admin.email}`);

  // Gerente de RRHH
  const hrPasswordHash = await bcrypt.hash('hr12345678', saltRounds);
  const hrManager = await prisma.user.upsert({
    where: { email: 'rrhh@hospital.ec' },
    update: {},
    create: {
      email: 'rrhh@hospital.ec',
      firstName: 'Maria',
      lastName: 'Gonzalez',
      passwordHash: hrPasswordHash,
      role: 'HR_MANAGER',
      active: true,
      employeeId: 'HR001',
      departmentId: 'rrhh',
    },
  });
  console.log(`Gerente de RRHH creado: ${hrManager.email}`);

  // Jefe de departamento
  const deptHeadPasswordHash = await bcrypt.hash('jefe12345678', saltRounds);
  const deptHead = await prisma.user.upsert({
    where: { email: 'jefe.emergencias@hospital.ec' },
    update: {},
    create: {
      email: 'jefe.emergencias@hospital.ec',
      firstName: 'Carlos',
      lastName: 'Ramirez',
      passwordHash: deptHeadPasswordHash,
      role: 'DEPARTMENT_HEAD',
      active: true,
      employeeId: 'DEP001',
      departmentId: 'emergencias',
    },
  });
  console.log(`Jefe de departamento creado: ${deptHead.email}`);

  // Supervisor
  const supervisorPasswordHash = await bcrypt.hash('super12345678', saltRounds);
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@hospital.ec' },
    update: {},
    create: {
      email: 'supervisor@hospital.ec',
      firstName: 'Ana',
      lastName: 'Torres',
      passwordHash: supervisorPasswordHash,
      role: 'SUPERVISOR',
      active: true,
      employeeId: 'SUP001',
      departmentId: 'emergencias',
    },
  });
  console.log(`Supervisor creado: ${supervisor.email}`);

  // Empleado
  const employeePasswordHash = await bcrypt.hash('empleado12345678', saltRounds);
  const employee = await prisma.user.upsert({
    where: { email: 'juan.perez@hospital.ec' },
    update: {},
    create: {
      email: 'juan.perez@hospital.ec',
      firstName: 'Juan',
      lastName: 'Perez',
      passwordHash: employeePasswordHash,
      role: 'EMPLOYEE',
      active: true,
      employeeId: 'EMP001',
      departmentId: 'emergencias',
    },
  });
  console.log(`Empleado creado: ${employee.email}`);

  // Horario de turno 24h para el empleado
  await prisma.schedule.create({
    data: {
      userId: employee.id,
      name: 'Turno Nocturno 24h',
      startTime: '19:00',
      endTime: '07:00',
      monday: true,
      tuesday: false,
      wednesday: true,
      thursday: false,
      friday: true,
      saturday: false,
      sunday: false,
      isActive: true,
    },
  });
  console.log('Horario de turno creado para el empleado');

  // Dispositivo biometrico de ejemplo
  const device = await prisma.biometricDevice.upsert({
    where: { serialNumber: 'ZK-EMERG-001' },
    update: {},
    create: {
      name: 'Lector Emergencias - Entrada Principal',
      deviceType: 'FINGERPRINT',
      serialNumber: 'ZK-EMERG-001',
      ipAddress: '192.168.1.101',
      location: 'Entrada de Emergencias',
      status: 'ACTIVE',
    },
  });
  console.log(`Dispositivo biometrico creado: ${device.name}`);

  console.log('Seed completado exitosamente.');
  console.log('');
  console.log('Credenciales de prueba:');
  console.log('  admin@hospital.ec / admin123 (ADMIN)');
  console.log('  rrhh@hospital.ec / hr12345678 (HR_MANAGER)');
  console.log('  jefe.emergencias@hospital.ec / jefe12345678 (DEPARTMENT_HEAD)');
  console.log('  supervisor@hospital.ec / super12345678 (SUPERVISOR)');
  console.log('  juan.perez@hospital.ec / empleado12345678 (EMPLOYEE)');
}

main()
  .catch((error) => {
    console.error('Error durante el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
