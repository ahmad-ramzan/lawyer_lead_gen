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
    getCasesByEmail(email: string): Promise<({
        matter: {
            code: string;
            name: string;
            price: import("@prisma/client-runtime-utils").Decimal;
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
    getCasePublic(investigationId: string): Promise<{
        matter: {
            code: string;
            name: string;
            price: import("@prisma/client-runtime-utils").Decimal;
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
    }>;
    createCase(userId: string, matterId: string): Promise<{
        id: string;
        created_at: Date;
        matter_id: string;
        status: string;
    }>;
    saveIntake(investigationId: string, userId: string, data: object, chatLog?: object): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        data: import("@prisma/client/runtime/client").JsonValue;
        investigation_id: string;
        chat_log: import("@prisma/client/runtime/client").JsonValue | null;
        updated_by_attorney: boolean;
        attorney_notes: string | null;
    }>;
    getCase(investigationId: string, userId: string): Promise<{
        matter: {
            code: string;
            name: string;
            price: import("@prisma/client-runtime-utils").Decimal;
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
    }>;
    getDocumentDownload(investigationId: string, userId: string): Promise<{
        url: string;
    }>;
}
