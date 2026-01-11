import axios from 'axios';
import { StrapiNewsletterContent } from '../types/newsletter';

const strapiClient = axios.create({
  baseURL: process.env.STRAPI_URL,
  headers: {
    Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
  },
});

export async function getStrapiNewsletter(id: number): Promise<StrapiNewsletterContent | null> {
  try {
    const response = await strapiClient.get(`/api/newsletters/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching newsletter from Strapi:', error);
    return null;
  }
}

export async function getAllStrapiNewsletters(): Promise<StrapiNewsletterContent[]> {
  try {
    const response = await strapiClient.get('/api/newsletters');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching newsletters from Strapi:', error);
    return [];
  }
}

export async function convertStrapiContentToHTML(content: string): Promise<string> {
  // If Strapi already provides HTML, return it
  // Otherwise, convert markdown or rich text to HTML
  // This is a simple implementation - adjust based on your Strapi content format

  // Assuming content is markdown or plain text
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        h1, h2, h3 {
          color: #2c3e50;
        }
        a {
          color: #3498db;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #777;
        }
      </style>
    </head>
    <body>
      ${content}
      <div class="footer">
        <p>You are receiving this newsletter because you subscribed to our mailing list.</p>
        <p><a href="#">Unsubscribe</a></p>
      </div>
    </body>
    </html>
  `;
}
