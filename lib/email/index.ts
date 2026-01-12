/**
 * Email Service Module
 *
 * This module provides a flexible email service that supports multiple providers.
 * Switch providers by changing the EMAIL_PROVIDER environment variable.
 */

export { emailService, EmailService } from './email-service';
export type { IEmailProvider, EmailOptions, EmailProviderType } from './types';
export { MailjetProvider } from './providers/mailjet';
export { SESProvider } from './providers/ses';
