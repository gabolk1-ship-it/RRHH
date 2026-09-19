/**
 * Users Service
 * Gestión de usuarios, migración y permisos
 */

import { UserRole, ROLE_PERMISSIONS, Permission } from '@types/roles';
import { authService } from '@modules/auth/auth.service';
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

// Mock en-memory database
const usersDatabase = new Map<string, any>();

export class UsersService {
  /**
   * Crear un usuario individual
   */
  async createUser(data: CreateUserDTO): Promise<UserDTO> {
    // Validar email único
    const existingUser = Array.from(usersDatabase.values()).find(u => u.email === data.email);
    if (existingUser) {
      throw new Error(`Usuario con email ${data.email} ya existe`);
    }

    // Validar rol válido
    if (!Object.values(UserRole).includes(data.role)) {
      throw new Error(`Rol ${data.role} no válido`);
    }

    // Hash de contraseña (generar aleatorio si no se proporciona)
    const password = data.password || this.generateTemporaryPassword();
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const user = {
      id: crypto.randomUUID(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      permissions: ROLE_PERMISSIONS[data.role],
      passwordHash,
      active: true,
      departmentId: data.departmentId,
      employeeId: data.employeeId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Guardar en "BD"
    usersDatabase.set(user.id, user);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Importación masiva de usuarios (CSV/Excel parseado)
   * Ideal para migración de sistemas antiguos
   */
  async importMultipleUsers(users: BulkUserImportDTO[]): Promise<ImportResult> {
    const result: ImportResult = {
      total: users.length,
      successful: 0,
      failed: 0,
      errors: [],
      users: []
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
        const existing = Array.from(usersDatabase.values()).find(u => u.email === userData.email);
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
          employeeId: userData.employeeId
        });

        result.users.push(user);
        result.successful++;

      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          email: users[i].email,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    return result;
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(id: string): Promise<UserDTO | null> {
    const user = usersDatabase.get(id);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email: string): Promise<UserDTO | null> {
    const user = Array.from(usersDatabase.values()).find(u => u.email === email);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Listar todos los usuarios
   */
  async listUsers(limit = 100, offset = 0): Promise<{ users: UserDTO[]; total: number }> {
    const allUsers = Array.from(usersDatabase.values());
    const total = allUsers.length;
    const users = allUsers.slice(offset, offset + limit).map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    return { users, total };
  }

  /**
   * Actualizar usuario
   */
  async updateUser(id: string, updates: Partial<CreateUserDTO>): Promise<UserDTO> {
    const user = usersDatabase.get(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Validar cambio de email
    if (updates.email && updates.email !== user.email) {
      const existing = Array.from(usersDatabase.values()).find(
        u => u.email === updates.email && u.id !== id
      );
      if (existing) {
        throw new Error('Email ya existe en el sistema');
      }
    }

    // Validar rol
    if (updates.role && !Object.values(UserRole).includes(updates.role)) {
      throw new Error(`Rol ${updates.role} no válido`);
    }

    // Actualizar campos
    if (updates.email) user.email = updates.email;
    if (updates.firstName) user.firstName = updates.firstName;
    if (updates.lastName) user.lastName = updates.lastName;
    if (updates.role) {
      user.role = updates.role;
      user.permissions = ROLE_PERMISSIONS[updates.role];
    }
    if (updates.password) {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
      user.passwordHash = await bcrypt.hash(updates.password, saltRounds);
    }
    user.updatedAt = new Date();

    usersDatabase.set(id, user);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
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
    const user = usersDatabase.get(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    user.active = false;
    user.updatedAt = new Date();
    usersDatabase.set(id, user);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Reactivar usuario
   */
  async activateUser(id: string): Promise<UserDTO> {
    const user = usersDatabase.get(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    user.active = true;
    user.updatedAt = new Date();
    usersDatabase.set(id, user);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * Listar usuarios por rol
   */
  async getUsersByRole(role: UserRole): Promise<UserDTO[]> {
    const users = Array.from(usersDatabase.values())
      .filter(u => u.role === role)
      .map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions,
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));

    return users;
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
