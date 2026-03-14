import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
    },
});
export async function sendEmail(options) {
    if (process.env.NODE_ENV === "development" && !process.env.SMTP_USER) {
        console.log("[DEV EMAIL] Would send email to:", options.to);
        console.log("[DEV EMAIL] Subject:", options.subject);
        console.log("[DEV EMAIL] HTML:", options.html.substring(0, 500) + "...");
        return;
    }
    await transporter.sendMail({
        from: process.env.FROM_EMAIL || "noreply@karen2.local",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
    });
}
export function generateVerificationEmailHtml(name, verificationUrl) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify your email - Karen2</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #4f46e5;">Welcome to Karen2!</h1>
    <p>Hi ${name},</p>
    <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}"
         style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Verify Email
      </a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't create an account, you can safely ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #666; font-size: 12px;">Karen2 - Event Management Platform</p>
  </div>
</body>
</html>`;
}
export function generatePasswordResetEmailHtml(name, resetUrl) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your password - Karen2</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #4f46e5;">Password Reset</h1>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}"
         style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Reset Password
      </a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">${resetUrl}</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #666; font-size: 12px;">Karen2 - Event Management Platform</p>
  </div>
</body>
</html>`;
}
export function generateMessageEmailHtml(name, message, eventTitle) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New message - Karen2</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #4f46e5;">New Message</h1>
    <p>Hi ${name},</p>
    ${eventTitle ? `<p>You have a new message regarding <strong>${eventTitle}</strong>:</p>` : "<p>You have a new message:</p>"}
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; white-space: pre-wrap;">${message}</p>
    </div>
    <p>You can reply by logging into your account.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #666; font-size: 12px;">Karen2 - Event Management Platform</p>
  </div>
</body>
</html>`;
}
