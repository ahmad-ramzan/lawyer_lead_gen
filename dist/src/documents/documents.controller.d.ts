import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from '../matching/matching.service';
export declare class DocumentsController {
    private documentsService;
    private prisma;
    private matchingService;
    private readonly logger;
    constructor(documentsService: DocumentsService, prisma: PrismaService, matchingService: MatchingService);
    getCases(req: any, status?: string): Promise<({
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
    getCase(req: any, caseId: string): Promise<{
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
    updateIntake(req: any, caseId: string, body: {
        data?: object;
        attorney_notes?: string;
    }): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        investigation_id: string;
        chat_log: import("@prisma/client/runtime/client").JsonValue | null;
        updated_by_attorney: boolean;
        attorney_notes: string | null;
    }>;
    approveCase(req: any, caseId: string): Promise<{
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
    grantAccess(req: any, caseId: string): Promise<{
        success: boolean;
    }>;
    getProfile(req: any): Promise<{
        id: string;
        description: string | null;
        email: string;
        full_name: string;
        role: string;
        is_available: boolean;
    } | null>;
    toggleAvailability(req: any): Promise<{
        is_available: boolean;
    }>;
}
