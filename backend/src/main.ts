/**
 * Application Entry Point
 * Initialize Fastify server with authentication and routes
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import { authRoutes } from '@modules/auth/auth.controller';
import { usersRoutes } from '@modules/users/users.controller';
import { schedulesRoutes } from '@modules/schedules/schedules.controller';
import { attendanceRoutes } from '@modules/attendance/attendance.controller';
import { vacationsRoutes } from '@modules/vacations/vacations.controller';
import { medicalLeavesRoutes } from '@modules/medical-leaves/medical-leaves.controller';
import { absencesRoutes } from '@modules/absences/absences.controller';
import { devicesRoutes } from '@modules/devices/devices.controller';
import { reportsRoutes } from '@modules/reports/reports.controller';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

async function build(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    }
  });

  // Register CORS
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true
  });

  // Register JWT plugin
  await fastify.register(jwt, {
    secret: JWT_SECRET,
    sign: {
      expiresIn: '15m'
    }
  });

  // Extend Fastify with authentication decorator
  fastify.decorate('authenticate', async function (request: FastifyRequest, _reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (_error) {
      return _reply.status(401).send({
        status: 'error',
        message: 'Unauthorized'
      });
    }
  });

  // Global error handler
  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);

    if (error.statusCode === 401) {
      return reply.status(401).send({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    if (error.statusCode === 403) {
      return reply.status(403).send({
        status: 'error',
        message: 'Forbidden'
      });
    }

    return reply.status(error.statusCode || 500).send({
      status: 'error',
      message: error.message || 'Internal Server Error'
    });
  });

  // Health check endpoint
  fastify.get('/health', async (_request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });

  // Register routes
  await fastify.register(authRoutes);
  await fastify.register(usersRoutes);
  await fastify.register(schedulesRoutes);
  await fastify.register(attendanceRoutes);
  await fastify.register(vacationsRoutes);
  await fastify.register(medicalLeavesRoutes);
  await fastify.register(absencesRoutes);
  await fastify.register(devicesRoutes);
  await fastify.register(reportsRoutes);

  return fastify;
}

async function start() {
  try {
    const fastify = await build();

    await fastify.listen({ port: PORT, host: HOST });

    console.log('RRHH - Sistema de Control de Asistencia Biometrica');
    console.log('Servidor iniciado correctamente');
    console.log('----------------------------------------------------');
    console.log(`API:     http://${HOST}:${PORT}`);
    console.log(`Health:  http://${HOST}:${PORT}/health`);
    console.log('Modulos: auth, users, schedules, attendance, vacations,');
    console.log('         medical-leaves, absences, devices, reports');
    console.log('----------------------------------------------------');

    // Graceful shutdown
    const signals = ['SIGTERM', 'SIGINT'];
    for (const signal of signals) {
      process.on(signal, async () => {
        console.log(`\n${signal} received, shutting down gracefully...`);
        await fastify.close();
        process.exit(0);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
start().catch(console.error);

export { build };
