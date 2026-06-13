// lib/uploadthing.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

const f = createUploadthing();

export const ourFileRouter = {
  // Medical document uploads (PDF, images)
  medicalDocument: f({
    pdf:   { maxFileSize: "16MB", maxFileCount: 5 },
    image: { maxFileSize: "8MB",  maxFileCount: 5 },
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Log the upload
      await prisma.auditLog.create({
        data: {
          userId:   metadata.userId,
          action:   "FILE_UPLOADED",
          resource: "medical_document",
          details:  { fileName: file.name, fileSize: file.size, url: file.url },
        },
      });
      return { url: file.url, name: file.name, size: file.size };
    }),

  // Profile avatar
  avatar: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.user.update({
        where: { id: metadata.userId },
        data: { image: file.url },
      });
      return { url: file.url };
    }),

  // Chat file attachments
  messageAttachment: f({
    image: { maxFileSize: "8MB",  maxFileCount: 4 },
    pdf:   { maxFileSize: "16MB", maxFileCount: 2 },
    audio: { maxFileSize: "32MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, name: file.name, size: file.size, type: file.type };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
