import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CasesService } from './cases.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller()
export class CasesController {
  constructor(private casesService: CasesService) {}

  // Public — no auth required
  @Get('matters')
  getMatters() {
    return this.casesService.getMatters();
  }

  // Public — look up investigations by email (no auth)
  @Post('investigations/lookup')
  lookupByEmail(@Body() body: { email: string }) {
    return this.casesService.getCasesByEmail(body.email);
  }

  // Public — get single investigation by ID (no auth, used after email lookup)
  @Get('investigations/public/:id')
  getCasePublic(@Param('id') caseId: string) {
    return this.casesService.getCasePublic(caseId);
  }

  // Auth required for user-specific routes
  @Get('investigations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  getMyCases(@Request() req: any) {
    return this.casesService.getMyCases(req.user.id);
  }

  @Post('investigations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  createCase(@Request() req: any, @Body() body: { matter_id: string }) {
    return this.casesService.createCase(req.user.id, body.matter_id);
  }

  @Post('investigations/:id/intake')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  saveIntake(
    @Request() req: any,
    @Param('id') caseId: string,
    @Body() body: { data: object; chat_log?: object },
  ) {
    return this.casesService.saveIntake(caseId, req.user.id, body.data, body.chat_log);
  }

  @Get('investigations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  getCase(@Request() req: any, @Param('id') caseId: string) {
    return this.casesService.getCase(caseId, req.user.id);
  }

  @Get('investigations/:id/document')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  getDocument(@Request() req: any, @Param('id') caseId: string) {
    return this.casesService.getDocumentDownload(caseId, req.user.id);
  }
}
