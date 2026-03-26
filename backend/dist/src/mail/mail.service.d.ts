export declare class MailService {
    private readonly logger;
    private transporter;
    sendCaseSubmitted(to: string, fullName: string, matterName: string): Promise<boolean>;
    sendDocumentReady(to: string, fullName: string, matterName: string): Promise<boolean>;
}
