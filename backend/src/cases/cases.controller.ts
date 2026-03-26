import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CasesService } from './cases.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CasesController {
  constructor(private casesService: CasesService) {}

  @Get('matters')
  @Roles('client')
  getMatters() {
    return this.casesService.getMatters();
  }

  @Get('cases')
  @Roles('client')
  getMyCases(@Request() req: any) {
    return this.casesService.getMyCases(req.user.id);
  }

  @Post('cases')
  @Roles('client')
  createCase(@Request() req: any, @Body() body: { matter_id: string }) {
    return this.casesService.createCase(req.user.id, body.matter_id);
  }

  @Post('cases/:id/intake')
  @Roles('client')
  saveIntake(
    @Request() req: any,
    @Param('id') caseId: string,
    @Body() body: { data: object; chat_log?: object },
  ) {
    return this.casesService.saveIntake(caseId, req.user.id, body.data, body.chat_log);
  }

  @Get('cases/:id')
  @Roles('client')
  getCase(@Request() req: any, @Param('id') caseId: string) {
    return this.casesService.getCase(caseId, req.user.id);
  }

  @Get('cases/:id/document')
  @Roles('client')
  getDocument(@Request() req: any, @Param('id') caseId: string) {
    return this.casesService.getDocumentDownload(caseId, req.user.id);
  }
}
