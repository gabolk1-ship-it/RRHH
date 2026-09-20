/**
 * Attendance Controller
 * Endpoints de registro de asistencia biometrica
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { attendanceService } from './attendance.service';
import { Permission } from '../../types/roles';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

const RecordEntrySchema = z.object({
  userId: z.string().uuid(),
  entryTime: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const RecordExitSchema = z.object({
  userId: z.string().uuid(),
  exitTime: z.string().datetime().optional(),
});

const ManualRecordSchema = z.object({
  userId: z.string().uuid(),
  date: z.string().datetime(),
  entryTime: z.string().datetime(),
  exitTime: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const CorrectRecordSchema = z.object({
  entryTime: z.string().datetime().optional(),
  exitTime: z.string().datetime().optional(),
  notes: z.string().optional(),
});

function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    if (!user.permissions.includes(permission)) {
      return reply.status(403).send({ status: 'error', message: 'Permiso insuficiente' });
    }
  };
}

export async function attendanceRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/attendance/entry
   * Registrar marcacion de entrada (biometrico o manual)
   */
  fastify.post(
    '/api/attendance/entry',
    { onRequest: [fastify.authenticate, requirePermission(Permission.ATTENDANCE_RECORD)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = RecordEntrySchema.parse(request.body);

        const record = await attendanceService.recordEntry({
          userId: body.userId,
          entryTime: body.entryTime ? new Date(body.entryTime) : undefined,
          notes: body.notes,
        });

        return reply.status(201).send({
          status: 'success',
          message: 'Entrada registrada',
          data: { record },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error recording entry',
        });
      }
    }
  );

  /**
   * POST /api/attendance/exit
   * Registrar marcacion de salida (biometrico o manual)
   */
  fastify.post(
    '/api/attendance/exit',
    { onRequest: [fastify.authenticate, requirePermission(Permission.ATTENDANCE_RECORD)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = RecordExitSchema.parse(request.body);

        const record = await attendanceService.recordExit({
          userId: body.userId,
          exitTime: body.exitTime ? new Date(body.exitTime) : undefined,
        });

        return reply.status(200).send({
          status: 'success',
          message: 'Salida registrada',
          data: { record },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error recording exit',
        });
      }
    }
  );

  /**
   * POST /api/attendance/manual
   * Crear un registro manual (retroactivo)
   */
  fastify.post(
    '/api/attendance/manual',
    { onRequest: [fastify.authenticate, requirePermission(Permission.ATTENDANCE_MANUAL)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = ManualRecordSchema.parse(request.body);

        const record = await attendanceService.createManualRecord({
          userId: body.userId,
          date: new Date(body.date),
          entryTime: new Date(body.entryTime),
          exitTime: body.exitTime ? new Date(body.exitTime) : undefined,
          notes: body.notes,
        });

        return reply.status(201).send({
          status: 'success',
          message: 'Registro manual creado',
          data: { record },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error creating manual record',
        });
      }
    }
  );

  /**
   * PUT /api/attendance/:id/correct
   * Corregir un registro de asistencia existente
   */
  fastify.put(
    '/api/attendance/:id/correct',
    { onRequest: [fastify.authenticate, requirePermission(Permission.ATTENDANCE_CORRECT)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const body = CorrectRecordSchema.parse(request.body);

        const record = await attendanceService.correctRecord(id, {
          entryTime: body.entryTime ? new Date(body.entryTime) : undefined,
          exitTime: body.exitTime ? new Date(body.exitTime) : undefined,
          notes: body.notes,
        });

        return reply.status(200).send({
          status: 'success',
          message: 'Registro corregido',
          data: { record },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error correcting record',
        });
      }
    }
  );

  /**
   * GET /api/attendance/user/:userId
   * Obtener historial de asistencia de un usuario
   */
  fastify.get(
    '/api/attendance/user/:userId',
    { onRequest: [fastify.authenticate, requirePermission(Permission.ATTENDANCE_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = request.params as { userId: string };
        const { from, to } = request.query as { from?: string; to?: string };

        const records = await attendanceService.getRecordsByUser(
          userId,
          from ? new Date(from) : undefined,
          to ? new Date(to) : undefined
        );

        return reply.status(200).send({
          status: 'success',
          data: { records, total: records.length },
        });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error retrieving records' });
      }
    }
  );

  /**
   * GET /api/attendance/date/:date
   * Obtener todos los registros de un dia (vista administrativa)
   */
  fastify.get(
    '/api/attendance/date/:date',
    { onRequest: [fastify.authenticate, requirePermission(Permission.ATTENDANCE_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { date } = request.params as { date: string };
        const limit = Math.min(parseInt((request.query as any).limit) || 200, 1000);
        const offset = parseInt((request.query as any).offset) || 0;

        const result = await attendanceService.getRecordsByDate(new Date(date), limit, offset);

        return reply.status(200).send({ status: 'success', data: result });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error retrieving records' });
      }
    }
  );

  /**
   * GET /api/attendance/open/:userId
   * Verificar si un usuario tiene un registro de entrada abierto (sin salida)
   */
  fastify.get(
    '/api/attendance/open/:userId',
    { onRequest: [fastify.authenticate, requirePermission(Permission.ATTENDANCE_VIEW)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = request.params as { userId: string };
        const record = await attendanceService.getOpenRecord(userId);

        return reply.status(200).send({
          status: 'success',
          data: { record, hasOpenRecord: !!record },
        });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error checking open record' });
      }
    }
  );
}
