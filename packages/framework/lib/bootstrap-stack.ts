import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket, EventType } from "aws-cdk-lib/aws-s3";
import { S3EventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { DockerImageCode, DockerImageFunction } from "aws-cdk-lib/aws-lambda";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { join } from "path";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

export class BootstrapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "bucket", {
      bucketName: "asgard-main-bucket",
    });

    const lambda = new DockerImageFunction(this, "docker-image", {
      code: DockerImageCode.fromImageAsset(
        join(import.meta.dirname, "bootstrap"),
        {
          platform: Platform.LINUX_AMD64,
        }
      ),
      functionName: "bootstrap",
      memorySize: 512,
      timeout: cdk.Duration.minutes(15),
    });
    bucket.grantRead(lambda);

    lambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ["*"],
        actions: ["*"],
      })
    );

    lambda.addEventSource(
      new S3EventSource(bucket, {
        events: [EventType.OBJECT_CREATED, EventType.OBJECT_REMOVED],
      })
    );
  }
}
