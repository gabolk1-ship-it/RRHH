/**
 * Devices Service
 * Registro y gestion de dispositivos biometricos (ZK Teco, Anviz, camaras faciales)
 */

import { prisma } from '../../lib/prisma';

export type DeviceType = 'FINGERPRINT' | 'FACIAL_RECOGNITION' | 'HYBRID';
export type DeviceStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'ERROR';

export interface CreateDeviceDTO {
  name: string;
  deviceType: DeviceType;
  serialNumber?: string;
  ipAddress?: string;
  location?: string;
}

export interface UpdateDeviceDTO {
  name?: string;
  ipAddress?: string;
  location?: string;
  status?: DeviceStatus;
}

export class DevicesService {
  /**
   * Registrar un nuevo dispositivo biometrico
   */
  async registerDevice(data: CreateDeviceDTO) {
    if (data.serialNumber) {
      const existing = await prisma.biometricDevice.findUnique({
        where: { serialNumber: data.serialNumber },
      });
      if (existing) {
        throw new Error(`Dispositivo con serial ${data.serialNumber} ya existe`);
      }
    }

    return prisma.biometricDevice.create({
      data: {
        name: data.name,
        deviceType: data.deviceType,
        serialNumber: data.serialNumber,
        ipAddress: data.ipAddress,
        location: data.location,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Listar todos los dispositivos
   */
  async listDevices(limit = 100, offset = 0) {
    const [devices, total] = await Promise.all([
      prisma.biometricDevice.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.biometricDevice.count(),
    ]);

    return { devices, total };
  }

  /**
   * Obtener un dispositivo por ID
   */
  async getDeviceById(id: string) {
    return prisma.biometricDevice.findUnique({ where: { id } });
  }

  /**
   * Actualizar configuracion de un dispositivo
   */
  async updateDevice(id: string, updates: UpdateDeviceDTO) {
    const device = await prisma.biometricDevice.findUnique({ where: { id } });
    if (!device) {
      throw new Error('Dispositivo no encontrado');
    }

    return prisma.biometricDevice.update({ where: { id }, data: updates });
  }

  /**
   * Registrar sincronizacion exitosa de un dispositivo
   */
  async recordSync(id: string) {
    const device = await prisma.biometricDevice.findUnique({ where: { id } });
    if (!device) {
      throw new Error('Dispositivo no encontrado');
    }

    return prisma.biometricDevice.update({
      where: { id },
      data: { lastSync: new Date(), status: 'ACTIVE' },
    });
  }

  /**
   * Marcar dispositivo con error de conexion
   */
  async markError(id: string) {
    const device = await prisma.biometricDevice.findUnique({ where: { id } });
    if (!device) {
      throw new Error('Dispositivo no encontrado');
    }

    return prisma.biometricDevice.update({ where: { id }, data: { status: 'ERROR' } });
  }

  /**
   * Eliminar un dispositivo
   */
  async deleteDevice(id: string) {
    const device = await prisma.biometricDevice.findUnique({ where: { id } });
    if (!device) {
      throw new Error('Dispositivo no encontrado');
    }

    await prisma.biometricDevice.delete({ where: { id } });
  }
}

export const devicesService = new DevicesService();
