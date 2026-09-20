/**
 * Medical Leaves Controller
 * Endpoints de permisos medicos con granularidad de horas
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { medicalLeavesService } from './medical-leaves.service';
import { Permission } from '../../types/roles';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

const TimeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const RequestMedicalLeaveSchema = z.object({
  userId: z.string().uuid(),
  startDate: z.string().datetime(),
  startTime: z.string().regex(TimeRegex).optional(),
  endDate: z.string().datetime(),
  endTime: z.string().regex(TimeRegex).optional(),
  reason: z.string().min(3),
  certificateUrl: z.string().url().optional(),
});

function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    if (!user.permissions.includes(permission)) {
      return reply.status(403).send({ status: 'error', message: 'Permiso insuficiente' });
    }
  };
}

export async function medicalLeavesRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/medical-leaves
   * Solicitar permiso medico (dias u horas)
   */
  fastify.post(
    '/api/medical-leaves',
    { onRequest: [fastify.authenticate, requirePermission(Permission.MEDICAL_LEAVES_REQUEST)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = RequestMedicalLeaveSchema.parse(request.body);

        const leave = await medicalLeavesService.requestMedicalLeave({
          userId: body.userId,
          startDate: new Date(body.startDate),
          startTime: body.startTime,
          endDate: new Date(body.endDate),
          endTime: body.endTime,
          reason: body.reason,
          certificateUrl: body.certificateUrl,
        });

        const hours = medicalLeavesService.calculateHours(
          leave.startDate,
          leave.startTime ?? undefined,
          leave.endDate,
          leave.endTime ?? undefined
        );

        return reply.status(201).send({
          status: 'success',
          message: 'Permiso medico solicitado',
          data: { leave, calculatedHours: hours },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error requesting medical leave',
        });
      }
    }
  );

  /**
   * POST /api/medical-leaves/:id/approve
   */
  fastify.post(
    '/api/medical-leaves/:id/approve',
    { onRequest: [fastify.authenticate, requirePermission(Permission.MEDICAL_LEAVES_APPROVE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const approverId = (request.user as any).sub;

        const leave = await medicalLeavesService.approveMedicalLeave(id, approverId);

        return reply.status(200).send({
          status: 'success',
          message: 'Permiso medico aprobado',
          data: { leave },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error approving medical leave',
        });
      }
    }
  );

  /**
   * POST /api/medical-leaves/:id/reject
   */
  fastify.post(
    '/api/medical-leaves/:id/reject',
    { onRequest: [fastify.authenticate, requirePermission(Permission.MEDICAL_LEAVES_APPROVE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const approverId = (request.user as any).sub;

        const leave = await medicalLeavesService.rejectMedicalLeave(id, approverId);

        return reply.status(200).send({
          status: 'success',
          message: 'Permiso medico rechazado',
          data: { leave },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error rejecting medical leave',
        });
      }
    }
  );

  /**
   * GET /api/medical-leaves/user/:userId
   */
  fastify.get(
    '/api/medical-leaves/user/:userId',
    { onRequest: [fastify.authenticate, requirePermission(Permission.MEDICAL_LEAVES_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = request.params as { userId: string };
        const leaves = await medicalLeavesService.getLeavesByUser(userId);

        return reply.status(200).send({
          status: 'success',
          data: { leaves, total: leaves.length },
        });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error retrieving medical leaves' });
      }
    }
  );

  /**
   * GET /api/medical-leaves/pending
   */
  fastify.get(
    '/api/medical-leaves/pending',
    { onRequest: [fastify.authenticate, requirePermission(Permission.MEDICAL_LEAVES_APPROVE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const limit = Math.min(parseInt((request.query as any).limit) || 100, 500);
        const offset = parseInt((request.query as any).offset) || 0;

        const result = await medicalLeavesService.getPendingLeaves(limit, offset);

        return reply.status(200).send({ status: 'success', data: result });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error retrieving pending medical leaves' });
      }
    }
  );
}
