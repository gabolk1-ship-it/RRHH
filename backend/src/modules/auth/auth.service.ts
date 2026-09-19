/**
 * Auth Service
 * Maneja autenticación, JWT y validación de tokens
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWTPayload, UserRole, ROLE_PERMISSIONS } from '@types/roles';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
  private readonly jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
  private readonly accessTokenExpiry = '15m'; // 15 minutos
  private readonly refreshTokenExpiry = '7d'; // 7 días

  /**
   * Registrar nuevo usuario
   */
  async register(email: string, password: string, firstName: string, lastName: string, role: UserRole = UserRole.EMPLOYEE): Promise<User> {
    // Validar que email no exista
    // En producción: consultar BD

    // Hash de la contraseña
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario (en producción: guardar en BD)
    const user: User = {
      id: crypto.randomUUID(),
      email,
      firstName,
      lastName,
      passwordHash,
      role,
      active: true
    };

    return user;
  }

  /**
   * Login de usuario - Genera tokens JWT
   */
  async login(email: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthToken }> {
    // En producción: obtener usuario de la BD
    const user = await this.getUserByEmail(email);

    if (!user || !user.active) {
      throw new Error('Invalid credentials or user inactive');
    }

    // Validar contraseña
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new Error('Invalid credentials');
    }

    // Generar tokens
    const tokens = this.generateTokens(user);

    // En producción: guardar refresh token en BD y actualizar last_login
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        active: user.active
      },
      tokens
    };
  }

  /**
   * Generar tokens JWT (Access + Refresh)
   */
  generateTokens(user: User): AuthToken {
    // Obtener permisos del rol
    const permissions = ROLE_PERMISSIONS[user.role];

    // Access Token - corta duración
    const accessPayload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60 // 15 minutos
    };

    const accessToken = jwt.sign(accessPayload, this.jwtSecret, {
      algorithm: 'HS256'
    });

    // Refresh Token - larga duración
    const refreshPayload = {
      sub: user.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 días
    };

    const refreshToken = jwt.sign(refreshPayload, this.jwtRefreshSecret, {
      algorithm: 'HS256'
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutos en segundos
    };
  }

  /**
   * Validar y decodificar Access Token
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256']
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refrescar Access Token usando Refresh Token
   */
  refreshAccessToken(refreshToken: string): { accessToken: string; expiresIn: number } {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret, {
        algorithms: ['HS256']
      }) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Obtener usuario y generar nuevo access token
      // En producción: obtener de BD
      const user = { id: decoded.sub } as any;

      const newAccessPayload: JWTPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 15 * 60
      };

      const accessToken = jwt.sign(newAccessPayload, this.jwtSecret, {
        algorithm: 'HS256'
      });

      return {
        accessToken,
        expiresIn: 15 * 60
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
   * Mock: Obtener usuario por email (en producción desde BD)
   */
  private async getUserByEmail(email: string): Promise<User | null> {
    // En producción: consultar BD
    // Por ahora retorna un usuario de demo
    if (email === 'admin@hospital.ec') {
      return {
        id: 'admin-1',
        email: 'admin@hospital.ec',
        firstName: 'Admin',
        lastName: 'System',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: UserRole.ADMIN,
        active: true
      };
    }
    return null;
  }
}

// Exportar singleton
export const authService = new AuthService();
