/**
 * @file lib/image-compress.ts
 * @description Client-side utility for compressing and resizing images using HTML5 canvas before uploading.
 * 
 * @exports
 * - compressImage(file, options): Compresses a single image file to under target size (typically 100KB-300KB)
 * - compressImages(files, options): Compresses an array of image files
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

/**
 * Compresses an image file client-side using canvas resizing and JPEG quality compression.
 */
export async function compressImage(
  file: File,
  {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    mimeType = "image/jpeg",
  }: CompressOptions = {}
): Promise<File> {
  // If it's not a compressible image, or it's an animated GIF, return it as-is
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio resizing
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Determine output filename extension
            let name = file.name;
            const ext = mimeType === "image/webp" ? "webp" : "jpg";
            const lastDot = name.lastIndexOf(".");
            if (lastDot !== -1) {
              name = name.slice(0, lastDot) + "." + ext;
            } else {
              name = name + "." + ext;
            }

            const compressedFile = new File([blob], name, {
              type: mimeType,
              lastModified: Date.now(),
            });

            // Return compressed file if it's smaller, otherwise return the original
            resolve(compressedFile.size < file.size ? compressedFile : file);
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/**
 * Utility to compress multiple images sequentially.
 */
export async function compressImages(
  files: File[],
  options?: CompressOptions
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}
