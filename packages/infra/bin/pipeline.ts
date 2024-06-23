#!/usr/bin/env node
import "source-map-support/register";
import { CDKApplication } from "opinionated-ci-pipeline";
import { ApiStack } from "../lib/api-stack.js";
import { UiStack } from "../lib/ui-stack.js";

new CDKApplication({
  stacks: {
    create: (scope, projectName, envName) => {
      const apiStack = new ApiStack(scope, "api", {
        stackName: `${projectName}-${envName}-api`,
      });
      new UiStack(
        scope,
        "ui",
        {
          stackName: `${projectName}-${envName}-ui`,
        },
        { apiStack }
      );
    },
  },
  repository: {
    host: "github",
    name: "blntrsz/asgard",
  },
  packageManager: "pnpm",
  commands: {
    buildAndTest: ["cd packages/ui && pnpm build && cd ../infra"],
  },
  cdkOutputDirectory: "packages/infra/cdk.out",
  pipeline: [
    {
      environment: "test",
      post: ['echo "do integration tests here"'],
    },
    {
      environment: "prod",
    },
  ],
});
