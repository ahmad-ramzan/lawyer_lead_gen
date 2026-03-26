import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CasesModule } from './cases/cases.module';
import { ChatModule } from './chat/chat.module';
import { PaymentsModule } from './payments/payments.module';
import { DocumentsModule } from './documents/documents.module';
import { AdminModule } from './admin/admin.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MatchingModule } from './matching/matching.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CasesModule,
    ChatModule,
    PaymentsModule,
    DocumentsModule,
    AdminModule,
    MailModule,
    NotificationsModule,
    MatchingModule,
  ],
})
export class AppModule {}
