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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
let AdminController = class AdminController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getClients() {
        return this.prisma.user.findMany({
            where: { role: 'client' },
            select: { id: true, full_name: true, email: true, phone: true, created_at: true },
            orderBy: { created_at: 'desc' },
        });
    }
    async getAttorneys() {
        const attorneys = await this.prisma.user.findMany({
            where: { role: 'attorney' },
            select: { id: true, full_name: true, email: true, specialties: true, created_at: true },
            orderBy: { created_at: 'desc' },
        });
        return Promise.all(attorneys.map(async (attorney) => {
            const activeCases = await this.prisma.case.count({
                where: {
                    attorney_id: attorney.id,
                    status: { notIn: ['delivered'] },
                },
            });
            return { ...attorney, active_cases: activeCases };
        }));
    }
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
    async getOverview() {
        const [total_clients, total_attorneys, cases] = await Promise.all([
            this.prisma.user.count({ where: { role: 'client' } }),
            this.prisma.user.count({ where: { role: 'attorney' } }),
            this.prisma.case.groupBy({ by: ['status'], _count: { status: true } }),
        ]);
        const statusMap = {
            draft: 0, submitted: 0, assigned: 0, in_review: 0, approved: 0, delivered: 0,
        };
        cases.forEach((c) => { statusMap[c.status] = c._count.status; });
        return { total_clients, total_attorneys, cases_by_status: statusMap };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('clients'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getClients", null);
__decorate([
    (0, common_1.Get)('attorneys'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAttorneys", null);
__decorate([
    (0, common_1.Get)('cases'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCases", null);
__decorate([
    (0, common_1.Get)('overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOverview", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('admin'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map