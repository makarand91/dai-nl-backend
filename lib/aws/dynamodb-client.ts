import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { Newsletter, NewsletterHistory, NewsletterPreview } from '../types/newsletter';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// Newsletter Operations
export async function saveNewsletter(newsletter: Newsletter): Promise<void> {
  const command = new PutCommand({
    TableName: process.env.DYNAMODB_NEWSLETTER_TABLE,
    Item: newsletter,
  });
  await docClient.send(command);
}

export async function getNewsletter(id: string): Promise<Newsletter | null> {
  const command = new GetCommand({
    TableName: process.env.DYNAMODB_NEWSLETTER_TABLE,
    Key: { id },
  });
  const response = await docClient.send(command);
  return (response.Item as Newsletter) || null;
}

export async function updateNewsletterStatus(
  id: string,
  status: Newsletter['status'],
  additionalFields?: Partial<Newsletter>
): Promise<void> {
  const updateExpression = ['#status = :status'];
  const expressionAttributeNames: Record<string, string> = { '#status': 'status' };
  const expressionAttributeValues: Record<string, any> = { ':status': status };

  if (additionalFields) {
    Object.entries(additionalFields).forEach(([key, value], index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      updateExpression.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
    });
  }

  const command = new UpdateCommand({
    TableName: process.env.DYNAMODB_NEWSLETTER_TABLE,
    Key: { id },
    UpdateExpression: `SET ${updateExpression.join(', ')}, updatedAt = :updatedAt`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: {
      ...expressionAttributeValues,
      ':updatedAt': new Date().toISOString(),
    },
  });

  await docClient.send(command);
}

export async function getAllNewsletters(): Promise<Newsletter[]> {
  const command = new ScanCommand({
    TableName: process.env.DYNAMODB_NEWSLETTER_TABLE,
  });
  const response = await docClient.send(command);
  return (response.Items as Newsletter[]) || [];
}

// Newsletter History Operations
export async function addNewsletterHistory(history: NewsletterHistory): Promise<void> {
  const command = new PutCommand({
    TableName: process.env.DYNAMODB_HISTORY_TABLE,
    Item: history,
  });
  await docClient.send(command);
}

export async function getNewsletterHistory(newsletterId: string): Promise<NewsletterHistory[]> {
  const command = new QueryCommand({
    TableName: process.env.DYNAMODB_HISTORY_TABLE,
    KeyConditionExpression: 'newsletterId = :newsletterId',
    ExpressionAttributeValues: {
      ':newsletterId': newsletterId,
    },
    ScanIndexForward: false, // Sort by timestamp descending
  });
  const response = await docClient.send(command);
  return (response.Items as NewsletterHistory[]) || [];
}

export async function getAllHistory(): Promise<NewsletterHistory[]> {
  const command = new ScanCommand({
    TableName: process.env.DYNAMODB_HISTORY_TABLE,
  });
  const response = await docClient.send(command);
  return (response.Items as NewsletterHistory[]) || [];
}

// Preview Operations
export async function saveNewsletterPreview(preview: NewsletterPreview): Promise<void> {
  const command = new PutCommand({
    TableName: process.env.DYNAMODB_NEWSLETTER_TABLE,
    Item: {
      ...preview,
      type: 'preview', // Add type to distinguish from newsletters
    },
  });
  await docClient.send(command);
}

export async function getNewsletterPreview(id: string): Promise<NewsletterPreview | null> {
  const command = new GetCommand({
    TableName: process.env.DYNAMODB_NEWSLETTER_TABLE,
    Key: { id },
  });
  const response = await docClient.send(command);
  return (response.Item as NewsletterPreview) || null;
}
