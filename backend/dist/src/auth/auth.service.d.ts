import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: {
        full_name: string;
        email: string;
        password?: string;
        role: 'client' | 'attorney' | 'admin';
        phone?: string;
        speciality_ids?: string[];
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            full_name: string;
            email: string;
            role: string;
        };
    }>;
    login(dto: {
        email: string;
        password?: string;
        role?: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            full_name: string;
            email: string;
            role: string;
        };
    }>;
}
