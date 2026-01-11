export interface Newsletter {
  id: string;
  title: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  strapiContentId?: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduledFor?: string;
  sentAt?: string;
  s3Key?: string;
  s3Url?: string;
}

export interface NewsletterHistory {
  id: string;
  newsletterId: string;
  action: 'created' | 'previewed' | 'preview_sent' | 'scheduled' | 'sent' | 'failed';
  timestamp: string;
  metadata?: {
    recipientEmail?: string;
    scheduledFor?: string;
    errorMessage?: string;
    [key: string]: any;
  };
  userId?: string;
}

export interface NewsletterPreview {
  id: string;
  newsletterId: string;
  htmlContent: string;
  s3Key: string;
  s3Url: string;
  createdAt: string;
  expiresAt?: string;
}

export interface ScheduleNewsletterRequest {
  newsletterId: string;
  scheduledFor: string;
  recipientList?: string[];
}

export interface SendPreviewRequest {
  newsletterId: string;
  recipientEmail: string;
}

export interface StrapiNewsletterContent {
  id: number;
  attributes: {
    title: string;
    subject: string;
    content: string;
    htmlContent?: string;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
  };
}
