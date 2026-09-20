/**
 * Reports Service
 * Reportes agregados de asistencia, vacaciones, permisos medicos y faltas
 */

import { prisma } from '../../lib/prisma';

export class ReportsService {
  /**
   * Reporte de asistencia de un usuario en un rango de fechas
   */
  async attendanceReport(userId: string, from: Date, to: Date) {
    const records = await prisma.attendanceRecord.findMany({
      where: { userId, date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    });

    let totalMinutesWorked = 0;
    let incompleteRecords = 0;

    for (const record of records) {
      if (record.exitTime) {
        totalMinutesWorked += (record.exitTime.getTime() - record.entryTime.getTime()) / 60000;
      } else {
        incompleteRecords++;
      }
    }

    return {
      userId,
      period: { from, to },
      totalRecords: records.length,
      incompleteRecords,
      totalHoursWorked: Math.round((totalMinutesWorked / 60) * 100) / 100,
      records,
    };
  }

  /**
   * Reporte consolidado de vacaciones (aprobadas, pendientes, rechazadas)
   */
  async vacationsReport(from: Date, to: Date) {
    const vacations = await prisma.vacation.findMany({
      where: { startDate: { gte: from }, endDate: { lte: to } },
      include: { user: { select: { id: true, firstName: true, lastName: true, employeeId: true } } },
    });

    const summary = {
      total: vacations.length,
      approved: vacations.filter((v) => v.status === 'APPROVED').length,
      pending: vacations.filter((v) => v.status === 'PENDING').length,
      rejected: vacations.filter((v) => v.status === 'REJECTED').length,
    };

    return { period: { from, to }, summary, vacations };
  }

  /**
   * Reporte consolidado de permisos medicos
   */
  async medicalLeavesReport(from: Date, to: Date) {
    const leaves = await prisma.medicalLeave.findMany({
      where: { startDate: { gte: from }, endDate: { lte: to } },
      include: { user: { select: { id: true, firstName: true, lastName: true, employeeId: true } } },
    });

    const summary = {
      total: leaves.length,
      approved: leaves.filter((l) => l.status === 'APPROVED').length,
      pending: leaves.filter((l) => l.status === 'PENDING').length,
      rejected: leaves.filter((l) => l.status === 'REJECTED').length,
    };

    return { period: { from, to }, summary, leaves };
  }

  /**
   * Reporte consolidado de faltas justificadas / injustificadas
   */
  async absencesReport(from: Date, to: Date) {
    const absences = await prisma.absence.findMany({
      where: { absenceDate: { gte: from, lte: to } },
      include: { user: { select: { id: true, firstName: true, lastName: true, employeeId: true } } },
    });

    const summary = {
      total: absences.length,
      justified: absences.filter((a) => a.status === 'APPROVED').length,
      pending: absences.filter((a) => a.status === 'PENDING').length,
      unjustified: absences.filter((a) => a.status === 'REJECTED').length,
    };

    return { period: { from, to }, summary, absences };
  }

  /**
   * Dashboard general: resumen de indicadores clave
   */
  async dashboardSummary() {
    const [
      totalUsers,
      activeUsers,
      pendingVacations,
      pendingMedicalLeaves,
      pendingAbsences,
      openAttendanceRecords,
      activeDevices,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { active: true } }),
      prisma.vacation.count({ where: { status: 'PENDING' } }),
      prisma.medicalLeave.count({ where: { status: 'PENDING' } }),
      prisma.absence.count({ where: { status: 'PENDING' } }),
      prisma.attendanceRecord.count({ where: { exitTime: null } }),
      prisma.biometricDevice.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      pendingApprovals: {
        vacations: pendingVacations,
        medicalLeaves: pendingMedicalLeaves,
        absences: pendingAbsences,
        total: pendingVacations + pendingMedicalLeaves + pendingAbsences,
      },
      openAttendanceRecords,
      activeDevices,
      generatedAt: new Date(),
    };
  }

  /**
   * Reporte por departamento
   */
  async departmentReport(departmentId: string, from: Date, to: Date) {
    const users = await prisma.user.findMany({
      where: { departmentId, active: true },
      select: { id: true, firstName: true, lastName: true, employeeId: true },
    });

    const userIds = users.map((u) => u.id);

    const [attendanceCount, vacationsCount, medicalLeavesCount, absencesCount] = await Promise.all([
      prisma.attendanceRecord.count({ where: { userId: { in: userIds }, date: { gte: from, lte: to } } }),
      prisma.vacation.count({ where: { userId: { in: userIds }, startDate: { gte: from, lte: to } } }),
      prisma.medicalLeave.count({ where: { userId: { in: userIds }, startDate: { gte: from, lte: to } } }),
      prisma.absence.count({ where: { userId: { in: userIds }, absenceDate: { gte: from, lte: to } } }),
    ]);

    return {
      departmentId,
      period: { from, to },
      employeeCount: users.length,
      employees: users,
      metrics: {
        attendanceRecords: attendanceCount,
        vacationRequests: vacationsCount,
        medicalLeaveRequests: medicalLeavesCount,
        absenceJustifications: absencesCount,
      },
    };
  }
}

export const reportsService = new ReportsService();
