import { Bucket } from "aws-cdk-lib/aws-s3";
import {
  BucketDeployment,
  CacheControl,
  Source,
} from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { CfnOutput, Duration, RemovalPolicy } from "aws-cdk-lib";
import {
  LogLevel,
  NodejsFunction,
  OutputFormat,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import {
  S3Origin,
  FunctionUrlOrigin,
} from "aws-cdk-lib/aws-cloudfront-origins";
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  HttpVersion,
  OriginAccessIdentity,
  OriginRequestPolicy,
  PriceClass,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import {
  FunctionUrlAuthType,
  InvokeMode,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import path from "path";

interface RemixProps {
  apiUrl: string;
  uiPath: string;
}

export class Remix extends Construct {
  constructor(scope: Construct, id: string, props: RemixProps) {
    super(scope, id);

    const assetsBucket = new Bucket(this, "AssetsBucket", {
      autoDeleteObjects: true,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const assetsBucketOriginAccessIdentity = new OriginAccessIdentity(
      this,
      "RemixAssetsBucketOriginAccessIdentity"
    );

    const assetsBucketS3Origin = new S3Origin(assetsBucket, {
      originAccessIdentity: assetsBucketOriginAccessIdentity,
    });

    assetsBucket.grantRead(assetsBucketOriginAccessIdentity);

    const fn = new NodejsFunction(this, "RemixServerFn", {
      currentVersionOptions: {
        removalPolicy: RemovalPolicy.DESTROY,
      },
      entry: path.join(props.uiPath, "server/index.mjs"),
      logRetention: RetentionDays.THREE_DAYS,
      memorySize: 2048,
      timeout: Duration.seconds(10),
      runtime: Runtime.NODEJS_18_X,
      environment: {
        VITE_API_URL: props.apiUrl,
      },
      bundling: {
        esbuildArgs: {
          "--tree-shaking": true,
        },
        format: OutputFormat.CJS,
        logLevel: LogLevel.INFO,
        sourceMap: true,
        tsconfig: path.join(props.uiPath, "tsconfig.json"),
      },
    });

    const url = fn.addFunctionUrl({
      invokeMode: InvokeMode.RESPONSE_STREAM,
      authType: FunctionUrlAuthType.NONE,
    });

    const distribution = new Distribution(this, id + "Distribution", {
      enableLogging: false,
      httpVersion: HttpVersion.HTTP2_AND_3,
      priceClass: PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        compress: true,
        edgeLambdas: undefined,
        origin: new FunctionUrlOrigin(url),
        originRequestPolicy: OriginRequestPolicy.fromOriginRequestPolicyId(
          this,
          "policy",
          "b689b0a8-53d0-40ab-baf2-68738e2966ac"
        ),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      // Static assets are retrieved from the /assets path.
      additionalBehaviors: {
        "assets/*": {
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
          cachePolicy: CachePolicy.CACHING_OPTIMIZED,
          compress: true,
          origin: assetsBucketS3Origin,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        "favicon.ico": {
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
          cachePolicy: CachePolicy.CACHING_OPTIMIZED,
          compress: true,
          origin: assetsBucketS3Origin,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
    });

    new CfnOutput(this, "ui", {
      value: distribution.distributionDomainName,
    });

    // Deploy the local code to S3
    new BucketDeployment(this, id + "AssetsDeployment", {
      destinationBucket: assetsBucket,
      distribution,
      prune: true,
      sources: [Source.asset(path.join(props.uiPath, "build/client"))],
      cacheControl: [
        CacheControl.maxAge(Duration.days(365)),
        CacheControl.sMaxAge(Duration.days(365)),
      ],
    });
  }
}
