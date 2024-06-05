import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { join } from "path";
import { useApp } from "@asgard/framework/lib/app-contex.js";

export class AsgardStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const app = useApp();

    new NodejsFunction(this, app.env, {
      entry: join(import.meta.dirname, "lambda.ts"),
      handler: "handler",
    });

    new NodejsFunction(this, "lambda-2", {
      entry: join(import.meta.dirname, "lambda-2.ts"),
      handler: "handler",
    });

    // example resource
    new sqs.Queue(this, `sqs-${app.branch}`, {
      queueName: `sqs-${app.branch}`,
      visibilityTimeout: cdk.Duration.seconds(300),
    });
  }
}

export class AsgardStage extends cdk.Stage {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AsgardStack(this, "asgard");
  }
}
