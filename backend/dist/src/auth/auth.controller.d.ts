import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(body: {
        full_name: string;
        email: string;
        password: string;
        role: 'client' | 'attorney' | 'admin';
        phone?: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            full_name: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            full_name: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
}
