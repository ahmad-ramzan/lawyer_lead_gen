import type { RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from '../matching/matching.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class PaymentsController {
    private stripeService;
    private prisma;
    private matchingService;
    private mailService;
    private notificationsService;
    constructor(stripeService: StripeService, prisma: PrismaService, matchingService: MatchingService, mailService: MailService, notificationsService: NotificationsService);
    createPaymentIntent(caseId: string, body: {
        amount: number;
    }): Promise<{
        client_secret: string | null;
    }>;
    handleWebhook(req: RawBodyRequest<Request>, sig: string): Promise<{
        received: boolean;
    }>;
}
