import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('clients')
  async getClients() {
    return this.prisma.user.findMany({
      select: { id: true, full_name: true, email: true, phone: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });
  }

  @Get('attorneys')
  async getAttorneys() {
    const attorneys = await this.prisma.attorney.findMany({
      where: { role: 'attorney' },
      select: {
        id: true, full_name: true, email: true, description: true,
        is_available: true, created_at: true,
        attorney_specialities: { include: { speciality: { select: { id: true, name: true } } } },
      },
      orderBy: { created_at: 'desc' },
    });

    return Promise.all(
      attorneys.map(async (attorney) => {
        const active_investigations = await this.prisma.investigation.count({
          where: { attorney_id: attorney.id, status: { notIn: ['delivered'] } },
        });
        return {
          ...attorney,
          specialties: attorney.attorney_specialities.map((as) => as.speciality.name),
          active_investigations,
        };
      }),
    );
  }

  @Get('investigations')
  async getInvestigations() {
    return this.prisma.investigation.findMany({
      include: {
        client: { select: { id: true, full_name: true, email: true } },
        attorney: { select: { id: true, full_name: true, email: true } },
        matter: { select: { id: true, code: true, name: true, price: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  @Get('overview')
  async getOverview() {
    const [total_clients, total_attorneys, investigations] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.attorney.count({ where: { role: 'attorney' } }),
      this.prisma.investigation.groupBy({ by: ['status'], _count: { status: true } }),
    ]);

    const statusMap: Record<string, number> = {
      draft: 0, submitted: 0, assigned: 0, in_review: 0, approved: 0, delivered: 0,
    };
    investigations.forEach((i) => { statusMap[i.status] = i._count.status; });

    return { total_clients, total_attorneys, cases_by_status: statusMap };
  }

  @Get('specialities')
  async getSpecialities() {
    return this.prisma.speciality.findMany({ orderBy: { name: 'asc' } });
  }
}
