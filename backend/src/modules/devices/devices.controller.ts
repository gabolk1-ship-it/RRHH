/**
 * Devices Controller
 * Endpoints de gestion de dispositivos biometricos
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { devicesService } from './devices.service';
import { Permission } from '../../types/roles';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

const CreateDeviceSchema = z.object({
  name: z.string().min(2),
  deviceType: z.enum(['FINGERPRINT', 'FACIAL_RECOGNITION', 'HYBRID']),
  serialNumber: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  location: z.string().optional(),
});

const UpdateDeviceSchema = z.object({
  name: z.string().min(2).optional(),
  ipAddress: z.string().ip().optional(),
  location: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'ERROR']).optional(),
});

function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    if (!user.permissions.includes(permission)) {
      return reply.status(403).send({ status: 'error', message: 'Permiso insuficiente' });
    }
  };
}

export async function devicesRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/devices
   * Registrar un dispositivo biometrico
   */
  fastify.post(
    '/api/devices',
    { onRequest: [fastify.authenticate, requirePermission(Permission.DEVICES_MANAGE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = CreateDeviceSchema.parse(request.body);
        const device = await devicesService.registerDevice(body);

        return reply.status(201).send({
          status: 'success',
          message: 'Dispositivo registrado',
          data: { device },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error registering device',
        });
      }
    }
  );

  /**
   * GET /api/devices
   * Listar dispositivos
   */
  fastify.get(
    '/api/devices',
    { onRequest: [fastify.authenticate, requirePermission(Permission.DEVICES_MANAGE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const limit = Math.min(parseInt((request.query as any).limit) || 100, 500);
        const offset = parseInt((request.query as any).offset) || 0;

        const result = await devicesService.listDevices(limit, offset);

        return reply.status(200).send({ status: 'success', data: result });
      } catch (error) {
        return reply.status(500).send({ status: 'error', message: 'Error listing devices' });
      }
    }
  );

  /**
   * PUT /api/devices/:id
   * Actualizar configuracion de un dispositivo
   */
  fastify.put(
    '/api/devices/:id',
    { onRequest: [fastify.authenticate, requirePermission(Permission.DEVICES_CONFIG)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const body = UpdateDeviceSchema.parse(request.body);

        const device = await devicesService.updateDevice(id, body);

        return reply.status(200).send({
          status: 'success',
          message: 'Dispositivo actualizado',
          data: { device },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error updating device',
        });
      }
    }
  );

  /**
   * POST /api/devices/:id/sync
   * Registrar sincronizacion del dispositivo
   */
  fastify.post(
    '/api/devices/:id/sync',
    { onRequest: [fastify.authenticate, requirePermission(Permission.DEVICES_SYNC)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const device = await devicesService.recordSync(id);

        return reply.status(200).send({
          status: 'success',
          message: 'Sincronizacion registrada',
          data: { device },
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error syncing device',
        });
      }
    }
  );

  /**
   * DELETE /api/devices/:id
   * Eliminar un dispositivo
   */
  fastify.delete(
    '/api/devices/:id',
    { onRequest: [fastify.authenticate, requirePermission(Permission.DEVICES_MANAGE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        await devicesService.deleteDevice(id);

        return reply.status(200).send({ status: 'success', message: 'Dispositivo eliminado' });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error deleting device',
        });
      }
    }
  );
}
