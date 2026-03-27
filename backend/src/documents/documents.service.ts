import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private mailService: MailService,
    private notificationsService: NotificationsService,
  ) {}

  async getAttorneyCases(attorneyId: string, status?: string) {
    return this.prisma.investigation.findMany({
      where: {
        attorney_id: attorneyId,
        ...(status ? { status } : {}),
      },
      include: {
        matter: { select: { name: true, code: true } },
        client: { select: { full_name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getAttorneyCase(investigationId: string, attorneyId: string) {
    const record = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      include: {
        matter: true,
        client: { select: { full_name: true, email: true } },
        intake_data: true,
        documents: true,
      },
    });
    if (!record) throw new NotFoundException('Investigation not found');
    if (record.attorney_id !== attorneyId) throw new ForbiddenException();
    return record;
  }

  async updateIntake(
    investigationId: string,
    attorneyId: string,
    data?: object,
    attorneyNotes?: string,
  ) {
    const record = await this.prisma.investigation.findUnique({ where: { id: investigationId } });
    if (!record) throw new NotFoundException('Investigation not found');
    if (record.attorney_id !== attorneyId) throw new ForbiddenException();

    return this.prisma.intakeData.update({
      where: { investigation_id: investigationId },
      data: {
        ...(data ? { data: data as any } : {}),
        ...(attorneyNotes !== undefined ? { attorney_notes: attorneyNotes } : {}),
        updated_by_attorney: true,
      },
    });
  }

  async approveCase(investigationId: string, attorneyId: string) {
    const record = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      include: { intake_data: true, matter: true },
    });
    if (!record) throw new NotFoundException('Investigation not found');
    if (record.attorney_id !== attorneyId) throw new ForbiddenException();

    const attorneyNotes = record.intake_data?.attorney_notes || '';
    const hasDraft = attorneyNotes.startsWith('[DRAFT]');
    const docContent = hasDraft
      ? attorneyNotes.replace('[DRAFT]\n', '').replace(/\[NOTES\][\s\S]*$/, '').trim()
      : `SIGNAL LAW GROUP
${record.matter.name.toUpperCase()}

Investigation ID: ${record.id}
Prepared by: Signal Law Group
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

────────────────────────────────

INTAKE SUMMARY

${Object.entries(record.intake_data?.data ?? {}).map(([, v], i) => `Q${i + 1}: ${v}`).join('\n\n')}

────────────────────────────────

[Attorney review pending]
      `.trim();

    const doc = new DocxDocument({
      sections: [{
        properties: {},
        children: docContent.split('\n').map(
          (line) => new Paragraph({ children: [new TextRun(line)] }),
        ),
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const fileName = `${investigationId}-draft.docx`;
    const filePath = `investigations/${investigationId}/${fileName}`;

    await this.storage.uploadFile(filePath, buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    await this.prisma.document.create({
      data: {
        investigation_id: investigationId,
        file_url: filePath,
        file_name: fileName,
        is_locked: true,
      },
    });

    return this.prisma.investigation.update({
      where: { id: investigationId },
      data: { status: 'approved', approved_at: new Date() },
    });
  }

  async grantAccess(investigationId: string, attorneyId: string) {
    const record = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      include: { client: true, matter: true, documents: true },
    });
    if (!record) throw new NotFoundException('Investigation not found');
    if (record.attorney_id !== attorneyId) throw new ForbiddenException();

    await this.prisma.investigation.update({
      where: { id: investigationId },
      data: { access_granted: true, status: 'delivered' },
    });

    if (record.documents[0]) {
      await this.prisma.document.update({
        where: { id: record.documents[0].id },
        data: { is_locked: false, unlocked_by: attorneyId },
      });
    }

    await this.mailService.sendDocumentReady(
      record.client.email,
      record.client.full_name,
      record.matter.name,
    );

    await this.notificationsService.create(
      record.user_id,
      investigationId,
      record.matter_id,
    );

    return { success: true };
  }
}
