import { CfnOutput } from "aws-cdk-lib";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { FunctionUrlAuthType, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

interface ApiProps {
  entry: string;
}

export class Api extends Construct {
  api: LambdaRestApi;

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    const fn = new NodejsFunction(this, "lambda", {
      entry: props.entry,
      handler: "handler",
      runtime: Runtime.NODEJS_20_X,
    });

    fn.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
    });

    this.api = new LambdaRestApi(this, "myapi", {
      handler: fn,
    });

    new CfnOutput(this, "api-url", {
      value: this.api.url,
    });
  }
}
