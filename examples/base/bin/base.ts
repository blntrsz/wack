#!/usr/bin/env node
import 'source-map-support/register';
import { BaseStack } from '../lib/base-stack';
import { CDKApplication } from 'opinionated-ci-pipeline';

new CDKApplication({
  stacks: {
    create: (scope, projectName, envName) => {
      new BaseStack(scope, 'BaseStack', { stackName: `${projectName}-${envName}-BaseStack` });
    },
  },
  repository: {
    host: 'github',
    name: 'blntrsz/asgard',
  },
  packageManager: 'pnpm',
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
