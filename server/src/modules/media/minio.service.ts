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

  async createMultipartUpload(key: string, mimeType: string): Promise<string> {
    return this.client.initiateNewMultipartUpload(this.bucket, key, { "Content-Type": mimeType });
  }

  async presignPartUrl(key: string, uploadId: string, partNumber: number): Promise<string> {
    return this.client.presignedUrl("PUT", this.bucket, key, 3600, {
      partNumber: String(partNumber),
      uploadId,
    });
  }

  async completeMultipartUpload(key: string, uploadId: string): Promise<void> {
    const parts = await (this.client as any).listParts(this.bucket, key, uploadId);
    await this.client.completeMultipartUpload(this.bucket, key, uploadId, parts);
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    await this.client.abortMultipartUpload(this.bucket, key, uploadId);
  }

  async presignGetUrl(key: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expirySeconds);
  }
}
