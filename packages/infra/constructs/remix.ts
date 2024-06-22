// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Duration, CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { join } from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

interface SsrStackProps {
  serverPath: string;
  buildPath: string;
  region: string;
}

export class Remix extends Construct {
  constructor(scope: Construct, id: string, props: SsrStackProps) {
    super(scope, id);

    const mySiteBucket = new s3.Bucket(this, "ssr-site", {
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "error.html",
      publicReadAccess: false,
      //only for demo not to use in production
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "ssr-oia"
    );
    mySiteBucket.grantRead(originAccessIdentity);

    new s3deploy.BucketDeployment(this, "Client-side React app", {
      sources: [s3deploy.Source.asset(join(props.buildPath, "client"))],
      destinationBucket: mySiteBucket,
    });

    const ssrFunction = new NodejsFunction(this, "ssr-handler", {
      entry: props.serverPath,
      timeout: Duration.seconds(15),
    });

    const ssrApi = new apigw.LambdaRestApi(this, "ssrEndpoint", {
      handler: ssrFunction,
    });

    new CfnOutput(this, "SSR API URL", { value: ssrApi.url });

    const apiDomainName = `${ssrApi.restApiId}.execute-api.${props.region}.amazonaws.com`;

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "ssr-cdn",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: mySiteBucket,
              originAccessIdentity: originAccessIdentity,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
              },
            ],
          },
          {
            customOriginSource: {
              domainName: apiDomainName,
              originPath: "/prod",
              originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            },
            behaviors: [
              {
                pathPattern: "/",
              },
            ],
          },
        ],
      }
    );

    new CfnOutput(this, "CF URL", {
      value: `https://${distribution.distributionDomainName}`,
    });
  }
}
