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
var MatchingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MatchingService = MatchingService_1 = class MatchingService {
    prisma;
    logger = new common_1.Logger(MatchingService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async assignAttorney(investigationId) {
        const investigation = await this.prisma.investigation.findUnique({
            where: { id: investigationId },
            include: {
                matter: {
                    include: { matter_specialities: { select: { speciality_id: true } } },
                },
            },
        });
        if (!investigation)
            return;
        const matterSpecialityIds = investigation.matter.matter_specialities.map((ms) => ms.speciality_id);
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
        let pool = allAttorneys;
        if (matterSpecialityIds.length > 0) {
            const specialized = allAttorneys.filter((a) => a.attorney_specialities.some((as) => matterSpecialityIds.includes(as.speciality_id)));
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
        const counts = await Promise.all(pool.map(async (attorney) => {
            const count = await this.prisma.investigation.count({
                where: {
                    attorney_id: attorney.id,
                    status: { notIn: ['delivered'] },
                },
            });
            return { attorney, count };
        }));
        const assigned = counts.reduce((min, curr) => (curr.count < min.count ? curr : min));
        await this.prisma.investigation.update({
            where: { id: investigationId },
            data: { attorney_id: assigned.attorney.id, status: 'assigned' },
        });
        this.logger.log(`Investigation ${investigationId} assigned to attorney ${assigned.attorney.id}`);
    }
};
exports.MatchingService = MatchingService;
exports.MatchingService = MatchingService = MatchingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MatchingService);
//# sourceMappingURL=matching.service.js.map