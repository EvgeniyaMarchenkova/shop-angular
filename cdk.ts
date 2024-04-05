#!/usr/bin/env node
import 'source-map-support/register';
import * as path from 'path';
import {
  App,
  Stack,
  RemovalPolicy,
  type StackProps,
  aws_s3 as s3,
  aws_s3_deployment as deployment,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

class ShopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const hostingBucket = new s3.Bucket(this, 'ShopBucket', {
      accessControl: s3.BucketAccessControl.PRIVATE,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: true,
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OriginAccessIdentity',
    );
    hostingBucket.grantRead(originAccessIdentity);

    const distribution = new cloudfront.Distribution(
      this,
      'CloudfrontDistribution',
      {
        defaultBehavior: {
          origin: new origins.S3Origin(hostingBucket, { originAccessIdentity }),
        },
        defaultRootObject: 'index.html',
      },
    );

    new deployment.BucketDeployment(this, 'BucketDeployment', {
      sources: [
        deployment.Source.asset(path.join(__dirname, './dist/app/browser')),
      ],
      destinationBucket: hostingBucket,
      distribution,
      distributionPaths: ['/*'],
    });
  }
}

const app = new App();
new ShopStack(app, 'ShopStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
