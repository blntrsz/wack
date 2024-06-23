import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Remix } from "../constructs/remix.js";
import type { ApiStack } from "./api-stack.js";

interface Stacks {
  apiStack: ApiStack;
}

export class UiStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, stacks: Stacks) {
    super(scope, id, props);

    new Remix(this, "remix", {
      apiUrl: stacks.apiStack.api.url,
      uiPath: "../ui",
    });
  }
}
