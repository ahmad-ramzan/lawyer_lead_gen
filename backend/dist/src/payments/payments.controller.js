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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const stripe_service_1 = require("./stripe.service");
const prisma_service_1 = require("../prisma/prisma.service");
const matching_service_1 = require("../matching/matching.service");
const mail_service_1 = require("../mail/mail.service");
const notifications_service_1 = require("../notifications/notifications.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
let PaymentsController = class PaymentsController {
    stripeService;
    prisma;
    matchingService;
    mailService;
    notificationsService;
    constructor(stripeService, prisma, matchingService, mailService, notificationsService) {
        this.stripeService = stripeService;
        this.prisma = prisma;
        this.matchingService = matchingService;
        this.mailService = mailService;
        this.notificationsService = notificationsService;
    }
    async createPaymentIntent(req, caseId, body) {
        const intent = await this.stripeService.createPaymentIntent(body.amount, caseId);
        return { client_secret: intent.client_secret };
    }
    async handleWebhook(req, sig) {
        let event;
        try {
            event = this.stripeService.constructEvent(req.rawBody, sig);
        }
        catch {
            return { received: false };
        }
        if (event.type === 'payment_intent.succeeded') {
            const intent = event.data.object;
            const caseId = intent.metadata?.case_id;
            if (!caseId)
                return { received: true };
            const amountPaid = intent.amount_received / 100;
            await this.prisma.case.update({
                where: { id: caseId },
                data: {
                    payment_done: true,
                    status: 'submitted',
                    submitted_at: new Date(),
                    amount_paid: amountPaid,
                },
            });
            await this.matchingService.assignAttorney(caseId);
            const caseRecord = await this.prisma.case.findUnique({
                where: { id: caseId },
                include: {
                    client: true,
                    matter: true,
                },
            });
            if (caseRecord) {
                await this.mailService.sendCaseSubmitted(caseRecord.client.email, caseRecord.client.full_name, caseRecord.matter.name);
                await this.notificationsService.create(caseRecord.user_id, caseId, caseRecord.matter_id);
            }
        }
        return { received: true };
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('cases/:id/payment'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('client'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createPaymentIntent", null);
__decorate([
    (0, common_1.Post)('payments/webhook'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleWebhook", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [stripe_service_1.StripeService,
        prisma_service_1.PrismaService,
        matching_service_1.MatchingService,
        mail_service_1.MailService,
        notifications_service_1.NotificationsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map