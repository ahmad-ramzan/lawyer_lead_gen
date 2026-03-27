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
        specialties: string[];
        active_investigations: number;
        id: string;
        description: string | null;
        created_at: Date;
        attorney_specialities: ({
            speciality: {
                id: string;
                name: string;
            };
        } & {
            speciality_id: string;
            attorney_id: string;
        })[];
        email: string;
        full_name: string;
        is_available: boolean;
    }[]>;
    getInvestigations(): Promise<({
        matter: {
            id: string;
            code: string;
            name: string;
            price: import("@prisma/client-runtime-utils").Decimal;
        };
        attorney: {
            id: string;
            email: string;
            full_name: string;
        } | null;
        client: {
            id: string;
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
    getOverview(): Promise<{
        total_clients: number;
        total_attorneys: number;
        cases_by_status: Record<string, number>;
    }>;
    getSpecialities(): Promise<{
        id: string;
        name: string;
        created_at: Date;
        updated_at: Date;
    }[]>;
}
