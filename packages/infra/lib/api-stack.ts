import { Stack, StackProps } from "aws-cdk-lib";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { Api } from "../constructs/api.js";

export class ApiStack extends Stack {
  api: LambdaRestApi;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.api = new Api(this, "api", {
      entry: "../backend/src/index.ts",
    }).api;
  }
}
