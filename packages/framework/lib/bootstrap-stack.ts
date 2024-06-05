import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket, EventType } from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { S3EventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { join } from "path";

export class BootstrapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "bucket", {
      bucketName: "asgard-main-bucket",
    });

    const lambda = new NodejsFunction(this, "bootstrap", {
      entry: join(import.meta.dirname, "bootstrap.ts"),
    });

    lambda.addEventSource(
      new S3EventSource(bucket, {
        events: [EventType.OBJECT_CREATED, EventType.OBJECT_REMOVED],
      })
    );
  }
}
