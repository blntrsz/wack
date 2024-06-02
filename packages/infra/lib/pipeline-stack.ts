import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { S3Trigger } from "aws-cdk-lib/aws-codepipeline-actions";
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { WackStage } from "./wack-stack.js";

interface Props extends cdk.StackProps {
  branch: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const bucket = Bucket.fromBucketName(this, "bucket", "wack-main-prod");

    const pipelineRole = new Role(this, "PipelineRole", {
      assumedBy: new ServicePrincipal("codepipeline.amazonaws.com"),
    });

    pipelineRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["*"],
        resources: ["*"],
      })
    );

    const pipeline = new CodePipeline(this, "Pipeline", {
      selfMutation: false,
      useChangeSets: false,
      role: pipelineRole,
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.s3(bucket, "main.zip", {
          trigger: S3Trigger.EVENTS,
        }),
        primaryOutputDirectory: "packages/infra/cdk.out",
        commands: [
          "npm i -g cdk@2.144.0",
          "cdk deploy --app 'packages/infra/cdk.out/'",
        ],
      }),
    });

    pipeline.addStage(new WackStage(this, "WackStack"));
  }
}
