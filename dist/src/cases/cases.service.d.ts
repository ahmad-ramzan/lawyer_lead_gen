import { PrismaService } from '../prisma/prisma.service';
export declare class CasesService {
    private prisma;
    constructor(prisma: PrismaService);
    getMatters(): Promise<{
        id: string;
        code: string;
        name: string;
        price: import("@prisma/client-runtime-utils").Decimal;
        description: string | null;
    }[]>;
    getMyCases(userId: string): Promise<({
        matter: {
            code: string;
            name: string;
            price: import("@prisma/client-runtime-utils").Decimal;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        user_id: string;
        attorney_id: string | null;
        matter_id: string;
        status: import("@prisma/client").$Enums.CaseStatus;
        payment_done: boolean;
        amount_paid: import("@prisma/client-runtime-utils").Decimal | null;
        access_granted: boolean;
        submitted_at: Date | null;
        approved_at: Date | null;
    })[]>;
    createCase(userId: string, matterId: string): Promise<{
        id: string;
        created_at: Date;
        matter_id: string;
        status: import("@prisma/client").$Enums.CaseStatus;
    }>;
    saveIntake(caseId: string, userId: string, data: object, chatLog?: object): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        case_id: string;
        chat_log: import("@prisma/client/runtime/client").JsonValue | null;
        updated_by_attorney: boolean;
        attorney_notes: string | null;
    }>;
    getCase(caseId: string, userId: string): Promise<{
        matter: {
            code: string;
            name: string;
            price: import("@prisma/client-runtime-utils").Decimal;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        user_id: string;
        attorney_id: string | null;
        matter_id: string;
        status: import("@prisma/client").$Enums.CaseStatus;
        payment_done: boolean;
        amount_paid: import("@prisma/client-runtime-utils").Decimal | null;
        access_granted: boolean;
        submitted_at: Date | null;
        approved_at: Date | null;
    }>;
    getDocumentDownload(caseId: string, userId: string): Promise<{
        url: string;
    }>;
}
