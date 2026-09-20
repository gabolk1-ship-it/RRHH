/**
 * Schedules Controller
 * Endpoints de gestion de horarios y turnos
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { schedulesService } from './schedules.service';
import { Permission } from '../../types/roles';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

const CreateScheduleSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(2),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  monday: z.boolean().optional(),
  tuesday: z.boolean().optional(),
  wednesday: z.boolean().optional(),
  thursday: z.boolean().optional(),
  friday: z.boolean().optional(),
  saturday: z.boolean().optional(),
  sunday: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const UpdateScheduleSchema = CreateScheduleSchema.partial().omit({ userId: true });

function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    if (!user.permissions.includes(permission)) {
      return reply.status(403).send({ status: 'error', message: 'Permiso insuficiente' });
    }
  };
}

export async function schedulesRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/schedules
   * Crear un horario para un usuario (soporta multiples horarios por usuario)
   */
  fastify.post(
    '/api/schedules',
    { onRequest: [fastify.authenticate, requirePermission(Permission.SCHEDULES_CREATE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = CreateScheduleSchema.parse(request.body);

        const schedule = await schedulesService.createSchedule({
          ...body,
          startDate: body.startDate ? new Date(body.startDate) : undefined,
          endDate: body.endDate ? new Date(body.endDate) : undefined,
        });

        return reply.status(201).send({
          status: 'success',
          message: 'Horario creado exitosamente',
          data: { schedule },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error creating schedule',
        });
      }
    }
  );

  /**
   * GET /api/schedules/user/:userId
   * Obtener todos los horarios de un usuario
   */
  fastify.get(
    '/api/schedules/user/:userId',
    { onRequest: [fastify.authenticate, requirePermission(Permission.SCHEDULES_READ)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = request.params as { userId: string };
        const activeOnly = (request.query as any).activeOnly === 'true';

        const schedules = await schedulesService.getSchedulesByUser(userId, activeOnly);

        return reply.status(200).send({
          status: 'success',
          data: { schedules, total: schedules.length },
        });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error retrieving schedules' });
      }
    }
  );

  /**
   * GET /api/schedules
   * Listar todos los horarios activos
   */
  fastify.get(
    '/api/schedules',
    { onRequest: [fastify.authenticate, requirePermission(Permission.SCHEDULES_READ)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const limit = Math.min(parseInt((request.query as any).limit) || 100, 500);
        const offset = parseInt((request.query as any).offset) || 0;

        const result = await schedulesService.listActiveSchedules(limit, offset);

        return reply.status(200).send({ status: 'success', data: result });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error listing schedules' });
      }
    }
  );

  /**
   * PUT /api/schedules/:id
   * Actualizar un horario
   */
  fastify.put(
    '/api/schedules/:id',
    { onRequest: [fastify.authenticate, requirePermission(Permission.SCHEDULES_UPDATE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const body = UpdateScheduleSchema.parse(request.body);

        const schedule = await schedulesService.updateSchedule(id, {
          ...body,
          startDate: body.startDate ? new Date(body.startDate) : undefined,
          endDate: body.endDate ? new Date(body.endDate) : undefined,
        });

        return reply.status(200).send({
          status: 'success',
          message: 'Horario actualizado',
          data: { schedule },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error updating schedule',
        });
      }
    }
  );

  /**
   * DELETE /api/schedules/:id
   * Desactivar un horario
   */
  fastify.delete(
    '/api/schedules/:id',
    { onRequest: [fastify.authenticate, requirePermission(Permission.SCHEDULES_DELETE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const schedule = await schedulesService.deactivateSchedule(id);

        return reply.status(200).send({
          status: 'success',
          message: 'Horario desactivado',
          data: { schedule },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error deleting schedule',
        });
      }
    }
  );
}
