import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Headers,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from '../matching/matching.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller()
export class PaymentsController {
  constructor(
    private stripeService: StripeService,
    private prisma: PrismaService,
    private matchingService: MatchingService,
    private mailService: MailService,
    private notificationsService: NotificationsService,
  ) {}

  @Post('cases/:id/payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  async createPaymentIntent(
    @Request() req: any,
    @Param('id') caseId: string,
    @Body() body: { amount: number },
  ) {
    const intent = await this.stripeService.createPaymentIntent(body.amount, caseId);
    return { client_secret: intent.client_secret };
  }

  @Post('payments/webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    let event: any;
    try {
      event = this.stripeService.constructEvent(req.rawBody as Buffer, sig);
    } catch {
      return { received: false };
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const caseId = intent.metadata?.case_id;
      if (!caseId) return { received: true };

      const amountPaid = intent.amount_received / 100;

      await this.prisma.case.update({
        where: { id: caseId },
        data: {
          payment_done: true,
          status: 'submitted',
          submitted_at: new Date(),
          amount_paid: amountPaid,
        },
      });

      await this.matchingService.assignAttorney(caseId);

      const caseRecord = await this.prisma.case.findUnique({
        where: { id: caseId },
        include: {
          client: true,
          matter: true,
        },
      });

      if (caseRecord) {
        await this.mailService.sendCaseSubmitted(
          caseRecord.client.email,
          caseRecord.client.full_name,
          caseRecord.matter.name,
        );

        await this.notificationsService.create(
          caseRecord.user_id,
          caseId,
          caseRecord.matter_id,
        );
      }
    }

    return { received: true };
  }
}
