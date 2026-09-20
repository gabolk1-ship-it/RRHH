/**
 * Absences Controller
 * Endpoints de justificacion digital de faltas
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { absencesService } from './absences.service';
import { Permission } from '../../types/roles';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

const RequestAbsenceSchema = z.object({
  userId: z.string().uuid(),
  absenceDate: z.string().datetime(),
  reason: z.string().min(3),
  documentUrl: z.string().url().optional(),
});

function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    if (!user.permissions.includes(permission)) {
      return reply.status(403).send({ status: 'error', message: 'Permiso insuficiente' });
    }
  };
}

export async function absencesRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/absences
   * Justificar una falta
   */
  fastify.post(
    '/api/absences',
    { onRequest: [fastify.authenticate, requirePermission(Permission.ABSENCES_REQUEST)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = RequestAbsenceSchema.parse(request.body);

        const absence = await absencesService.requestAbsence({
          userId: body.userId,
          absenceDate: new Date(body.absenceDate),
          reason: body.reason,
          documentUrl: body.documentUrl,
        });

        return reply.status(201).send({
          status: 'success',
          message: 'Justificacion registrada',
          data: { absence },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error requesting absence justification',
        });
      }
    }
  );

  /**
   * POST /api/absences/:id/approve
   */
  fastify.post(
    '/api/absences/:id/approve',
    { onRequest: [fastify.authenticate, requirePermission(Permission.ABSENCES_APPROVE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const approverId = (request.user as any).sub;

        const absence = await absencesService.approveAbsence(id, approverId);

        return reply.status(200).send({
          status: 'success',
          message: 'Justificacion aprobada',
          data: { absence },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error approving absence',
        });
      }
    }
  );

  /**
   * POST /api/absences/:id/reject
   */
  fastify.post(
    '/api/absences/:id/reject',
    { onRequest: [fastify.authenticate, requirePermission(Permission.ABSENCES_APPROVE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const approverId = (request.user as any).sub;

        const absence = await absencesService.rejectAbsence(id, approverId);

        return reply.status(200).send({
          status: 'success',
          message: 'Justificacion rechazada',
          data: { absence },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error rejecting absence',
        });
      }
    }
  );

  /**
   * GET /api/absences/user/:userId
   */
  fastify.get(
    '/api/absences/user/:userId',
    { onRequest: [fastify.authenticate, requirePermission(Permission.ABSENCES_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = request.params as { userId: string };
        const absences = await absencesService.getAbsencesByUser(userId);

        return reply.status(200).send({
          status: 'success',
          data: { absences, total: absences.length },
        });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error retrieving absences' });
      }
    }
  );

  /**
   * GET /api/absences/pending
   */
  fastify.get(
    '/api/absences/pending',
    { onRequest: [fastify.authenticate, requirePermission(Permission.ABSENCES_APPROVE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const limit = Math.min(parseInt((request.query as any).limit) || 100, 500);
        const offset = parseInt((request.query as any).offset) || 0;

        const result = await absencesService.getPendingAbsences(limit, offset);

        return reply.status(200).send({ status: 'success', data: result });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error retrieving pending absences' });
      }
    }
  );
}
