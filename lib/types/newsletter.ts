export interface Newsletter {
  id: string;
  title: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  strapiContentId?: string;
  brand?: string;              // Brand identifier from Strapi
  campaignId?: string;         // Campaign ID from Mailjet/MailWizz
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

// Strapi 5 Types
export interface StrapiArticle {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  content: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  is_sponsored?: boolean;
  tags?: string;
  category?: string;
  thumbnail?: any;
  asset?: any;
}

export interface StrapiNewsletterContent {
  id: number;
  documentId: string;
  IssueDate: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  brand?: string;
  uid?: string;
  subject?: string;
  articles: StrapiArticle[];
}

export interface StrapiNewsletterResponse {
  data: StrapiNewsletterContent;
  meta: any;
}
