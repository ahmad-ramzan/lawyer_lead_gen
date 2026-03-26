import { DocumentsService } from './documents.service';
export declare class DocumentsController {
    private documentsService;
    constructor(documentsService: DocumentsService);
    getCases(req: any, status?: string): Promise<({
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
    getCase(req: any, caseId: string): Promise<{
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
    updateIntake(req: any, caseId: string, body: {
        data?: object;
        attorney_notes?: string;
    }): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        case_id: string;
        data: import("@prisma/client/runtime/client").JsonValue;
        chat_log: import("@prisma/client/runtime/client").JsonValue | null;
        updated_by_attorney: boolean;
        attorney_notes: string | null;
    }>;
    approveCase(req: any, caseId: string): Promise<{
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
    grantAccess(req: any, caseId: string): Promise<{
        success: boolean;
    }>;
}
