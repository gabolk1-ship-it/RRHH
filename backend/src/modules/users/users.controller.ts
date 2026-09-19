/**
 * Users Controller
 * Endpoints de gestión de usuarios y migración
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { usersService, CreateUserDTO, BulkUserImportDTO } from './users.service';
import { Permission, UserRole } from '@types/roles';

// Esquemas de validación
const CreateUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  password: z.string().min(8).optional(),
  role: z.enum(['ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'SUPERVISOR', 'EMPLOYEE']),
  departmentId: z.string().optional(),
  employeeId: z.string().optional()
});

const BulkImportSchema = z.object({
  users: z.array(
    z.object({
      email: z.string().email(),
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      role: z.enum(['ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'SUPERVISOR', 'EMPLOYEE']),
      departmentId: z.string().optional(),
      employeeId: z.string().optional(),
      password: z.string().optional()
    })
  ).min(1).max(1000)
});

const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'SUPERVISOR', 'EMPLOYEE']).optional()
});

const ChangeRoleSchema = z.object({
  newRole: z.enum(['ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'SUPERVISOR', 'EMPLOYEE'])
});

/**
 * Verificar permiso del usuario
 */
function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request.user as any);
    if (!user.permissions.includes(permission)) {
      return reply.status(403).send({
        status: 'error',
        message: 'Permiso insuficiente'
      });
    }
  };
}

export async function usersRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/users
   * Crear un usuario individual
   */
  fastify.post(
    '/api/users',
    { onRequest: [fastify.authenticate, requirePermission(Permission.USERS_CREATE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = CreateUserSchema.parse(request.body);

        const user = await usersService.createUser({
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          password: body.password,
          role: body.role as UserRole,
          departmentId: body.departmentId,
          employeeId: body.employeeId
        });

        return reply.status(201).send({
          status: 'success',
          message: 'Usuario creado exitosamente',
          data: { user }
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error creating user'
        });
      }
    }
  );

  /**
   * POST /api/users/import
   * Importar múltiples usuarios (Migración masiva)
   *
   * Ejemplo:
   * {
   *   "users": [
   *     {
   *       "email": "juan@hospital.ec",
   *       "firstName": "Juan",
   *       "lastName": "Pérez",
   *       "role": "EMPLOYEE",
   *       "employeeId": "EMP001",
   *       "departmentId": "dept-123"
   *     },
   *     ...
   *   ]
   * }
   */
  fastify.post(
    '/api/users/import',
    { onRequest: [fastify.authenticate, requirePermission(Permission.USERS_IMPORT)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = BulkImportSchema.parse(request.body);

        // Convertir a DTO
        const usersToImport: BulkUserImportDTO[] = body.users.map(u => ({
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role as UserRole,
          departmentId: u.departmentId,
          employeeId: u.employeeId,
          password: u.password
        }));

        // Importar
        const result = await usersService.importMultipleUsers(usersToImport);

        // Registrar en auditoría
        console.log(`[AUDIT] Importación de usuarios: ${result.successful} exitosos, ${result.failed} fallidos`);

        return reply.status(200).send({
          status: 'success',
          message: `Importación completada: ${result.successful} usuarios creados, ${result.failed} errores`,
          data: result
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error importing users'
        });
      }
    }
  );

  /**
   * GET /api/users
   * Listar todos los usuarios
   */
  fastify.get(
    '/api/users',
    { onRequest: [fastify.authenticate, requirePermission(Permission.USERS_READ)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const limit = Math.min(parseInt((request.query as any).limit) || 100, 500);
        const offset = parseInt((request.query as any).offset) || 0;

        const result = await usersService.listUsers(limit, offset);

        return reply.status(200).send({
          status: 'success',
          data: result
        });
      } catch (error) {
        return reply.status(500).send({
          status: 'error',
          message: 'Error listing users'
        });
      }
    }
  );

  /**
   * GET /api/users/:id
   * Obtener usuario por ID
   */
  fastify.get(
    '/api/users/:id',
    { onRequest: [fastify.authenticate, requirePermission(Permission.USERS_READ)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const user = await usersService.getUserById(id);

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
    }
  );

  /**
   * PUT /api/users/:id
   * Actualizar usuario
   */
  fastify.put(
    '/api/users/:id',
    { onRequest: [fastify.authenticate, requirePermission(Permission.USERS_UPDATE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const body = UpdateUserSchema.parse(request.body);

        const user = await usersService.updateUser(id, body as Partial<CreateUserDTO>);

        return reply.status(200).send({
          status: 'success',
          message: 'Usuario actualizado',
          data: { user }
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error updating user'
        });
      }
    }
  );

  /**
   * POST /api/users/:id/role
   * Cambiar rol del usuario
   */
  fastify.post(
    '/api/users/:id/role',
    { onRequest: [fastify.authenticate, requirePermission(Permission.ROLES_ASSIGN)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const body = ChangeRoleSchema.parse(request.body);

        const user = await usersService.changeUserRole(id, body.newRole as UserRole);

        // Auditoría
        console.log(`[AUDIT] Cambio de rol para usuario ${id}: ${body.newRole}`);

        return reply.status(200).send({
          status: 'success',
          message: 'Rol actualizado',
          data: { user }
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error changing role'
        });
      }
    }
  );

  /**
   * POST /api/users/:id/deactivate
   * Desactivar usuario
   */
  fastify.post(
    '/api/users/:id/deactivate',
    { onRequest: [fastify.authenticate, requirePermission(Permission.USERS_DELETE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const user = await usersService.deactivateUser(id);

        console.log(`[AUDIT] Usuario desactivado: ${id}`);

        return reply.status(200).send({
          status: 'success',
          message: 'Usuario desactivado',
          data: { user }
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error deactivating user'
        });
      }
    }
  );

  /**
   * POST /api/users/:id/activate
   * Reactivar usuario
   */
  fastify.post(
    '/api/users/:id/activate',
    { onRequest: [fastify.authenticate, requirePermission(Permission.USERS_DELETE)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const user = await usersService.activateUser(id);

        console.log(`[AUDIT] Usuario reactivado: ${id}`);

        return reply.status(200).send({
          status: 'success',
          message: 'Usuario reactivado',
          data: { user }
        });
      } catch (error) {
        return reply.status(400).send({
          status: 'error',
          message: error instanceof Error ? error.message : 'Error activating user'
        });
      }
    }
  );

  /**
   * GET /api/users/role/:role
   * Listar usuarios por rol
   */
  fastify.get(
    '/api/users/role/:role',
    { onRequest: [fastify.authenticate, requirePermission(Permission.USERS_READ)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { role } = request.params as { role: string };

        if (!Object.values(UserRole).includes(role as UserRole)) {
          return reply.status(400).send({
            status: 'error',
            message: 'Rol no válido'
          });
        }

        const users = await usersService.getUsersByRole(role as UserRole);

        return reply.status(200).send({
          status: 'success',
          data: { users, total: users.length }
        });
      } catch (error) {
        return reply.status(500).send({
          status: 'error',
          message: 'Error listing users by role'
        });
      }
    }
  );
}
