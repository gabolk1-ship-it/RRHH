/**
 * Vacations Controller
 * Endpoints de solicitudes de vacaciones y antiguedad
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { vacationsService } from './vacations.service';
import { Permission } from '../../types/roles';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

const RequestVacationSchema = z.object({
  userId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
});

const RejectVacationSchema = z.object({
  reason: z.string().optional(),
});

function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    if (!user.permissions.includes(permission)) {
      return reply.status(403).send({ status: 'error', message: 'Permiso insuficiente' });
    }
  };
}

export async function vacationsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/vacations/balance/:userId
   * Obtener saldo de vacaciones disponible (calculo por antiguedad)
   */
  fastify.get(
    '/api/vacations/balance/:userId',
    { onRequest: [fastify.authenticate, requirePermission(Permission.VACATIONS_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = request.params as { userId: string };
        const balance = await vacationsService.getVacationBalance(userId);

        return reply.status(200).send({ status: 'success', data: { balance } });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error calculating balance',
        });
      }
    }
  );

  /**
   * POST /api/vacations
   * Solicitar vacaciones
   */
  fastify.post(
    '/api/vacations',
    { onRequest: [fastify.authenticate, requirePermission(Permission.VACATIONS_REQUEST)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = RequestVacationSchema.parse(request.body);

        const vacation = await vacationsService.requestVacation({
          userId: body.userId,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          reason: body.reason,
        });

        return reply.status(201).send({
          status: 'success',
          message: 'Solicitud de vacaciones creada',
          data: { vacation },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error requesting vacation',
        });
      }
    }
  );

  /**
   * POST /api/vacations/:id/approve
   * Aprobar solicitud de vacaciones
   */
  fastify.post(
    '/api/vacations/:id/approve',
    { onRequest: [fastify.authenticate, requirePermission(Permission.VACATIONS_APPROVE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const approverId = (request.user as any).sub;

        const vacation = await vacationsService.approveVacation(id, approverId);

        return reply.status(200).send({
          status: 'success',
          message: 'Vacaciones aprobadas',
          data: { vacation },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error approving vacation',
        });
      }
    }
  );

  /**
   * POST /api/vacations/:id/reject
   * Rechazar solicitud de vacaciones
   */
  fastify.post(
    '/api/vacations/:id/reject',
    { onRequest: [fastify.authenticate, requirePermission(Permission.VACATIONS_REJECT)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const approverId = (request.user as any).sub;
        const body = RejectVacationSchema.parse(request.body);

        const vacation = await vacationsService.rejectVacation(id, approverId, body.reason);

        return reply.status(200).send({
          status: 'success',
          message: 'Vacaciones rechazadas',
          data: { vacation },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error rejecting vacation',
        });
      }
    }
  );

  /**
   * GET /api/vacations/user/:userId
   * Historial de solicitudes de un usuario
   */
  fastify.get(
    '/api/vacations/user/:userId',
    { onRequest: [fastify.authenticate, requirePermission(Permission.VACATIONS_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = request.params as { userId: string };
        const vacations = await vacationsService.getVacationsByUser(userId);

        return reply.status(200).send({
          status: 'success',
          data: { vacations, total: vacations.length },
        });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error retrieving vacations' });
      }
    }
  );

  /**
   * GET /api/vacations/pending
   * Listar solicitudes pendientes de aprobacion
   */
  fastify.get(
    '/api/vacations/pending',
    { onRequest: [fastify.authenticate, requirePermission(Permission.VACATIONS_APPROVE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const limit = Math.min(parseInt((request.query as any).limit) || 100, 500);
        const offset = parseInt((request.query as any).offset) || 0;

        const result = await vacationsService.getPendingVacations(limit, offset);

        return reply.status(200).send({ status: 'success', data: result });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error retrieving pending vacations' });
      }
    }
  );
}
