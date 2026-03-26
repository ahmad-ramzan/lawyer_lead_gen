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
exports.CasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const supabase_js_1 = require("@supabase/supabase-js");
let CasesService = class CasesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMatters() {
        return this.prisma.matter.findMany({
            select: { id: true, code: true, name: true, price: true, description: true },
        });
    }
    async getMyCases(userId) {
        return this.prisma.case.findMany({
            where: { user_id: userId },
            include: { matter: { select: { name: true, code: true, price: true } } },
            orderBy: { created_at: 'desc' },
        });
    }
    async createCase(userId, matterId) {
        const matter = await this.prisma.matter.findUnique({ where: { id: matterId } });
        if (!matter)
            throw new common_1.NotFoundException('Matter not found');
        return this.prisma.case.create({
            data: { user_id: userId, matter_id: matterId },
            select: { id: true, status: true, matter_id: true, created_at: true },
        });
    }
    async saveIntake(caseId, userId, data, chatLog) {
        const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
        if (!caseRecord)
            throw new common_1.NotFoundException('Case not found');
        if (caseRecord.user_id !== userId)
            throw new common_1.ForbiddenException();
        return this.prisma.intakeData.upsert({
            where: { case_id: caseId },
            update: { data: data, chat_log: chatLog ?? undefined },
            create: { case_id: caseId, data: data, chat_log: chatLog ?? undefined },
        });
    }
    async getCase(caseId, userId) {
        const caseRecord = await this.prisma.case.findUnique({
            where: { id: caseId },
            include: { matter: { select: { name: true, code: true, price: true } } },
        });
        if (!caseRecord)
            throw new common_1.NotFoundException('Case not found');
        if (caseRecord.user_id !== userId)
            throw new common_1.ForbiddenException();
        return caseRecord;
    }
    async getDocumentDownload(caseId, userId) {
        const caseRecord = await this.prisma.case.findUnique({
            where: { id: caseId },
            include: { documents: true },
        });
        if (!caseRecord)
            throw new common_1.NotFoundException('Case not found');
        if (caseRecord.user_id !== userId)
            throw new common_1.ForbiddenException();
        if (!caseRecord.payment_done)
            throw new common_1.ForbiddenException('Payment required');
        if (!caseRecord.access_granted)
            throw new common_1.ForbiddenException('Access not yet granted');
        const doc = caseRecord.documents[0];
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        if (doc.is_locked)
            throw new common_1.ForbiddenException('Document is locked');
        const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
        const { data, error } = await supabase.storage
            .from(process.env.SUPABASE_BUCKET || 'documents')
            .createSignedUrl(doc.file_url, 3600);
        if (error)
            throw new Error('Failed to generate download URL');
        return { url: data.signedUrl };
    }
};
exports.CasesService = CasesService;
exports.CasesService = CasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CasesService);
//# sourceMappingURL=cases.service.js.map