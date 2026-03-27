import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { StorageService } from './storage.service';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [MailModule, NotificationsModule, MatchingModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, StorageService, PrismaService],
})
export class DocumentsModule {}
