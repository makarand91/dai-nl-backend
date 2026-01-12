export interface NewsletterTemplate {
  id: string;
  name: string;
  description: string;
  render: (data: TemplateData) => string;
}

export interface TemplateData {
  subject: string;
  issueDate: string;
  articles: ArticleData[];
  brand?: string;
  uid?: string;
}

export interface ArticleData {
  title: string;
  content: string;
  author?: string;
  isSponsored?: boolean;
  tags?: string;
  slug?: string;
}
