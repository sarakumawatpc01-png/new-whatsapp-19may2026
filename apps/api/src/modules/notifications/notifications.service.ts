import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getPreferences(tenantId: string, userId: string) {
    return this.prisma.notificationPreference.findMany({
      where: { tenantId, userId }
    });
  }

  async updatePreferences(tenantId: string, userId: string, preferences: any[]) {
    // For each preference, upsert
    for (const pref of preferences) {
      const existing = await this.prisma.notificationPreference.findFirst({
        where: { tenantId, userId, notificationType: pref.type }
      });
      
      if (existing) {
        await this.prisma.notificationPreference.update({
          where: { id: existing.id },
          data: {
            inApp: pref.inApp,
            email: pref.email,
          }
        });
      } else {
        await this.prisma.notificationPreference.create({
          data: {
            tenantId,
            userId,
            notificationType: pref.type,
            inApp: pref.inApp,
            email: pref.email,
          }
        });
      }
    }
    return { success: true };
  }

  async getNotifications(tenantId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async markAsRead(tenantId: string, userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, tenantId, userId },
      data: { read: true }
    });
  }
}
