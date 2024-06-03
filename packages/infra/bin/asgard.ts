#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { $ } from "zx";
import { PipelineStack } from "@asgard/framework/lib/pipeline-stack.js";
import { AsgardStage } from "../lib/asgard-stack.js";

const app = new cdk.App();
const branch = (await $`git branch --show-current`.then((s) =>
  s.stdout.trim().substring(0, 8)
)) as string;

new PipelineStack(
  app,
  "PipelineStack",
  { branch },
  (stack) => new AsgardStage(stack, "AsgardStage")
);
