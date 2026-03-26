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
      where: { role: 'client' },
      select: { id: true, full_name: true, email: true, phone: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });
  }

  @Get('attorneys')
  async getAttorneys() {
    const attorneys = await this.prisma.user.findMany({
      where: { role: 'attorney' },
      select: { id: true, full_name: true, email: true, specialties: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });

    return Promise.all(
      attorneys.map(async (attorney) => {
        const activeCases = await this.prisma.case.count({
          where: {
            attorney_id: attorney.id,
            status: { notIn: ['delivered'] },
          },
        });
        return { ...attorney, active_cases: activeCases };
      }),
    );
  }

  @Get('cases')
  async getCases() {
    return this.prisma.case.findMany({
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
    const [total_clients, total_attorneys, cases] = await Promise.all([
      this.prisma.user.count({ where: { role: 'client' } }),
      this.prisma.user.count({ where: { role: 'attorney' } }),
      this.prisma.case.groupBy({ by: ['status'], _count: { status: true } }),
    ]);

    const statusMap: Record<string, number> = {
      draft: 0, submitted: 0, assigned: 0, in_review: 0, approved: 0, delivered: 0,
    };
    cases.forEach((c) => { statusMap[c.status] = c._count.status; });

    return { total_clients, total_attorneys, cases_by_status: statusMap };
  }
}
