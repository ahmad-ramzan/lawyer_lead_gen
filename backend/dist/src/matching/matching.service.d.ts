import { PrismaService } from '../prisma/prisma.service';
export declare class MatchingService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    assignAttorney(caseId: string): Promise<void>;
}
