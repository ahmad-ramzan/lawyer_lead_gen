import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class DocumentsService {
    private prisma;
    private storage;
    private mailService;
    private notificationsService;
    constructor(prisma: PrismaService, storage: StorageService, mailService: MailService, notificationsService: NotificationsService);
    getAttorneyCases(attorneyId: string, status?: string): Promise<({
        matter: {
            code: string;
            name: string;
        };
        client: {
            email: string;
            full_name: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        matter_id: string;
        user_id: string;
        attorney_id: string | null;
        status: string;
        payment_done: boolean;
        amount_paid: import("@prisma/client-runtime-utils").Decimal | null;
        access_granted: boolean;
        submitted_at: Date | null;
        approved_at: Date | null;
    })[]>;
    getAttorneyCase(investigationId: string, attorneyId: string): Promise<{
        matter: {
            id: string;
            code: string;
            name: string;
            type: string | null;
            price: import("@prisma/client-runtime-utils").Decimal;
            description: string | null;
            created_at: Date;
            updated_at: Date;
        };
        client: {
            email: string;
            full_name: string;
        };
        intake_data: {
            id: string;
            created_at: Date;
            updated_at: Date;
            data: import("@prisma/client/runtime/client").JsonValue;
            investigation_id: string;
            chat_log: import("@prisma/client/runtime/client").JsonValue | null;
            updated_by_attorney: boolean;
            attorney_notes: string | null;
        } | null;
        documents: {
            id: string;
            created_at: Date;
            updated_at: Date;
            investigation_id: string;
            file_url: string;
            file_name: string;
            is_locked: boolean;
            unlocked_by: string | null;
        }[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        matter_id: string;
        user_id: string;
        attorney_id: string | null;
        status: string;
        payment_done: boolean;
        amount_paid: import("@prisma/client-runtime-utils").Decimal | null;
        access_granted: boolean;
        submitted_at: Date | null;
        approved_at: Date | null;
    }>;
    updateIntake(investigationId: string, attorneyId: string, data?: object, attorneyNotes?: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        investigation_id: string;
        chat_log: import("@prisma/client/runtime/client").JsonValue | null;
        updated_by_attorney: boolean;
        attorney_notes: string | null;
    }>;
    approveCase(investigationId: string, attorneyId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        matter_id: string;
        user_id: string;
        attorney_id: string | null;
        status: string;
        payment_done: boolean;
        amount_paid: import("@prisma/client-runtime-utils").Decimal | null;
        access_granted: boolean;
        submitted_at: Date | null;
        approved_at: Date | null;
    }>;
    grantAccess(investigationId: string, attorneyId: string): Promise<{
        success: boolean;
    }>;
}
