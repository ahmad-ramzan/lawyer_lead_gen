import { Controller, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('attorney')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('attorney')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get('cases')
  getCases(@Request() req: any, @Query('status') status?: string) {
    return this.documentsService.getAttorneyCases(req.user.id, status);
  }

  @Get('cases/:id')
  getCase(@Request() req: any, @Param('id') caseId: string) {
    return this.documentsService.getAttorneyCase(caseId, req.user.id);
  }

  @Patch('cases/:id/intake')
  updateIntake(
    @Request() req: any,
    @Param('id') caseId: string,
    @Body() body: { data?: object; attorney_notes?: string },
  ) {
    return this.documentsService.updateIntake(caseId, req.user.id, body.data, body.attorney_notes);
  }

  @Patch('cases/:id/approve')
  approveCase(@Request() req: any, @Param('id') caseId: string) {
    return this.documentsService.approveCase(caseId, req.user.id);
  }

  @Patch('cases/:id/grant-access')
  grantAccess(@Request() req: any, @Param('id') caseId: string) {
    return this.documentsService.grantAccess(caseId, req.user.id);
  }
}
