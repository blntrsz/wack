import { GetObjectCommand, S3 } from "@aws-sdk/client-s3";
import fs from "fs";
import { $ } from "zx";
import { pipeline } from "stream";
import { promisify } from "util";

const client = new S3();
const pipe = promisify(pipeline);

async function createPipeline(record) {
  const obj = await client.send(
    new GetObjectCommand({
      Bucket: record.s3.bucket.name,
      Key: record.s3.object.key,
    })
  );

  if (!obj) {
    throw new Error("Impossible state");
  }

  const branch = record.s3.object.key.replace(".zip", "");

  const writeStream = fs.createWriteStream(`/tmp/${record.s3.object.key}`);
  await pipe(obj.Body, writeStream);
  console.log("Write finished");

  await $`unzip -o /tmp/${record.s3.object.key} -d /tmp/${branch}`;
  console.log("Unzipping finished");

  await $`npx cdk deploy --app '/tmp/${branch}/packages/infra/cdk.out/' pipeline --require-approval=never`;
  console.log("Deployed");
}

export async function handler(event) {
  console.debug(JSON.stringify(event));

  for (const record of event.Records) {
    console.log({
      Bucket: record.s3.bucket.name,
      Key: record.s3.object.key,
    });

    if (record.eventName === "ObjectCreated:Put") {
      createPipeline(record);
    }
  }
}
