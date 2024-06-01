#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { WackStack } from "../lib/wack-stack.js";
import { $ } from "zx";
import { BootstraplessStackSynthesizer } from "cdk-bootstrapless-synthesizer";

const app = new cdk.App();
const branch = (await $`git branch --show-current`.then((s) =>
  s.stdout.trim().substring(0, 8)
)) as string;

new WackStack(app, "WackStack", {
  branch,
  // synthesizer: new BootstraplessStackSynthesizer({
  //   templateBucketName: "cfn-template-bucket",
  //
  //   fileAssetBucketName: "file-asset-bucket-${AWS::Region}",
  //   fileAssetRegionSet: ["us-west-1", "us-west-2"],
  //   fileAssetPrefix: "file-asset-prefix/latest/",
  // }),
  // env: { account: "123", region: "eu-central-1" },
});
