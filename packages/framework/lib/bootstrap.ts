import { GetObjectCommand, S3 } from "@aws-sdk/client-s3";
import { exec } from "child_process";
import fsp from "fs/promises";
import decompress from "decompress";

const client = new S3();

interface Event {
  Records: {
    eventVersion: string;
    eventSource: string;
    awsRegion: string;
    eventTime: string;
    eventName: string;
    userIdentity: {
      principalId: string;
    };
    requestParameters: {
      sourceIPAddress: string;
    };
    responseElements: {
      "x-amz-request-id": string;
      "x-amz-id-2": string;
    };
    s3: {
      s3SchemaVersion: string;
      configurationId: string;
      bucket: {
        name: string;
        ownerIdentity: {
          principalId: string;
        };
        arn: string;
      };
      object: {
        key: string;
        sequencer: string;
      };
    };
  }[];
}

export async function handler(event: Event) {
  for (const record of event.Records) {
    console.log({
      Bucket: record.s3.bucket.name,
      Key: record.s3.object.key,
    });
    const obj = await client.send(
      new GetObjectCommand({
        Bucket: record.s3.bucket.name,
        Key: record.s3.object.key,
      })
    );

    if (!obj) {
      throw new Error("Impossible state");
    }

    const body = (await obj.Body?.transformToString()) ?? "";

    await fsp.writeFile(`/tmp/${record.s3.object.key}`, body);

    await decompress(
      `/tmp/${record.s3.object.key}`,
      `/tmp/${record.s3.object.key}`.replace(".zip", "")
    );

    exec(`ls -la /tmp`, (_err, stout, _sterr) => {
      console.log(stout);
    });
  }

  return {};
}
