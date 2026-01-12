# AWS IAM Setup Guide

This guide explains how to set up IAM roles and permissions for the Newsletter Management System on AWS.

## Authentication Methods

The application supports two authentication methods with AWS:

### 1. IAM Roles (Recommended for Production)

When running on AWS infrastructure (EC2, ECS, Lambda, Amplify, etc.), use IAM roles. The AWS SDK automatically discovers and uses these credentials.

**Advantages:**
- ✅ No credentials to manage or rotate
- ✅ Automatic credential rotation
- ✅ No risk of credential leakage
- ✅ Better security posture
- ✅ Follows AWS best practices

**No environment variables needed** - Just attach the IAM role to your compute resource.

### 2. Access Keys (Local Development Only)

For local development, you can use AWS access keys.

**Environment variables:**
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

⚠️ **Never commit these to version control or use in production!**

## Required IAM Permissions

Create an IAM policy with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3NewsletterStorage",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::newsletter-storage",
        "arn:aws:s3:::newsletter-storage/*"
      ]
    },
    {
      "Sid": "DynamoDBNewsletters",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/newsletters",
        "arn:aws:dynamodb:*:*:table/newsletter-history"
      ]
    },
    {
      "Sid": "SESEmailSending",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "ses:FromAddress": "noreply@yourdomain.com"
        }
      }
    }
  ]
}
```

### Using S3 Prefixes/Subfolders

If you're using the `S3_PREFIX` environment variable to organize files in subfolders (e.g., `prod/newsletters`), you can scope IAM permissions to only that prefix:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3NewsletterStorageWithPrefix",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::shared-storage/prod/newsletters/*"
      ]
    },
    {
      "Sid": "S3ListBucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::shared-storage",
      "Condition": {
        "StringLike": {
          "s3:prefix": ["prod/newsletters/*"]
        }
      }
    }
  ]
}
```

**Benefits:**
- Production environment can only access `prod/newsletters/*`
- Staging environment can only access `staging/newsletters/*`
- Better isolation between environments
- Single bucket with fine-grained access control

## Setup by Environment

### Running on AWS EC2

1. **Create IAM Role:**
   - Go to IAM Console → Roles → Create Role
   - Select "AWS service" → "EC2"
   - Attach the policy created above
   - Name it: `newsletter-ec2-role`

2. **Attach to EC2 Instance:**
   - Go to EC2 Console
   - Select your instance → Actions → Security → Modify IAM role
   - Select `newsletter-ec2-role`

3. **Environment Variables:**
   ```env
   # No AWS credentials needed!
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=newsletter-storage
   DYNAMODB_NEWSLETTER_TABLE=newsletters
   DYNAMODB_HISTORY_TABLE=newsletter-history
   ```

### Running on AWS ECS/Fargate

1. **Create Task Execution Role:**
   ```bash
   # This role allows ECS to pull images and write logs
   aws iam create-role \
     --role-name newsletter-ecs-execution-role \
     --assume-role-policy-document file://ecs-trust-policy.json
   ```

   `ecs-trust-policy.json`:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Service": "ecs-tasks.amazonaws.com"
         },
         "Action": "sts:AssumeRole"
       }
     ]
   }
   ```

2. **Create Task Role (for application):**
   - Create role with the permissions policy above
   - Name it: `newsletter-ecs-task-role`

3. **Configure ECS Task Definition:**
   ```json
   {
     "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/newsletter-ecs-task-role",
     "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/newsletter-ecs-execution-role",
     "containerDefinitions": [
       {
         "name": "newsletter-app",
         "environment": [
           { "name": "AWS_REGION", "value": "us-east-1" },
           { "name": "S3_BUCKET_NAME", "value": "newsletter-storage" }
         ]
       }
     ]
   }
   ```

### Running on AWS Lambda

1. **Create Lambda Execution Role:**
   ```bash
   aws iam create-role \
     --role-name newsletter-lambda-role \
     --assume-role-policy-document file://lambda-trust-policy.json
   ```

   `lambda-trust-policy.json`:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Service": "lambda.amazonaws.com"
         },
         "Action": "sts:AssumeRole"
       }
     ]
   }
   ```

2. **Attach Policies:**
   ```bash
   # For Lambda basics (CloudWatch Logs)
   aws iam attach-role-policy \
     --role-name newsletter-lambda-role \
     --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

   # For newsletter permissions (create custom policy first)
   aws iam attach-role-policy \
     --role-name newsletter-lambda-role \
     --policy-arn arn:aws:iam::ACCOUNT_ID:policy/newsletter-permissions
   ```

3. **Deploy Lambda with Role:**
   ```bash
   aws lambda create-function \
     --function-name newsletter-function \
     --role arn:aws:iam::ACCOUNT_ID:role/newsletter-lambda-role \
     --runtime nodejs20.x \
     --handler index.handler
   ```

### Running on AWS Amplify

1. **Create Service Role:**
   - Go to IAM Console → Roles → Create Role
   - Select "AWS service" → "Amplify"
   - Attach the newsletter permissions policy
   - Name it: `amplify-newsletter-role`

2. **Configure in Amplify:**
   - Go to Amplify Console
   - App settings → General → Service role
   - Select `amplify-newsletter-role`

3. **Add Environment Variables in Amplify:**
   - Go to App settings → Environment variables
   - Add: `AWS_REGION`, `S3_BUCKET_NAME`, etc.
   - **Do NOT add** `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY`

### Local Development

For local development with AWS access keys:

1. **Create IAM User:**
   ```bash
   aws iam create-user --user-name newsletter-dev
   ```

2. **Attach Policy:**
   ```bash
   aws iam attach-user-policy \
     --user-name newsletter-dev \
     --policy-arn arn:aws:iam::ACCOUNT_ID:policy/newsletter-permissions
   ```

3. **Create Access Keys:**
   ```bash
   aws iam create-access-key --user-name newsletter-dev
   ```

4. **Add to `.env.local`:**
   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   ```

## AWS Credential Provider Chain

The AWS SDK automatically looks for credentials in this order:

1. **Environment variables:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
2. **Shared credentials file:** `~/.aws/credentials`
3. **ECS container credentials:** For tasks running on ECS
4. **EC2 instance metadata:** For EC2 instances with IAM roles
5. **Lambda execution role:** For Lambda functions

## Security Best Practices

### ✅ Do:
- Use IAM roles in production
- Apply principle of least privilege
- Use resource-specific policies
- Enable CloudTrail for auditing
- Rotate credentials regularly (if using access keys)
- Use AWS Secrets Manager for sensitive data

### ❌ Don't:
- Hardcode credentials in code
- Commit credentials to version control
- Share credentials between environments
- Use root account credentials
- Give overly broad permissions (like `s3:*` on all buckets)

## Testing IAM Permissions

Test your IAM setup:

```bash
# Test S3 access
aws s3 ls s3://newsletter-storage --profile newsletter-dev

# Test DynamoDB access
aws dynamodb list-tables --profile newsletter-dev

# Test SES access
aws ses list-identities --profile newsletter-dev
```

## Troubleshooting

### "Access Denied" Errors

1. **Check IAM Policy:**
   ```bash
   aws iam get-user-policy --user-name newsletter-dev --policy-name newsletter-permissions
   ```

2. **Check Role Attachment (for EC2/ECS):**
   ```bash
   aws ec2 describe-iam-instance-profile-associations
   ```

3. **Verify Credentials:**
   ```bash
   aws sts get-caller-identity
   ```

### "Credentials Not Found" Errors

- **EC2/ECS:** Ensure IAM role is attached
- **Local:** Check `.env.local` has correct keys
- **Lambda:** Verify execution role is configured

### Regional Issues

Ensure all resources are in the same region:
```env
AWS_REGION=us-east-1
S3_REGION=us-east-1
SES_REGION=us-east-1
```

## Additional Resources

- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [AWS SDK Credential Provider Chain](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html)
- [EC2 IAM Roles](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html)
- [ECS Task Roles](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)
- [Lambda Execution Role](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)
