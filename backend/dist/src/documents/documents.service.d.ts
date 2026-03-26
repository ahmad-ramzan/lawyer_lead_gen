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
        client: {
            full_name: string;
            email: string;
        };
        matter: {
            code: string;
            name: string;
        };
    } & {
        id: string;
        user_id: string;
        attorney_id: string | null;
        matter_id: string;
        status: import("@prisma/client").$Enums.CaseStatus;
        payment_done: boolean;
        amount_paid: import("@prisma/client-runtime-utils").Decimal | null;
        access_granted: boolean;
        submitted_at: Date | null;
        approved_at: Date | null;
        created_at: Date;
        updated_at: Date;
    })[]>;
    getAttorneyCase(caseId: string, attorneyId: string): Promise<{
        client: {
            full_name: string;
            email: string;
        };
        matter: {
            id: string;
            created_at: Date;
            updated_at: Date;
            code: string;
            name: string;
            price: import("@prisma/client-runtime-utils").Decimal;
            description: string | null;
        };
        intake_data: {
            id: string;
            created_at: Date;
            updated_at: Date;
            case_id: string;
            data: import("@prisma/client/runtime/client").JsonValue;
            chat_log: import("@prisma/client/runtime/client").JsonValue | null;
            updated_by_attorney: boolean;
            attorney_notes: string | null;
        } | null;
        documents: {
            id: string;
            created_at: Date;
            updated_at: Date;
            case_id: string;
            file_url: string;
            file_name: string;
            is_locked: boolean;
            unlocked_by: string | null;
        }[];
    } & {
        id: string;
        user_id: string;
        attorney_id: string | null;
        matter_id: string;
        status: import("@prisma/client").$Enums.CaseStatus;
        payment_done: boolean;
        amount_paid: import("@prisma/client-runtime-utils").Decimal | null;
        access_granted: boolean;
        submitted_at: Date | null;
        approved_at: Date | null;
        created_at: Date;
        updated_at: Date;
    }>;
    updateIntake(caseId: string, attorneyId: string, data?: object, attorneyNotes?: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        case_id: string;
        data: import("@prisma/client/runtime/client").JsonValue;
        chat_log: import("@prisma/client/runtime/client").JsonValue | null;
        updated_by_attorney: boolean;
        attorney_notes: string | null;
    }>;
    approveCase(caseId: string, attorneyId: string): Promise<{
        id: string;
        user_id: string;
        attorney_id: string | null;
        matter_id: string;
        status: import("@prisma/client").$Enums.CaseStatus;
        payment_done: boolean;
        amount_paid: import("@prisma/client-runtime-utils").Decimal | null;
        access_granted: boolean;
        submitted_at: Date | null;
        approved_at: Date | null;
        created_at: Date;
        updated_at: Date;
    }>;
    grantAccess(caseId: string, attorneyId: string): Promise<{
        success: boolean;
    }>;
}
