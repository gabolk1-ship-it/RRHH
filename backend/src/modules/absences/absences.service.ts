/**
 * Absences Service
 * Justificacion digital de faltas
 */

import { prisma } from '../../lib/prisma';

export interface CreateAbsenceDTO {
  userId: string;
  absenceDate: Date;
  reason: string;
  documentUrl?: string;
}

export class AbsencesService {
  /**
   * Crear justificacion de falta
   */
  async requestAbsence(data: CreateAbsenceDTO) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return prisma.absence.create({
      data: {
        userId: data.userId,
        absenceDate: data.absenceDate,
        reason: data.reason,
        documentUrl: data.documentUrl,
        status: 'PENDING',
      },
    });
  }

  /**
   * Aprobar justificacion
   */
  async approveAbsence(id: string, approverId: string) {
    const absence = await prisma.absence.findUnique({ where: { id } });
    if (!absence) {
      throw new Error('Justificacion no encontrada');
    }
    if (absence.status !== 'PENDING') {
      throw new Error('Solo se pueden aprobar justificaciones pendientes');
    }

    return prisma.absence.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: approverId, approvalDate: new Date() },
    });
  }

  /**
   * Rechazar justificacion
   */
  async rejectAbsence(id: string, approverId: string) {
    const absence = await prisma.absence.findUnique({ where: { id } });
    if (!absence) {
      throw new Error('Justificacion no encontrada');
    }
    if (absence.status !== 'PENDING') {
      throw new Error('Solo se pueden rechazar justificaciones pendientes');
    }

    return prisma.absence.update({
      where: { id },
      data: { status: 'REJECTED', approvedBy: approverId, approvalDate: new Date() },
    });
  }

  /**
   * Historial de justificaciones de un usuario
   */
  async getAbsencesByUser(userId: string) {
    return prisma.absence.findMany({
      where: { userId },
      orderBy: { absenceDate: 'desc' },
    });
  }

  /**
   * Listar justificaciones pendientes
   */
  async getPendingAbsences(limit = 100, offset = 0) {
    const [absences, total] = await Promise.all([
      prisma.absence.findMany({
        where: { status: 'PENDING' },
        take: limit,
        skip: offset,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, employeeId: true, departmentId: true } },
        },
        orderBy: { absenceDate: 'asc' },
      }),
      prisma.absence.count({ where: { status: 'PENDING' } }),
    ]);

    return { absences, total };
  }

  /**
   * Faltas injustificadas de un usuario en un rango (status distinto de APPROVED)
   */
  async getUnjustifiedCount(userId: string, from: Date, to: Date): Promise<number> {
    return prisma.absence.count({
      where: {
        userId,
        absenceDate: { gte: from, lte: to },
        status: { not: 'APPROVED' },
      },
    });
  }
}

export const absencesService = new AbsencesService();
