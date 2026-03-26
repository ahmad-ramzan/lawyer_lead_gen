import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { StripeService } from './stripe.service';
import { MatchingModule } from '../matching/matching.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MatchingModule, MailModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [StripeService],
})
export class PaymentsModule {}
