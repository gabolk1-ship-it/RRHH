/**
 * Auth Service (Prisma - Database)
 * Autenticación con JWT usando Prisma ORM y PostgreSQL
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { JWTPayload, UserRole, ROLE_PERMISSIONS } from '../../types/roles';

interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    active: boolean;
  };
  tokens: AuthToken;
}

export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
  private readonly jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

  /**
   * Registrar nuevo usuario
   */
  async register(email: string, password: string, firstName: string, lastName: string, role: UserRole = UserRole.EMPLOYEE): Promise<any> {
    // Validar que email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error(`Usuario con email ${email} ya existe`);
    }

    // Hash de la contraseña
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario en BD
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash,
        role,
        active: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      active: user.active,
    };
  }

  /**
   * Login de usuario - Genera tokens JWT
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Obtener usuario de la BD
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.active) {
      throw new Error('Invalid credentials or user inactive');
    }

    // Validar contraseña
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new Error('Invalid credentials');
    }

    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generar tokens
    const tokens = this.generateTokens(user.id, user.email, user.role as UserRole);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        active: user.active,
      },
      tokens,
    };
  }

  /**
   * Generar tokens JWT (Access + Refresh)
   */
  generateTokens(userId: string, email: string, role: UserRole): AuthToken {
    // Obtener permisos del rol
    const permissions = ROLE_PERMISSIONS[role];

    // Access Token - corta duración
    const accessPayload: JWTPayload = {
      sub: userId,
      email: email,
      role: role,
      permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutos
    };

    const accessToken = jwt.sign(accessPayload, this.jwtSecret, {
      algorithm: 'HS256',
    });

    // Refresh Token - larga duración
    const refreshPayload = {
      sub: userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 días
    };

    const refreshToken = jwt.sign(refreshPayload, this.jwtRefreshSecret, {
      algorithm: 'HS256',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutos en segundos
    };
  }

  /**
   * Validar y decodificar Access Token
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refrescar Access Token usando Refresh Token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret, {
        algorithms: ['HS256'],
      }) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Obtener usuario de BD
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user || !user.active) {
        throw new Error('User not found or inactive');
      }

      // Generar nuevo access token
      const userRole = user.role as UserRole;
      const newAccessPayload: JWTPayload = {
        sub: user.id,
        email: user.email,
        role: userRole,
        permissions: ROLE_PERMISSIONS[userRole],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 15 * 60,
      };

      const accessToken = jwt.sign(newAccessPayload, this.jwtSecret, {
        algorithm: 'HS256',
      });

      return {
        accessToken,
        expiresIn: 15 * 60,
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Verificar si usuario tiene permiso específico
   */
  hasPermission(payload: JWTPayload, requiredPermission: string): boolean {
    return payload.permissions.includes(requiredPermission as any);
  }

  /**
   * Verificar si usuario tiene al menos uno de los permisos
   */
  hasAnyPermission(payload: JWTPayload, permissions: string[]): boolean {
    return permissions.some(perm => payload.permissions.includes(perm as any));
  }

  /**
   * Verificar si usuario tiene todos los permisos
   */
  hasAllPermissions(payload: JWTPayload, permissions: string[]): boolean {
    return permissions.every(perm => payload.permissions.includes(perm as any));
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId: string): Promise<any | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    const userRole = user.role as UserRole;
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: userRole,
      active: user.active,
      permissions: ROLE_PERMISSIONS[userRole],
    };
  }
}

// Exportar singleton
export const authService = new AuthService();
