import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class CasesService {
  constructor(private prisma: PrismaService) {}

  async getMatters() {
    return this.prisma.matter.findMany({
      select: { id: true, code: true, name: true, price: true, description: true },
    });
  }

  async getMyCases(userId: string) {
    return this.prisma.case.findMany({
      where: { user_id: userId },
      include: { matter: { select: { name: true, code: true, price: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async createCase(userId: string, matterId: string) {
    const matter = await this.prisma.matter.findUnique({ where: { id: matterId } });
    if (!matter) throw new NotFoundException('Matter not found');

    return this.prisma.case.create({
      data: { user_id: userId, matter_id: matterId },
      select: { id: true, status: true, matter_id: true, created_at: true },
    });
  }

  async saveIntake(caseId: string, userId: string, data: object, chatLog?: object) {
    const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseRecord) throw new NotFoundException('Case not found');
    if (caseRecord.user_id !== userId) throw new ForbiddenException();

    return this.prisma.intakeData.upsert({
      where: { case_id: caseId },
      update: { data: data as any, chat_log: chatLog as any ?? undefined },
      create: { case_id: caseId, data: data as any, chat_log: chatLog as any ?? undefined },
    });
  }

  async getCase(caseId: string, userId: string) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: { matter: { select: { name: true, code: true, price: true } } },
    });
    if (!caseRecord) throw new NotFoundException('Case not found');
    if (caseRecord.user_id !== userId) throw new ForbiddenException();
    return caseRecord;
  }

  async getDocumentDownload(caseId: string, userId: string) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: { documents: true },
    });
    if (!caseRecord) throw new NotFoundException('Case not found');
    if (caseRecord.user_id !== userId) throw new ForbiddenException();

    if (!caseRecord.payment_done) throw new ForbiddenException('Payment required');
    if (!caseRecord.access_granted) throw new ForbiddenException('Access not yet granted');

    const doc = caseRecord.documents[0];
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.is_locked) throw new ForbiddenException('Document is locked');

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET || 'documents')
      .createSignedUrl(doc.file_url, 3600);

    if (error) throw new Error('Failed to generate download URL');
    return { url: data.signedUrl };
  }
}
