/**
 * Schedules Service
 * Gestion de horarios y turnos por usuario
 */

import { prisma } from '../../lib/prisma';

export interface CreateScheduleDTO {
  userId: string;
  name: string;
  startTime: string;
  endTime: string;
  monday?: boolean;
  tuesday?: boolean;
  wednesday?: boolean;
  thursday?: boolean;
  friday?: boolean;
  saturday?: boolean;
  sunday?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateScheduleDTO {
  name?: string;
  startTime?: string;
  endTime?: string;
  monday?: boolean;
  tuesday?: boolean;
  wednesday?: boolean;
  thursday?: boolean;
  friday?: boolean;
  saturday?: boolean;
  sunday?: boolean;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

export class SchedulesService {
  /**
   * Crear un horario para un usuario
   * Un usuario puede tener multiples horarios activos (turnos 24/7)
   */
  async createSchedule(data: CreateScheduleDTO) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return prisma.schedule.create({
      data: {
        userId: data.userId,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        monday: data.monday ?? true,
        tuesday: data.tuesday ?? true,
        wednesday: data.wednesday ?? true,
        thursday: data.thursday ?? true,
        friday: data.friday ?? true,
        saturday: data.saturday ?? false,
        sunday: data.sunday ?? false,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });
  }

  /**
   * Obtener todos los horarios de un usuario
   */
  async getSchedulesByUser(userId: string, activeOnly = false) {
    return prisma.schedule.findMany({
      where: {
        userId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Obtener un horario por ID
   */
  async getScheduleById(id: string) {
    return prisma.schedule.findUnique({ where: { id } });
  }

  /**
   * Actualizar un horario
   */
  async updateSchedule(id: string, updates: UpdateScheduleDTO) {
    const schedule = await prisma.schedule.findUnique({ where: { id } });
    if (!schedule) {
      throw new Error('Horario no encontrado');
    }

    return prisma.schedule.update({
      where: { id },
      data: updates,
    });
  }

  /**
   * Eliminar (desactivar) un horario
   */
  async deactivateSchedule(id: string) {
    const schedule = await prisma.schedule.findUnique({ where: { id } });
    if (!schedule) {
      throw new Error('Horario no encontrado');
    }

    return prisma.schedule.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Eliminar un horario permanentemente
   */
  async deleteSchedule(id: string) {
    const schedule = await prisma.schedule.findUnique({ where: { id } });
    if (!schedule) {
      throw new Error('Horario no encontrado');
    }

    await prisma.schedule.delete({ where: { id } });
  }

  /**
   * Listar todos los horarios activos (vista administrativa)
   */
  async listActiveSchedules(limit = 100, offset = 0) {
    const [schedules, total] = await Promise.all([
      prisma.schedule.findMany({
        where: { isActive: true },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, employeeId: true, departmentId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.schedule.count({ where: { isActive: true } }),
    ]);

    return { schedules, total };
  }
}

export const schedulesService = new SchedulesService();
