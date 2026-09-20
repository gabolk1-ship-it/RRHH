/**
 * Users Service (Prisma - Database)
 * Gestión de usuarios con Prisma ORM y PostgreSQL
 */

import { prisma } from '../../lib/prisma';
import { UserRole, ROLE_PERMISSIONS, Permission } from '../../types/roles';
import bcrypt from 'bcryptjs';

export interface CreateUserDTO {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  role: UserRole;
  departmentId?: string;
  employeeId?: string;
}

export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkUserImportDTO {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId?: string;
  employeeId?: string;
  password?: string;
}

export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  users: UserDTO[];
}

export class UsersService {
  /**
   * Crear un usuario individual
   */
  async createUser(data: CreateUserDTO): Promise<UserDTO> {
    // Validar email único
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new Error(`Usuario con email ${data.email} ya existe`);
    }

    // Validar rol válido
    if (!Object.values(UserRole).includes(data.role)) {
      throw new Error(`Rol ${data.role} no válido`);
    }

    // Hash de contraseña
    const password = data.password || this.generateTemporaryPassword();
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash,
        role: data.role,
        departmentId: data.departmentId,
        employeeId: data.employeeId,
        active: true,
      },
    });

    return this.mapUserToDTO(user);
  }

  /**
   * Importación masiva de usuarios
   */
  async importMultipleUsers(users: BulkUserImportDTO[]): Promise<ImportResult> {
    const result: ImportResult = {
      total: users.length,
      successful: 0,
      failed: 0,
      errors: [],
      users: [],
    };

    for (let i = 0; i < users.length; i++) {
      try {
        const userData = users[i];

        // Validaciones
        if (!userData.email || !userData.firstName || !userData.lastName) {
          throw new Error('Email, firstName y lastName son requeridos');
        }

        if (!Object.values(UserRole).includes(userData.role)) {
          throw new Error(`Rol ${userData.role} no válido`);
        }

        // Verificar email único
        const existing = await prisma.user.findUnique({
          where: { email: userData.email },
        });
        if (existing) {
          throw new Error('Email ya existe en el sistema');
        }

        // Crear usuario
        const user = await this.createUser({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          password: userData.password || this.generateTemporaryPassword(),
          role: userData.role,
          departmentId: userData.departmentId,
          employeeId: userData.employeeId,
        });

        result.users.push(user);
        result.successful++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          email: users[i].email,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return result;
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(id: string): Promise<UserDTO | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user ? this.mapUserToDTO(user) : null;
  }

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email: string): Promise<UserDTO | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user ? this.mapUserToDTO(user) : null;
  }

  /**
   * Listar todos los usuarios
   */
  async listUsers(limit = 100, offset = 0): Promise<{ users: UserDTO[]; total: number }> {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return {
      users: users.map(user => this.mapUserToDTO(user)),
      total,
    };
  }

  /**
   * Actualizar usuario
   */
  async updateUser(id: string, updates: Partial<CreateUserDTO>): Promise<UserDTO> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Validar cambio de email
    if (updates.email && updates.email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: updates.email },
      });
      if (existing) {
        throw new Error('Email ya existe en el sistema');
      }
    }

    // Validar rol
    if (updates.role && !Object.values(UserRole).includes(updates.role)) {
      throw new Error(`Rol ${updates.role} no válido`);
    }

    // Preparar datos para actualizar
    const updateData: any = {};
    if (updates.email) updateData.email = updates.email;
    if (updates.firstName) updateData.firstName = updates.firstName;
    if (updates.lastName) updateData.lastName = updates.lastName;
    if (updates.role) updateData.role = updates.role;

    if (updates.password) {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
      updateData.passwordHash = await bcrypt.hash(updates.password, saltRounds);
    }

    // Actualizar
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return this.mapUserToDTO(updatedUser);
  }

  /**
   * Cambiar rol de usuario
   */
  async changeUserRole(userId: string, newRole: UserRole): Promise<UserDTO> {
    return this.updateUser(userId, { role: newRole });
  }

  /**
   * Desactivar usuario
   */
  async deactivateUser(id: string): Promise<UserDTO> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const deactivated = await prisma.user.update({
      where: { id },
      data: { active: false },
    });

    return this.mapUserToDTO(deactivated);
  }

  /**
   * Reactivar usuario
   */
  async activateUser(id: string): Promise<UserDTO> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const activated = await prisma.user.update({
      where: { id },
      data: { active: true },
    });

    return this.mapUserToDTO(activated);
  }

  /**
   * Listar usuarios por rol
   */
  async getUsersByRole(role: UserRole): Promise<UserDTO[]> {
    const users = await prisma.user.findMany({
      where: { role },
    });

    return users.map(user => this.mapUserToDTO(user));
  }

  /**
   * Obtener usuario con contraseña (para login)
   */
  async getUserByEmailWithPassword(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Mapear usuario de BD a DTO
   */
  private mapUserToDTO(user: any): UserDTO {
    const userRole = user.role as UserRole;
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: userRole,
      permissions: ROLE_PERMISSIONS[userRole],
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Generar contraseña temporal
   */
  private generateTemporaryPassword(): string {
    const length = 12;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

// Exportar singleton
export const usersService = new UsersService();
