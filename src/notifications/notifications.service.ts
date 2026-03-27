import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, investigationId: string, matterId: string) {
    return this.prisma.notification.create({
      data: { user_id: userId, investigation_id: investigationId, matter_id: matterId, is_sent: true },
    });
  }
}
