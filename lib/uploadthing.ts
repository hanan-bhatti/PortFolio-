/**
 * @file lib/uploadthing.ts
 * @description UploadThing React helpers and components for handling file uploads.
 * 
 * @exports
 * - UploadButton: Pre-configured React upload button component typed with AppFileRouter
 * - useUploadThing: React hook to programmatically handle file uploads in components
 */

import { generateUploadButton, generateReactHelpers } from "@uploadthing/react";
import type { AppFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<AppFileRouter>();
export const { useUploadThing } = generateReactHelpers<AppFileRouter>();
