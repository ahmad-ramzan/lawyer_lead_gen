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
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("./storage.service");
const docx_1 = require("docx");
const mail_service_1 = require("../mail/mail.service");
const notifications_service_1 = require("../notifications/notifications.service");
let DocumentsService = class DocumentsService {
    prisma;
    storage;
    mailService;
    notificationsService;
    constructor(prisma, storage, mailService, notificationsService) {
        this.prisma = prisma;
        this.storage = storage;
        this.mailService = mailService;
        this.notificationsService = notificationsService;
    }
    async getAttorneyCases(attorneyId, status) {
        return this.prisma.case.findMany({
            where: {
                attorney_id: attorneyId,
                ...(status ? { status: status } : {}),
            },
            include: {
                matter: { select: { name: true, code: true } },
                client: { select: { full_name: true, email: true } },
            },
            orderBy: { created_at: 'desc' },
        });
    }
    async getAttorneyCase(caseId, attorneyId) {
        const caseRecord = await this.prisma.case.findUnique({
            where: { id: caseId },
            include: {
                matter: true,
                client: { select: { full_name: true, email: true } },
                intake_data: true,
                documents: true,
            },
        });
        if (!caseRecord)
            throw new common_1.NotFoundException('Case not found');
        if (caseRecord.attorney_id !== attorneyId)
            throw new common_1.ForbiddenException();
        return caseRecord;
    }
    async updateIntake(caseId, attorneyId, data, attorneyNotes) {
        const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
        if (!caseRecord)
            throw new common_1.NotFoundException('Case not found');
        if (caseRecord.attorney_id !== attorneyId)
            throw new common_1.ForbiddenException();
        return this.prisma.intakeData.update({
            where: { case_id: caseId },
            data: {
                ...(data ? { data: data } : {}),
                ...(attorneyNotes !== undefined ? { attorney_notes: attorneyNotes } : {}),
                updated_by_attorney: true,
            },
        });
    }
    async approveCase(caseId, attorneyId) {
        const caseRecord = await this.prisma.case.findUnique({
            where: { id: caseId },
            include: { intake_data: true, matter: true },
        });
        if (!caseRecord)
            throw new common_1.NotFoundException('Case not found');
        if (caseRecord.attorney_id !== attorneyId)
            throw new common_1.ForbiddenException();
        const attorneyNotes = caseRecord.intake_data?.attorney_notes || '';
        const hasDraft = attorneyNotes.startsWith('[DRAFT]');
        const docContent = hasDraft
            ? attorneyNotes.replace('[DRAFT]\n', '').replace(/\[NOTES\][\s\S]*$/, '').trim()
            : `SIGNAL LAW GROUP
${caseRecord.matter.name.toUpperCase()}

Case ID: ${caseRecord.id}
Prepared by: Signal Law Group
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

────────────────────────────────

INTAKE SUMMARY

${Object.entries(caseRecord.intake_data?.data ?? {}).map(([k, v], i) => `Q${i + 1}: ${v}`).join('\n\n')}

────────────────────────────────

[Attorney review pending]
      `.trim();
        const doc = new docx_1.Document({
            sections: [{
                    properties: {},
                    children: docContent.split('\n').map((line) => new docx_1.Paragraph({ children: [new docx_1.TextRun(line)] })),
                }],
        });
        const buffer = await docx_1.Packer.toBuffer(doc);
        const fileName = `${caseId}-draft.docx`;
        const filePath = `cases/${caseId}/${fileName}`;
        await this.storage.uploadFile(filePath, buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        await this.prisma.document.create({
            data: {
                case_id: caseId,
                file_url: filePath,
                file_name: fileName,
                is_locked: true,
            },
        });
        return this.prisma.case.update({
            where: { id: caseId },
            data: { status: 'approved', approved_at: new Date() },
        });
    }
    async grantAccess(caseId, attorneyId) {
        const caseRecord = await this.prisma.case.findUnique({
            where: { id: caseId },
            include: {
                client: true,
                matter: true,
                documents: true,
            },
        });
        if (!caseRecord)
            throw new common_1.NotFoundException('Case not found');
        if (caseRecord.attorney_id !== attorneyId)
            throw new common_1.ForbiddenException();
        await this.prisma.case.update({
            where: { id: caseId },
            data: { access_granted: true, status: 'delivered' },
        });
        if (caseRecord.documents[0]) {
            await this.prisma.document.update({
                where: { id: caseRecord.documents[0].id },
                data: { is_locked: false, unlocked_by: attorneyId },
            });
        }
        await this.mailService.sendDocumentReady(caseRecord.client.email, caseRecord.client.full_name, caseRecord.matter.name);
        await this.notificationsService.create(caseRecord.user_id, caseId, caseRecord.matter_id);
        return { success: true };
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        mail_service_1.MailService,
        notifications_service_1.NotificationsService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map