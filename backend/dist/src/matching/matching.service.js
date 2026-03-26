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
    async assignAttorney(caseId) {
        const caseRecord = await this.prisma.case.findUnique({
            where: { id: caseId },
            include: { matter: { select: { code: true } } },
        });
        if (!caseRecord)
            return;
        const matterCode = caseRecord.matter.code;
        const allAttorneys = await this.prisma.user.findMany({
            where: { role: 'attorney' },
        });
        if (allAttorneys.length === 0) {
            this.logger.warn(`No attorneys available for case ${caseId}. Reverting to submitted.`);
            await this.prisma.case.update({
                where: { id: caseId },
                data: { status: 'submitted' },
            });
            return;
        }
        const specialized = allAttorneys.filter((a) => a.specialties.length === 0 || a.specialties.includes(matterCode));
        const pool = specialized.length > 0 ? specialized : allAttorneys;
        const counts = await Promise.all(pool.map(async (attorney) => {
            const count = await this.prisma.case.count({
                where: {
                    attorney_id: attorney.id,
                    status: { notIn: ['delivered'] },
                },
            });
            return { attorney, count };
        }));
        const assigned = counts.reduce((min, curr) => (curr.count < min.count ? curr : min));
        await this.prisma.case.update({
            where: { id: caseId },
            data: {
                attorney_id: assigned.attorney.id,
                status: 'assigned',
            },
        });
        this.logger.log(`Case ${caseId} assigned to attorney ${assigned.attorney.id}`);
    }
};
exports.MatchingService = MatchingService;
exports.MatchingService = MatchingService = MatchingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MatchingService);
//# sourceMappingURL=matching.service.js.map