/**
 * Medical Leaves Service
 * Permisos medicos con granularidad de horas
 */

import { prisma } from '../../lib/prisma';

export interface CreateMedicalLeaveDTO {
  userId: string;
  startDate: Date;
  startTime?: string;
  endDate: Date;
  endTime?: string;
  reason: string;
  certificateUrl?: string;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export class MedicalLeavesService {
  /**
   * Calcular horas totales del permiso medico
   */
  calculateHours(startDate: Date, startTime: string | undefined, endDate: Date, endTime: string | undefined): number {
    const dayDiff = Math.round((this.stripTime(endDate).getTime() - this.stripTime(startDate).getTime()) / 86400000);

    if (dayDiff === 0 && startTime && endTime) {
      // Permiso de horas dentro del mismo dia
      const minutes = timeToMinutes(endTime) - timeToMinutes(startTime);
      return Math.max(0, minutes / 60);
    }

    // Permiso de dias completos (8 horas laborales por dia)
    const fullDays = dayDiff + 1;
    return fullDays * 8;
  }

  private stripTime(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Crear solicitud de permiso medico
   */
  async requestMedicalLeave(data: CreateMedicalLeaveDTO) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (data.endDate < data.startDate) {
      throw new Error('La fecha de fin debe ser posterior o igual a la fecha de inicio');
    }

    return prisma.medicalLeave.create({
      data: {
        userId: data.userId,
        startDate: data.startDate,
        startTime: data.startTime,
        endDate: data.endDate,
        endTime: data.endTime,
        reason: data.reason,
        certificateUrl: data.certificateUrl,
        status: 'PENDING',
      },
    });
  }

  /**
   * Aprobar permiso medico
   */
  async approveMedicalLeave(id: string, approverId: string) {
    const leave = await prisma.medicalLeave.findUnique({ where: { id } });
    if (!leave) {
      throw new Error('Permiso no encontrado');
    }
    if (leave.status !== 'PENDING') {
      throw new Error('Solo se pueden aprobar permisos pendientes');
    }

    return prisma.medicalLeave.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: approverId, approvalDate: new Date() },
    });
  }

  /**
   * Rechazar permiso medico
   */
  async rejectMedicalLeave(id: string, approverId: string) {
    const leave = await prisma.medicalLeave.findUnique({ where: { id } });
    if (!leave) {
      throw new Error('Permiso no encontrado');
    }
    if (leave.status !== 'PENDING') {
      throw new Error('Solo se pueden rechazar permisos pendientes');
    }

    return prisma.medicalLeave.update({
      where: { id },
      data: { status: 'REJECTED', approvedBy: approverId, approvalDate: new Date() },
    });
  }

  /**
   * Historial de permisos medicos de un usuario
   */
  async getLeavesByUser(userId: string) {
    return prisma.medicalLeave.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Total de horas usadas por permisos medicos en un periodo
   */
  async getUsedHours(userId: string, from: Date, to: Date) {
    const leaves = await prisma.medicalLeave.findMany({
      where: {
        userId,
        status: 'APPROVED',
        startDate: { gte: from },
        endDate: { lte: to },
      },
    });

    return leaves.reduce(
      (total, l) => total + this.calculateHours(l.startDate, l.startTime ?? undefined, l.endDate, l.endTime ?? undefined),
      0
    );
  }

  /**
   * Listar permisos pendientes (vista de aprobadores)
   */
  async getPendingLeaves(limit = 100, offset = 0) {
    const [leaves, total] = await Promise.all([
      prisma.medicalLeave.findMany({
        where: { status: 'PENDING' },
        take: limit,
        skip: offset,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, employeeId: true, departmentId: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.medicalLeave.count({ where: { status: 'PENDING' } }),
    ]);

    return { leaves, total };
  }
}

export const medicalLeavesService = new MedicalLeavesService();
