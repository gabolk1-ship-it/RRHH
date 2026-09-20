/**
 * Attendance Service
 * Registro de entrada/salida biometrica y correccion manual
 */

import { prisma } from '../../lib/prisma';

export interface RecordEntryDTO {
  userId: string;
  entryTime?: Date;
  notes?: string;
  isManual?: boolean;
}

export interface RecordExitDTO {
  userId: string;
  exitTime?: Date;
}

export interface ManualAttendanceDTO {
  userId: string;
  date: Date;
  entryTime: Date;
  exitTime?: Date;
  notes?: string;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export class AttendanceService {
  /**
   * Registrar entrada (marcacion biometrica o manual)
   */
  async recordEntry(data: RecordEntryDTO) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user || !user.active) {
      throw new Error('Usuario no encontrado o inactivo');
    }

    const entryTime = data.entryTime || new Date();
    const date = startOfDay(entryTime);

    // Evitar doble marcacion de entrada sin salida el mismo dia
    const openRecord = await prisma.attendanceRecord.findFirst({
      where: { userId: data.userId, date, exitTime: null },
    });
    if (openRecord) {
      throw new Error('Ya existe un registro de entrada sin salida para hoy');
    }

    return prisma.attendanceRecord.create({
      data: {
        userId: data.userId,
        entryTime,
        date,
        isManual: data.isManual ?? false,
        notes: data.notes,
      },
    });
  }

  /**
   * Registrar salida (marcacion biometrica o manual)
   */
  async recordExit(data: RecordExitDTO) {
    const exitTime = data.exitTime || new Date();
    const date = startOfDay(exitTime);

    const openRecord = await prisma.attendanceRecord.findFirst({
      where: { userId: data.userId, date, exitTime: null },
      orderBy: { entryTime: 'desc' },
    });

    if (!openRecord) {
      throw new Error('No hay un registro de entrada abierto para hoy');
    }

    return prisma.attendanceRecord.update({
      where: { id: openRecord.id },
      data: { exitTime },
    });
  }

  /**
   * Crear un registro manual de asistencia (correccion)
   */
  async createManualRecord(data: ManualAttendanceDTO) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return prisma.attendanceRecord.create({
      data: {
        userId: data.userId,
        entryTime: data.entryTime,
        exitTime: data.exitTime,
        date: startOfDay(data.date),
        isManual: true,
        notes: data.notes,
      },
    });
  }

  /**
   * Corregir un registro existente
   */
  async correctRecord(id: string, updates: { entryTime?: Date; exitTime?: Date; notes?: string }) {
    const record = await prisma.attendanceRecord.findUnique({ where: { id } });
    if (!record) {
      throw new Error('Registro no encontrado');
    }

    return prisma.attendanceRecord.update({
      where: { id },
      data: { ...updates, isManual: true },
    });
  }

  /**
   * Obtener registros de un usuario en un rango de fechas
   */
  async getRecordsByUser(userId: string, from?: Date, to?: Date) {
    return prisma.attendanceRecord.findMany({
      where: {
        userId,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: startOfDay(from) } : {}),
                ...(to ? { lte: startOfDay(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Obtener registros de un dia especifico (vista administrativa)
   */
  async getRecordsByDate(date: Date, limit = 200, offset = 0) {
    const targetDate = startOfDay(date);

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { date: targetDate },
        take: limit,
        skip: offset,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, employeeId: true, departmentId: true } },
        },
        orderBy: { entryTime: 'asc' },
      }),
      prisma.attendanceRecord.count({ where: { date: targetDate } }),
    ]);

    return { records, total };
  }

  /**
   * Obtener el registro abierto actual de un usuario (sin salida)
   */
  async getOpenRecord(userId: string) {
    const date = startOfDay(new Date());
    return prisma.attendanceRecord.findFirst({
      where: { userId, date, exitTime: null },
      orderBy: { entryTime: 'desc' },
    });
  }
}

export const attendanceService = new AttendanceService();
