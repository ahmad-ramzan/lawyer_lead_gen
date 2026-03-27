import { Controller, Get, Patch, Body, Param, Query, UseGuards, Request, Logger } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from '../matching/matching.service';

@Controller('attorney')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('attorney')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(
    private documentsService: DocumentsService,
    private prisma: PrismaService,
    private matchingService: MatchingService,
  ) {}

  @Get('investigations')
  getCases(@Request() req: any, @Query('status') status?: string) {
    return this.documentsService.getAttorneyCases(req.user.id, status);
  }

  @Get('investigations/:id')
  getCase(@Request() req: any, @Param('id') caseId: string) {
    return this.documentsService.getAttorneyCase(caseId, req.user.id);
  }

  @Patch('investigations/:id/intake')
  updateIntake(
    @Request() req: any,
    @Param('id') caseId: string,
    @Body() body: { data?: object; attorney_notes?: string },
  ) {
    return this.documentsService.updateIntake(caseId, req.user.id, body.data, body.attorney_notes);
  }

  @Patch('investigations/:id/approve')
  approveCase(@Request() req: any, @Param('id') caseId: string) {
    return this.documentsService.approveCase(caseId, req.user.id);
  }

  @Patch('investigations/:id/grant-access')
  grantAccess(@Request() req: any, @Param('id') caseId: string) {
    return this.documentsService.grantAccess(caseId, req.user.id);
  }

  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.prisma.attorney.findUnique({
      where: { id: req.user.id },
      select: { id: true, full_name: true, email: true, role: true, is_available: true, description: true },
    });
  }

  @Patch('availability')
  async toggleAvailability(@Request() req: any) {
    const attorney = await this.prisma.attorney.findUnique({ where: { id: req.user.id } });
    const updated = await this.prisma.attorney.update({
      where: { id: req.user.id },
      data: { is_available: !attorney!.is_available },
      select: { is_available: true },
    });

    // When toggling to available, retry all pending unassigned investigations
    if (updated.is_available) {
      const pending = await this.prisma.investigation.findMany({
        where: { status: 'submitted', payment_done: true },
        select: { id: true },
      });
      this.logger.log(`Attorney available — found ${pending.length} pending investigation(s) to assign`);
      for (const inv of pending) {
        await this.matchingService.assignAttorney(inv.id);
      }
    }

    return updated;
  }
}
