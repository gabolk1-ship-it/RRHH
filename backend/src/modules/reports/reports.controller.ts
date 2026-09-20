/**
 * Reports Controller
 * Endpoints de reportes y dashboard
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { reportsService } from './reports.service';
import { Permission } from '../../types/roles';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    if (!user.permissions.includes(permission)) {
      return reply.status(403).send({ status: 'error', message: 'Permiso insuficiente' });
    }
  };
}

function parseDateRange(query: any): { from: Date; to: Date } {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from ? new Date(query.from) : new Date(to.getFullYear(), to.getMonth(), 1);
  return { from, to };
}

export async function reportsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/reports/dashboard
   * Resumen general del sistema
   */
  fastify.get(
    '/api/reports/dashboard',
    { onRequest: [fastify.authenticate, requirePermission(Permission.REPORTS_VIEW)] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const summary = await reportsService.dashboardSummary();
        return reply.status(200).send({ status: 'success', data: { summary } });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error generating dashboard summary' });
      }
    }
  );

  /**
   * GET /api/reports/attendance/:userId
   * Reporte de asistencia de un usuario
   */
  fastify.get(
    '/api/reports/attendance/:userId',
    { onRequest: [fastify.authenticate, requirePermission(Permission.REPORTS_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = request.params as { userId: string };
        const { from, to } = parseDateRange(request.query);

        const report = await reportsService.attendanceReport(userId, from, to);

        return reply.status(200).send({ status: 'success', data: { report } });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error generating attendance report' });
      }
    }
  );

  /**
   * GET /api/reports/vacations
   * Reporte consolidado de vacaciones
   */
  fastify.get(
    '/api/reports/vacations',
    { onRequest: [fastify.authenticate, requirePermission(Permission.REPORTS_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { from, to } = parseDateRange(request.query);
        const report = await reportsService.vacationsReport(from, to);

        return reply.status(200).send({ status: 'success', data: { report } });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error generating vacations report' });
      }
    }
  );

  /**
   * GET /api/reports/medical-leaves
   * Reporte consolidado de permisos medicos
   */
  fastify.get(
    '/api/reports/medical-leaves',
    { onRequest: [fastify.authenticate, requirePermission(Permission.REPORTS_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { from, to } = parseDateRange(request.query);
        const report = await reportsService.medicalLeavesReport(from, to);

        return reply.status(200).send({ status: 'success', data: { report } });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error generating medical leaves report' });
      }
    }
  );

  /**
   * GET /api/reports/absences
   * Reporte consolidado de faltas
   */
  fastify.get(
    '/api/reports/absences',
    { onRequest: [fastify.authenticate, requirePermission(Permission.REPORTS_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { from, to } = parseDateRange(request.query);
        const report = await reportsService.absencesReport(from, to);

        return reply.status(200).send({ status: 'success', data: { report } });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error generating absences report' });
      }
    }
  );

  /**
   * GET /api/reports/department/:departmentId
   * Reporte por departamento
   */
  fastify.get(
    '/api/reports/department/:departmentId',
    { onRequest: [fastify.authenticate, requirePermission(Permission.REPORTS_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { departmentId } = request.params as { departmentId: string };
        const { from, to } = parseDateRange(request.query);

        const report = await reportsService.departmentReport(departmentId, from, to);

        return reply.status(200).send({ status: 'success', data: { report } });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error generating department report' });
      }
    }
  );
}
