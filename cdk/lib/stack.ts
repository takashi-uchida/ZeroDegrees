import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as neptune from 'aws-cdk-lib/aws-neptune';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export class ZeroDegreesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 1,
    });

    // Neptune Cluster
    const neptuneCluster = new neptune.DatabaseCluster(this, 'NeptuneCluster', {
      vpc,
      instanceType: neptune.InstanceType.T3_MEDIUM,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    // Backend Service
    const backend = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Backend', {
      cluster,
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset('../backend'),
        containerPort: 8000,
        environment: {
          FRONTEND_URL: 'https://placeholder.cloudfront.net',
          NEPTUNE_ENDPOINT: neptuneCluster.clusterEndpoint.socketAddress,
          AWS_REGION: this.region,
          EMBEDDING_MODEL: 'amazon.titan-embed-text-v1',
          BEDROCK_MODEL: 'anthropic.claude-3-sonnet-20240229-v1:0',
          EMBEDDING_DIMENSIONS: '1536',
          FORUM_ROUNDS: '2',
          MAX_CANDIDATES: '10',
        },
      },
      publicLoadBalancer: true,
    });

    // Bedrock permissions
    backend.taskDefinition.addToTaskRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
      resources: ['*'],
    }));

    neptuneCluster.connections.allowFrom(backend.service, ec2.Port.tcp(8182));

    // Frontend S3 + CloudFront
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    new s3deploy.BucketDeployment(this, 'DeployFrontend', {
      sources: [s3deploy.Source.asset('../frontend/out')],
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'BackendURL', {
      value: backend.loadBalancer.loadBalancerDnsName,
    });

    new cdk.CfnOutput(this, 'FrontendURL', {
      value: distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, 'NeptuneEndpoint', {
      value: neptuneCluster.clusterEndpoint.socketAddress,
    });
  }
}
