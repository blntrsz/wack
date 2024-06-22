import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Remix } from "../constructs/remix.js";

export class UiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new Remix(this, "remix", {
      serverPath: "../ui/server/index.mjs",
      buildPath: "../ui/build",
      region: this.region,
    });
  }
}
