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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CasesController = void 0;
const common_1 = require("@nestjs/common");
const cases_service_1 = require("./cases.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
let CasesController = class CasesController {
    casesService;
    constructor(casesService) {
        this.casesService = casesService;
    }
    getMatters() {
        return this.casesService.getMatters();
    }
    getMyCases(req) {
        return this.casesService.getMyCases(req.user.id);
    }
    createCase(req, body) {
        return this.casesService.createCase(req.user.id, body.matter_id);
    }
    saveIntake(req, caseId, body) {
        return this.casesService.saveIntake(caseId, req.user.id, body.data, body.chat_log);
    }
    getCase(req, caseId) {
        return this.casesService.getCase(caseId, req.user.id);
    }
    getDocument(req, caseId) {
        return this.casesService.getDocumentDownload(caseId, req.user.id);
    }
};
exports.CasesController = CasesController;
__decorate([
    (0, common_1.Get)('matters'),
    (0, roles_guard_1.Roles)('client'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "getMatters", null);
__decorate([
    (0, common_1.Get)('cases'),
    (0, roles_guard_1.Roles)('client'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "getMyCases", null);
__decorate([
    (0, common_1.Post)('cases'),
    (0, roles_guard_1.Roles)('client'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "createCase", null);
__decorate([
    (0, common_1.Post)('cases/:id/intake'),
    (0, roles_guard_1.Roles)('client'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "saveIntake", null);
__decorate([
    (0, common_1.Get)('cases/:id'),
    (0, roles_guard_1.Roles)('client'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "getCase", null);
__decorate([
    (0, common_1.Get)('cases/:id/document'),
    (0, roles_guard_1.Roles)('client'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CasesController.prototype, "getDocument", null);
exports.CasesController = CasesController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [cases_service_1.CasesService])
], CasesController);
//# sourceMappingURL=cases.controller.js.map