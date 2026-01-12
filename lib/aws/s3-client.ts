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

export async function uploadNewsletterToS3(
  newsletterId: string,
  htmlContent: string
): Promise<{ key: string; url: string }> {
  const key = `newsletters/${newsletterId}/${Date.now()}.html`;
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
