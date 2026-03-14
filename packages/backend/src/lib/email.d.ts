export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare function sendEmail(options: EmailOptions): Promise<void>;
export declare function generateVerificationEmailHtml(name: string, verificationUrl: string): string;
export declare function generatePasswordResetEmailHtml(name: string, resetUrl: string): string;
export declare function generateMessageEmailHtml(name: string, message: string, eventTitle?: string): string;
//# sourceMappingURL=email.d.ts.map