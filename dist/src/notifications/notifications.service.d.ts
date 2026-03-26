import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, caseId: string, matterId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        user_id: string;
        matter_id: string;
        case_id: string;
        is_sent: boolean;
    }>;
}
