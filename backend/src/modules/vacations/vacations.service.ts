/**
 * Vacations Service
 * Solicitudes de vacaciones con calculo de antiguedad (Codigo del Trabajo - Ecuador)
 *
 * Regla general: 15 dias habiles anuales a partir del primer ano de servicio,
 * mas 1 dia adicional por cada ano que exceda los primeros 5 anos de trabajo
 * (articulo 69, Codigo del Trabajo de Ecuador).
 */

import { prisma } from '../../lib/prisma';

const BASE_VACATION_DAYS = 15;
const YEARS_BEFORE_BONUS = 5;

export interface CreateVacationDTO {
  userId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export class VacationsService {
  /**
   * Calcular dias de vacaciones disponibles segun antiguedad
   */
  calculateEntitledDays(hireDate: Date, referenceDate: Date = new Date()): number {
    const yearsOfService = this.calculateYearsOfService(hireDate, referenceDate);

    if (yearsOfService < 1) {
      // Proporcional al primer ano
      const monthsWorked = this.calculateMonthsOfService(hireDate, referenceDate);
      return Math.floor((BASE_VACATION_DAYS / 12) * monthsWorked);
    }

    const bonusYears = Math.max(0, yearsOfService - YEARS_BEFORE_BONUS);
    return BASE_VACATION_DAYS + bonusYears;
  }

  calculateYearsOfService(hireDate: Date, referenceDate: Date = new Date()): number {
    let years = referenceDate.getFullYear() - hireDate.getFullYear();
    const monthDiff = referenceDate.getMonth() - hireDate.getMonth();
    const dayDiff = referenceDate.getDate() - hireDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      years--;
    }
    return Math.max(0, years);
  }

  calculateMonthsOfService(hireDate: Date, referenceDate: Date = new Date()): number {
    const months =
      (referenceDate.getFullYear() - hireDate.getFullYear()) * 12 +
      (referenceDate.getMonth() - hireDate.getMonth());
    return Math.max(0, months);
  }

  /**
   * Dias de vacaciones ya usados (aprobados) en el periodo actual (ultimos 12 meses)
   */
  private async getUsedDaysInPeriod(userId: string): Promise<number> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const approved = await prisma.vacation.findMany({
      where: {
        userId,
        status: 'APPROVED',
        startDate: { gte: oneYearAgo },
      },
    });

    return approved.reduce((total, v) => total + this.countBusinessDays(v.startDate, v.endDate), 0);
  }

  private countBusinessDays(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  /**
   * Obtener balance de vacaciones de un usuario
   */
  async getVacationBalance(userId: string) {
    // El campo hireDate no existe en el schema actual; se usa createdAt como aproximacion
    // hasta que se agregue un campo dedicado de fecha de ingreso.
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const hireDate = user.createdAt;
    const entitledDays = this.calculateEntitledDays(hireDate);
    const usedDays = await this.getUsedDaysInPeriod(userId);
    const yearsOfService = this.calculateYearsOfService(hireDate);

    return {
      userId,
      hireDate,
      yearsOfService,
      entitledDays,
      usedDays,
      availableDays: Math.max(0, entitledDays - usedDays),
    };
  }

  /**
   * Crear solicitud de vacaciones
   */
  async requestVacation(data: CreateVacationDTO) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (data.endDate < data.startDate) {
      throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    const requestedDays = this.countBusinessDays(data.startDate, data.endDate);
    const balance = await this.getVacationBalance(data.userId);

    if (requestedDays > balance.availableDays) {
      throw new Error(
        `Dias solicitados (${requestedDays}) exceden el saldo disponible (${balance.availableDays})`
      );
    }

    return prisma.vacation.create({
      data: {
        userId: data.userId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        status: 'PENDING',
      },
    });
  }

  /**
   * Aprobar solicitud de vacaciones
   */
  async approveVacation(id: string, approverId: string) {
    const vacation = await prisma.vacation.findUnique({ where: { id } });
    if (!vacation) {
      throw new Error('Solicitud no encontrada');
    }
    if (vacation.status !== 'PENDING') {
      throw new Error('Solo se pueden aprobar solicitudes pendientes');
    }

    return prisma.vacation.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: approverId, approvalDate: new Date() },
    });
  }

  /**
   * Rechazar solicitud de vacaciones
   */
  async rejectVacation(id: string, approverId: string, reason?: string) {
    const vacation = await prisma.vacation.findUnique({ where: { id } });
    if (!vacation) {
      throw new Error('Solicitud no encontrada');
    }
    if (vacation.status !== 'PENDING') {
      throw new Error('Solo se pueden rechazar solicitudes pendientes');
    }

    return prisma.vacation.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: approverId,
        approvalDate: new Date(),
        reason: reason ?? vacation.reason,
      },
    });
  }

  /**
   * Listar solicitudes de un usuario
   */
  async getVacationsByUser(userId: string) {
    return prisma.vacation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Listar solicitudes pendientes (vista de aprobadores)
   */
  async getPendingVacations(limit = 100, offset = 0) {
    const [vacations, total] = await Promise.all([
      prisma.vacation.findMany({
        where: { status: 'PENDING' },
        take: limit,
        skip: offset,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, employeeId: true, departmentId: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.vacation.count({ where: { status: 'PENDING' } }),
    ]);

    return { vacations, total };
  }
}

export const vacationsService = new VacationsService();
