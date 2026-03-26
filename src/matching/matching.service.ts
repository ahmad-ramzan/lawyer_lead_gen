import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private prisma: PrismaService) {}

  async assignAttorney(caseId: string) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: { matter: { select: { code: true } } },
    });
    if (!caseRecord) return;

    const matterCode = caseRecord.matter.code;

    const allAttorneys = await this.prisma.user.findMany({
      where: { role: 'attorney' },
    });

    if (allAttorneys.length === 0) {
      this.logger.warn(`No attorneys available for case ${caseId}. Reverting to submitted.`);
      await this.prisma.case.update({
        where: { id: caseId },
        data: { status: 'submitted' },
      });
      return;
    }

    // Prefer attorneys who specialise in this matter code.
    // Fall back to all attorneys if none have that specialty.
    const specialized = allAttorneys.filter(
      (a) => a.specialties.length === 0 || a.specialties.includes(matterCode),
    );
    const pool = specialized.length > 0 ? specialized : allAttorneys;

    const counts = await Promise.all(
      pool.map(async (attorney) => {
        const count = await this.prisma.case.count({
          where: {
            attorney_id: attorney.id,
            status: { notIn: ['delivered'] },
          },
        });
        return { attorney, count };
      }),
    );

    const assigned = counts.reduce((min, curr) => (curr.count < min.count ? curr : min));

    await this.prisma.case.update({
      where: { id: caseId },
      data: {
        attorney_id: assigned.attorney.id,
        status: 'assigned',
      },
    });

    this.logger.log(`Case ${caseId} assigned to attorney ${assigned.attorney.id}`);
  }
}
