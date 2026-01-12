import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * S3 Client for Newsletter Storage
 *
 * Uses AWS SDK's default credential provider chain:
 * 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 * 2. Shared credentials file (~/.aws/credentials)
 * 3. IAM role for EC2 instances
 * 4. IAM role for ECS tasks
 * 5. IAM role for Lambda functions
 *
 * For production on AWS, use IAM roles instead of hardcoded credentials.
 */

const s3ClientConfig: any = {
  region: process.env.AWS_REGION || process.env.S3_REGION || 'us-east-1',
};

// Only add explicit credentials if provided (for local development)
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3ClientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const s3Client = new S3Client(s3ClientConfig);

/**
 * Build S3 key with optional prefix/subfolder
 *
 * Examples:
 * - No prefix: newsletters/abc-123/1234567890.html
 * - With prefix "prod": prod/newsletters/abc-123/1234567890.html
 * - With prefix "myapp/prod": myapp/prod/newsletters/abc-123/1234567890.html
 */
function buildS3Key(path: string): string {
  const prefix = process.env.S3_PREFIX || process.env.S3_FOLDER_PREFIX || '';

  if (!prefix) {
    return path;
  }

  // Normalize prefix: remove leading/trailing slashes
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, '');

  return `${normalizedPrefix}/${path}`;
}

export async function uploadNewsletterToS3(
  newsletterId: string,
  htmlContent: string
): Promise<{ key: string; url: string }> {
  const relativePath = `newsletters/${newsletterId}/${Date.now()}.html`;
  const key = buildS3Key(relativePath);
  const bucketName = process.env.S3_BUCKET_NAME!;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: htmlContent,
    ContentType: 'text/html',
    Metadata: {
      newsletterId,
    },
  });

  await s3Client.send(command);

  // Generate a signed URL that expires in 7 days
  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 604800 });

  return { key, url };
}

export async function getNewsletterFromS3(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
  });

  const response = await s3Client.send(command);
  const str = await response.Body?.transformToString();
  return str || '';
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}
