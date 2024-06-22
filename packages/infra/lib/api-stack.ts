import { Stack, StackProps } from "aws-cdk-lib"
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway"
import { FunctionUrlAuthType, Runtime } from "aws-cdk-lib/aws-lambda"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import { Construct } from "constructs"

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const fn = new NodejsFunction(this, 'lambda', {
      entry: '../backend/src/index.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
    })

    fn.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
    })

    new LambdaRestApi(this, 'myapi', {
      handler: fn,
    })
  }
}
