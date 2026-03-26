import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendCaseSubmitted(to: string, fullName: string, matterName: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@signallawgroup.com',
        to,
        subject: 'Your LexSelf case has been received',
        text: `Dear ${fullName},\n\nYour ${matterName} case has been submitted successfully.\nAn attorney will review your case shortly.\n\nSignal Law Group`,
      });
      return true;
    } catch (err) {
      this.logger.error(`Failed to send case submitted email to ${to}`, err);
      return false;
    }
  }

  async sendDocumentReady(to: string, fullName: string, matterName: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@signallawgroup.com',
        to,
        subject: 'Your document is ready — LexSelf',
        text: `Dear ${fullName},\n\nYour ${matterName} document has been approved and is ready to download.\nLog in to your portal to access it.\n\nSignal Law Group`,
      });
      return true;
    } catch (err) {
      this.logger.error(`Failed to send document ready email to ${to}`, err);
      return false;
    }
  }
}
