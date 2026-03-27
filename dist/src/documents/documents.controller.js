"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DocumentsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsController = void 0;
const common_1 = require("@nestjs/common");
const documents_service_1 = require("./documents.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const prisma_service_1 = require("../prisma/prisma.service");
const matching_service_1 = require("../matching/matching.service");
let DocumentsController = DocumentsController_1 = class DocumentsController {
    documentsService;
    prisma;
    matchingService;
    logger = new common_1.Logger(DocumentsController_1.name);
    constructor(documentsService, prisma, matchingService) {
        this.documentsService = documentsService;
        this.prisma = prisma;
        this.matchingService = matchingService;
    }
    getCases(req, status) {
        return this.documentsService.getAttorneyCases(req.user.id, status);
    }
    getCase(req, caseId) {
        return this.documentsService.getAttorneyCase(caseId, req.user.id);
    }
    updateIntake(req, caseId, body) {
        return this.documentsService.updateIntake(caseId, req.user.id, body.data, body.attorney_notes);
    }
    approveCase(req, caseId) {
        return this.documentsService.approveCase(caseId, req.user.id);
    }
    grantAccess(req, caseId) {
        return this.documentsService.grantAccess(caseId, req.user.id);
    }
    async getProfile(req) {
        return this.prisma.attorney.findUnique({
            where: { id: req.user.id },
            select: { id: true, full_name: true, email: true, role: true, is_available: true, description: true },
        });
    }
    async toggleAvailability(req) {
        const attorney = await this.prisma.attorney.findUnique({ where: { id: req.user.id } });
        const updated = await this.prisma.attorney.update({
            where: { id: req.user.id },
            data: { is_available: !attorney.is_available },
            select: { is_available: true },
        });
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
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, common_1.Get)('investigations'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "getCases", null);
__decorate([
    (0, common_1.Get)('investigations/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "getCase", null);
__decorate([
    (0, common_1.Patch)('investigations/:id/intake'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "updateIntake", null);
__decorate([
    (0, common_1.Patch)('investigations/:id/approve'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "approveCase", null);
__decorate([
    (0, common_1.Patch)('investigations/:id/grant-access'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "grantAccess", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('availability'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "toggleAvailability", null);
exports.DocumentsController = DocumentsController = DocumentsController_1 = __decorate([
    (0, common_1.Controller)('attorney'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('attorney'),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService,
        prisma_service_1.PrismaService,
        matching_service_1.MatchingService])
], DocumentsController);
//# sourceMappingURL=documents.controller.js.map