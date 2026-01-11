import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
  region: process.env.SES_REGION || process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const { to, subject, htmlBody, textBody, from } = params;
  const toAddresses = Array.isArray(to) ? to : [to];
  const fromAddress = from || process.env.SES_FROM_EMAIL!;

  const command = new SendEmailCommand({
    Source: fromAddress,
    Destination: {
      ToAddresses: toAddresses,
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
        ...(textBody && {
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        }),
      },
    },
  });

  await sesClient.send(command);
}

export async function sendNewsletterPreview(
  recipientEmail: string,
  subject: string,
  htmlContent: string
): Promise<void> {
  await sendEmail({
    to: recipientEmail,
    subject: `[PREVIEW] ${subject}`,
    htmlBody: htmlContent,
  });
}

export async function sendNewsletter(
  recipients: string[],
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<void> {
  // For production, you might want to batch this or use SES templates
  // This is a simplified version
  for (const recipient of recipients) {
    await sendEmail({
      to: recipient,
      subject,
      htmlBody: htmlContent,
      textBody: textContent,
    });
  }
}
