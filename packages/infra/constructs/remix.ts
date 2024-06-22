import { Bucket } from "aws-cdk-lib/aws-s3";
import {
  BucketDeployment,
  CacheControl,
  Source,
} from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import {
  LogLevel,
  NodejsFunction,
  OutputFormat,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { HttpOrigin, S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  HttpVersion,
  LambdaEdgeEventType,
  OriginAccessIdentity,
  OriginRequestCookieBehavior,
  OriginRequestHeaderBehavior,
  OriginRequestPolicy,
  OriginRequestQueryStringBehavior,
  PriceClass,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import {
  FunctionUrlAuthType,
  InvokeMode,
  Runtime,
} from "aws-cdk-lib/aws-lambda";

export class Remix extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const assetsBucket = new Bucket(this, "AssetsBucket", {
      autoDeleteObjects: true,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const assetsBucketOriginAccessIdentity = new OriginAccessIdentity(
      this,
      "AssetsBucketOriginAccessIdentity"
    );

    const assetsBucketS3Origin = new S3Origin(assetsBucket, {
      originAccessIdentity: assetsBucketOriginAccessIdentity,
    });

    assetsBucket.grantRead(assetsBucketOriginAccessIdentity);

    const fn = new NodejsFunction(this, "RemixServerFn", {
      currentVersionOptions: {
        removalPolicy: RemovalPolicy.DESTROY,
      },
      entry: "../ui/server/index.mjs",
      logRetention: RetentionDays.THREE_DAYS,
      memorySize: 256,
      timeout: Duration.seconds(10),
      runtime: Runtime.NODEJS_18_X,

      bundling: {
        esbuildArgs: {
          "--tree-shaking": true,
        },
        format: OutputFormat.CJS,
        logLevel: LogLevel.INFO,
        minify: true,
        commandHooks: {
          afterBundling(inputDir, outputDir) {
            return [
              //moving dependencies from the input to the output
              `cp ${inputDir}/build/server/*.map ${outputDir} || echo`,
              `cp ${inputDir}/build/server/*.json ${outputDir} || echo`,
            ];
          },
          beforeBundling: (): string[] => [],
          beforeInstall: (): string[] => [],
        },
      },
    });

    // The only way to interact with http streams is lambda function urls, which you cannot put behind a CDN, and route 53,
    // so i'm not going to bother right now.
    const url = fn.addFunctionUrl({
      invokeMode: InvokeMode.RESPONSE_STREAM,
      authType: FunctionUrlAuthType.NONE,
    });

    const distribution = new Distribution(this, id + "Distribution", {
      enableLogging: false,
      httpVersion: HttpVersion.HTTP2_AND_3,
      priceClass: PriceClass.PRICE_CLASS_100,
      // Default behavior, all requests get handled by edge function, with the fall through origin as s3.
      defaultBehavior: {
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        compress: true,
        edgeLambdas: [
          {
            eventType: LambdaEdgeEventType.ORIGIN_REQUEST,
            functionVersion: fn.currentVersion,
            includeBody: true,
          },
        ],

        origin: new HttpOrigin(url.url.replace("https://", ""), {
          originId: "StreamingFnOriginId",
        }),
        originRequestPolicy: new OriginRequestPolicy(
          this,
          "OriginRequestPolicy",
          {
            headerBehavior: OriginRequestHeaderBehavior.all(),
            queryStringBehavior: OriginRequestQueryStringBehavior.all(),
            cookieBehavior: OriginRequestCookieBehavior.all(),
          }
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
      },
    });

    // Deploy the local code to S3
    new BucketDeployment(this, id + "AssetsDeployment", {
      destinationBucket: assetsBucket,
      distribution,
      prune: true,
      sources: [Source.asset("../ui/build/client")],
      cacheControl: [
        CacheControl.maxAge(Duration.days(365)),
        CacheControl.sMaxAge(Duration.days(365)),
      ],
    });
  }
}
