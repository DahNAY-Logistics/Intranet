import { BlobServiceClient } from '@azure/storage-blob';

import { envMessages } from 'core/messages.ts';

const { BLOB_STORAGE_CONNECTION_STRING, BLOB_STORAGE_CONTAINER_NAME } = process.env;

if (!BLOB_STORAGE_CONNECTION_STRING || !BLOB_STORAGE_CONTAINER_NAME) {
  throw new Error(envMessages.MISSING_BLOB_STORAGE_ENV);
}

const containerName = BLOB_STORAGE_CONTAINER_NAME;
const blobServiceClient = BlobServiceClient.fromConnectionString(BLOB_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(containerName);

let containerReady: Promise<unknown> | null = null;

function ensureContainer(): Promise<unknown> {
  containerReady ??= containerClient.createIfNotExists({ access: 'blob' }).then(() => containerClient.setAccessPolicy('blob'));
  return containerReady;
}

const extensionsByMimeType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function extensionForMimeType(mimeType: string): string {
  return extensionsByMimeType[mimeType] ?? 'bin';
}

export interface UploadBlobParams {
  blobName: string;
  buffer: Buffer;
  mimeType: string;
}

export async function uploadBlob({ blobName, buffer, mimeType }: UploadBlobParams): Promise<string> {
  await ensureContainer();
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(buffer, { blobHTTPHeaders: { blobContentType: mimeType } });
  return blockBlobClient.url;
}

export function blobNameFromUrl(url: string): string | null {
  const marker = `/${containerName}/`;
  const path = new URL(url).pathname;
  const index = path.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(path.slice(index + marker.length));
}

export async function deleteBlob({ url }: { url: string }): Promise<void> {
  const blobName = blobNameFromUrl(url);
  if (!blobName) return;

  try {
    await containerClient.getBlockBlobClient(blobName).deleteIfExists();
  } catch {
    return;
  }
}
