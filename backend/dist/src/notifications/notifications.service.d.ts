import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, investigationId: string, matterId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        matter_id: string;
        user_id: string;
        investigation_id: string;
        is_sent: boolean;
    }>;
}
