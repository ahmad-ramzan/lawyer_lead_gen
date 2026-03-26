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
    return this.prisma.case.findMany({
      where: {
        attorney_id: attorneyId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        matter: { select: { name: true, code: true } },
        client: { select: { full_name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getAttorneyCase(caseId: string, attorneyId: string) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: {
        matter: true,
        client: { select: { full_name: true, email: true } },
        intake_data: true,
        documents: true,
      },
    });
    if (!caseRecord) throw new NotFoundException('Case not found');
    if (caseRecord.attorney_id !== attorneyId) throw new ForbiddenException();
    return caseRecord;
  }

  async updateIntake(
    caseId: string,
    attorneyId: string,
    data?: object,
    attorneyNotes?: string,
  ) {
    const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseRecord) throw new NotFoundException('Case not found');
    if (caseRecord.attorney_id !== attorneyId) throw new ForbiddenException();

    return this.prisma.intakeData.update({
      where: { case_id: caseId },
      data: {
        ...(data ? { data: data as any } : {}),
        ...(attorneyNotes !== undefined ? { attorney_notes: attorneyNotes } : {}),
        updated_by_attorney: true,
      },
    });
  }

  async approveCase(caseId: string, attorneyId: string) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: { intake_data: true, matter: true },
    });
    if (!caseRecord) throw new NotFoundException('Case not found');
    if (caseRecord.attorney_id !== attorneyId) throw new ForbiddenException();

    const attorneyNotes = caseRecord.intake_data?.attorney_notes || '';
    // If attorney saved a draft (prefixed with [DRAFT]), use it as the document body
    const hasDraft = attorneyNotes.startsWith('[DRAFT]');
    const docContent = hasDraft
      ? attorneyNotes.replace('[DRAFT]\n', '').replace(/\[NOTES\][\s\S]*$/, '').trim()
      : `SIGNAL LAW GROUP
${caseRecord.matter.name.toUpperCase()}

Case ID: ${caseRecord.id}
Prepared by: Signal Law Group
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

────────────────────────────────

INTAKE SUMMARY

${Object.entries(caseRecord.intake_data?.data ?? {}).map(([k, v], i) => `Q${i + 1}: ${v}`).join('\n\n')}

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
    const fileName = `${caseId}-draft.docx`;
    const filePath = `cases/${caseId}/${fileName}`;

    await this.storage.uploadFile(filePath, buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    await this.prisma.document.create({
      data: {
        case_id: caseId,
        file_url: filePath,
        file_name: fileName,
        is_locked: true,
      },
    });

    return this.prisma.case.update({
      where: { id: caseId },
      data: { status: 'approved', approved_at: new Date() },
    });
  }

  async grantAccess(caseId: string, attorneyId: string) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: {
        client: true,
        matter: true,
        documents: true,
      },
    });
    if (!caseRecord) throw new NotFoundException('Case not found');
    if (caseRecord.attorney_id !== attorneyId) throw new ForbiddenException();

    await this.prisma.case.update({
      where: { id: caseId },
      data: { access_granted: true, status: 'delivered' },
    });

    if (caseRecord.documents[0]) {
      await this.prisma.document.update({
        where: { id: caseRecord.documents[0].id },
        data: { is_locked: false, unlocked_by: attorneyId },
      });
    }

    await this.mailService.sendDocumentReady(
      caseRecord.client.email,
      caseRecord.client.full_name,
      caseRecord.matter.name,
    );

    await this.notificationsService.create(
      caseRecord.user_id,
      caseId,
      caseRecord.matter_id,
    );

    return { success: true };
  }
}
