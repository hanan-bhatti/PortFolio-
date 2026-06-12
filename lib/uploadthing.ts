import { generateUploadButton } from "@uploadthing/react";
import type { AppFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<AppFileRouter>();
