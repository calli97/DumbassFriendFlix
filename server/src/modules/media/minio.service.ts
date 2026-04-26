import { Injectable } from "@nestjs/common";
import { Client } from "minio";
import { Readable } from "stream";

@Injectable()
export class MinioService {
  private readonly client: Client;
  private readonly bucket: string;

  constructor() {
    const host = process.env.MINIO_HOST!;
    const parsed = new URL(host);

    this.client = new Client({
      endPoint: parsed.hostname,
      port: parseInt(process.env.MINIO_PORT ?? "9000", 10),
      useSSL: host.startsWith("https://"),
      accessKey: process.env.MINIO_USER!,
      secretKey: process.env.MINIO_PASSWORD!,
    });

    this.bucket = process.env.MINIO_BUCKET!;
  }

  async uploadFile(objectName: string, filePath: string, mimeType: string): Promise<void> {
    await this.client.fPutObject(this.bucket, objectName, filePath, {
      "Content-Type": mimeType,
    });
  }

  async getObjectSize(objectName: string): Promise<number> {
    const stat = await this.client.statObject(this.bucket, objectName);
    return stat.size;
  }

  getObject(objectName: string): Promise<Readable> {
    return this.client.getObject(this.bucket, objectName);
  }

  getPartialObject(objectName: string, offset: number, length: number): Promise<Readable> {
    return this.client.getPartialObject(this.bucket, objectName, offset, length);
  }
}
