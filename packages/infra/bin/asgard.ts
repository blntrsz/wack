#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { PipelineStack } from "@asgard/framework/lib/pipeline-stack.js";
import { AsgardStage } from "../lib/asgard-stack.js";
import { BootstrapStack } from "@asgard/framework/lib/bootstrap-stack.js";

const app = new cdk.App();

new PipelineStack(app, "pipeline", (stack) => new AsgardStage(stack, "asgard"));
new BootstrapStack(app, "bootstrap");
