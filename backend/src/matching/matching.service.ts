import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private prisma: PrismaService) {}

  async assignAttorney(investigationId: string) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      include: {
        matter: {
          include: { matter_specialities: { select: { speciality_id: true } } },
        },
      },
    });
    if (!investigation) return;

    const matterSpecialityIds = investigation.matter.matter_specialities.map((ms) => ms.speciality_id);

    // Get all available attorneys with their specialities
    const allAttorneys = await this.prisma.attorney.findMany({
      where: { role: 'attorney', is_available: true },
      include: { attorney_specialities: { select: { speciality_id: true } } },
    });

    if (allAttorneys.length === 0) {
      this.logger.warn(`No attorneys available for investigation ${investigationId}. Reverting to submitted.`);
      await this.prisma.investigation.update({
        where: { id: investigationId },
        data: { status: 'submitted' },
      });
      return;
    }

    // Filter by matching speciality — if matter has specialities, ONLY use specialized attorneys
    // Do NOT fall back to general pool — wait until a specialized attorney is available
    let pool = allAttorneys;
    if (matterSpecialityIds.length > 0) {
      const specialized = allAttorneys.filter((a) =>
        a.attorney_specialities.some((as) => matterSpecialityIds.includes(as.speciality_id)),
      );
      if (specialized.length === 0) {
        this.logger.warn(`No available specialized attorney for investigation ${investigationId}. Waiting.`);
        await this.prisma.investigation.update({
          where: { id: investigationId },
          data: { status: 'submitted', attorney_id: null },
        });
        return;
      }
      pool = specialized;
    }

    // Load-balance: pick attorney with fewest active investigations
    const counts = await Promise.all(
      pool.map(async (attorney) => {
        const count = await this.prisma.investigation.count({
          where: {
            attorney_id: attorney.id,
            status: { notIn: ['delivered'] },
          },
        });
        return { attorney, count };
      }),
    );

    const assigned = counts.reduce((min, curr) => (curr.count < min.count ? curr : min));

    await this.prisma.investigation.update({
      where: { id: investigationId },
      data: { attorney_id: assigned.attorney.id, status: 'assigned' },
    });

    this.logger.log(`Investigation ${investigationId} assigned to attorney ${assigned.attorney.id}`);
  }
}
