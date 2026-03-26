import { PrismaService } from '../prisma/prisma.service';
export declare class ChatService {
    private prisma;
    constructor(prisma: PrismaService);
    getNextQuestion(matterId: string, step: number): Promise<{
        question: string;
        step: number;
        is_last: boolean;
    }>;
}
