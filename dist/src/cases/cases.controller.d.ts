import { CasesService } from './cases.service';
export declare class CasesController {
    private casesService;
    constructor(casesService: CasesService);
    getMatters(): Promise<{
        id: string;
        code: string;
        name: string;
        price: import("@prisma/client-runtime-utils").Decimal;
        description: string | null;
    }[]>;
    lookupByEmail(body: {
        email: string;
    }): Promise<({
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
    getCasePublic(caseId: string): Promise<{
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
    getMyCases(req: any): Promise<({
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
    createCase(req: any, body: {
        matter_id: string;
    }): Promise<{
        id: string;
        created_at: Date;
        matter_id: string;
        status: string;
    }>;
    saveIntake(req: any, caseId: string, body: {
        data: object;
        chat_log?: object;
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
    getCase(req: any, caseId: string): Promise<{
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
    getDocument(req: any, caseId: string): Promise<{
        url: string;
    }>;
}
