/**
 * Auth Controller
 * Endpoints de autenticación
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authService } from './auth.service.prisma';
import { usersService } from '@modules/users/users.service.prisma';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

// Esquemas de validación
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const RegisterSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'SUPERVISOR', 'EMPLOYEE']).optional()
});

const RefreshSchema = z.object({
  refreshToken: z.string()
});

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/auth/login
   * Login de usuario - Genera JWT tokens
   */
  fastify.post('/api/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = LoginSchema.parse(request.body);

      const result = await authService.login(body.email, body.password);

      return reply.status(200).send({
        status: 'success',
        data: {
          user: result.user,
          tokens: result.tokens
        }
      });
    } catch (error) {
      return reply.status(401).send({
        status: 'error',
        message: error instanceof Error ? error.message : 'Login failed'
      });
    }
  });

  /**
   * POST /api/auth/register
   * Registrar nuevo usuario
   */
  fastify.post('/api/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = RegisterSchema.parse(request.body);

      const user = await usersService.createUser({
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        password: body.password,
        role: (body.role as any) || 'EMPLOYEE'
      });

      return reply.status(201).send({
        status: 'success',
        message: 'Usuario creado exitosamente',
        data: { user }
      });
    } catch (error) {
      return reply.status(400).send({
        status: 'error',
        message: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  });

  /**
   * POST /api/auth/refresh
   * Refrescar access token
   */
  fastify.post('/api/auth/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = RefreshSchema.parse(request.body);

      const tokens = await authService.refreshAccessToken(body.refreshToken);

      return reply.status(200).send({
        status: 'success',
        data: { tokens }
      });
    } catch (error) {
      return reply.status(401).send({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout (en producción: invalidar refresh token en BD)
   */
  fastify.post('/api/auth/logout', { onRequest: [fastify.authenticate] }, async (_request: FastifyRequest, reply: FastifyReply) => {
    // En producción: invalidar refresh token en BD
    return reply.status(200).send({
      status: 'success',
      message: 'Logout exitoso'
    });
  });

  /**
   * GET /api/auth/me
   * Obtener datos del usuario autenticado
   */
  fastify.get('/api/auth/me', { onRequest: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).sub;
      const user = await usersService.getUserById(userId);

      if (!user) {
        return reply.status(404).send({
          status: 'error',
          message: 'Usuario no encontrado'
        });
      }

      return reply.status(200).send({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      return reply.status(500).send({
        status: 'error',
        message: 'Error retrieving user'
      });
    }
  });
}
