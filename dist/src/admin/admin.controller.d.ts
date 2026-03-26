import { PrismaService } from '../prisma/prisma.service';
export declare class AdminController {
    private prisma;
    constructor(prisma: PrismaService);
    getClients(): Promise<{
        id: string;
        created_at: Date;
        email: string;
        full_name: string;
        phone: string | null;
    }[]>;
    getAttorneys(): Promise<{
        active_cases: number;
        id: string;
        created_at: Date;
        email: string;
        full_name: string;
        specialties: string[];
    }[]>;
    getCases(): Promise<({
        matter: {
            id: string;
            code: string;
            name: string;
            price: import("@prisma/client-runtime-utils").Decimal;
        };
        client: {
            id: string;
            email: string;
            full_name: string;
        };
        attorney: {
            id: string;
            email: string;
            full_name: string;
        } | null;
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
    getOverview(): Promise<{
        total_clients: number;
        total_attorneys: number;
        cases_by_status: Record<string, number>;
    }>;
}
