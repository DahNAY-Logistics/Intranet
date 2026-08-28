import prisma from '../../db.ts';
import { deleteBlob } from './blob-storage.ts';

export async function deleteAttachment(attachmentId: number) {
  const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
  if (!attachment) return;

  await deleteBlob({ url: attachment.url });
  await prisma.attachment.delete({ where: { id: attachmentId } });
}
