#!/usr/bin/env node
import 'source-map-support/register';
import { CDKApplication } from 'opinionated-ci-pipeline';
import { ApiStack } from '../lib/api-stack';

new CDKApplication({
  stacks: {
    create: (scope, projectName, envName) => {
      new ApiStack(scope, 'api', { stackName: `${projectName}-${envName}-api` });
    },
  },
  repository: {
    host: 'github',
    name: 'blntrsz/asgard',
  },
  packageManager: 'pnpm',
  commands: {
    preInstall: ["cd packages/infra"],
  },
  cdkOutputDirectory: "packages/infra/cdk.out",
  pipeline: [
    {
      environment: 'test',
      post: [
        'echo "do integration tests here"',
      ],
    },
    {
      environment: 'prod',
    },
  ],
});
