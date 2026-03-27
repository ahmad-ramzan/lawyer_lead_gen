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
    return this.prisma.investigation.findMany({
      where: { user_id: userId },
      include: { matter: { select: { name: true, code: true, price: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async getCasesByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return [];
    return this.prisma.investigation.findMany({
      where: { user_id: user.id },
      include: { matter: { select: { name: true, code: true, price: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async getCasePublic(investigationId: string) {
    const record = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      include: { matter: { select: { name: true, code: true, price: true } } },
    });
    if (!record) throw new NotFoundException('Investigation not found');
    return record;
  }

  async createCase(userId: string, matterId: string) {
    const matter = await this.prisma.matter.findUnique({ where: { id: matterId } });
    if (!matter) throw new NotFoundException('Matter not found');

    return this.prisma.investigation.create({
      data: { user_id: userId, matter_id: matterId },
      select: { id: true, status: true, matter_id: true, created_at: true },
    });
  }

  async saveIntake(investigationId: string, userId: string, data: object, chatLog?: object) {
    const record = await this.prisma.investigation.findUnique({ where: { id: investigationId } });
    if (!record) throw new NotFoundException('Investigation not found');
    if (record.user_id !== userId) throw new ForbiddenException();

    return this.prisma.intakeData.upsert({
      where: { investigation_id: investigationId },
      update: { data: data as any, chat_log: chatLog as any ?? undefined },
      create: { investigation_id: investigationId, data: data as any, chat_log: chatLog as any ?? undefined },
    });
  }

  async getCase(investigationId: string, userId: string) {
    const record = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      include: { matter: { select: { name: true, code: true, price: true } } },
    });
    if (!record) throw new NotFoundException('Investigation not found');
    if (record.user_id !== userId) throw new ForbiddenException();
    return record;
  }

  async getDocumentDownload(investigationId: string, userId: string) {
    const record = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      include: { documents: true },
    });
    if (!record) throw new NotFoundException('Investigation not found');
    if (record.user_id !== userId) throw new ForbiddenException();

    if (!record.payment_done) throw new ForbiddenException('Payment required');
    if (!record.access_granted) throw new ForbiddenException('Access not yet granted');

    const doc = record.documents[0];
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
