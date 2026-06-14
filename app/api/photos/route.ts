/**
 * @file app/api/photos/route.ts
 * @description Next.js API route handling requests for the route.ts endpoint.
 * 
 * @exports
 * - GET(): Function
 * - POST(): Function
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";

let exifrModule: any = null;

async function getExifr() {
  if (exifrModule) return exifrModule;

  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const msg = args[0];
    if (
      typeof msg === "string" &&
      (msg.includes("Couldn't load fs") || msg.includes("Couldn't load zlib"))
    ) {
      return; // silence these dynamic import warning messages from exifr
    }
    originalConsoleError(...args);
  };

  try {
    const mod = await import("exifr");
    exifrModule = mod.default || mod;
  } finally {
    console.error = originalConsoleError;
  }

  return exifrModule;
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  const settings = await getSiteSettings();
  const isEnabled = settings.photography_enabled === "true";

  if (!isEnabled && !session?.user) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // If there's an admin session, we return all photos so they can manage/preview them.
  // Otherwise, only return visible photos for public visitors.
  const photos = await prisma.photo.findMany({
    where: session?.user ? undefined : { visible: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ photos });
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json() as { imageUrl: string; title?: string };
  if (!body.imageUrl) {
    return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  }

  let exifData = null;

  try {
    const response = await fetch(body.imageUrl);
    if (response.ok) {
      const buffer = await response.arrayBuffer();

      interface ParseResult {
        Make?: string;
        Model?: string;
        FNumber?: number;
        ExposureTime?: number;
        ISO?: number;
        FocalLength?: number;
        DateTimeOriginal?: Date | string;
        latitude?: number;
        longitude?: number;
      }

      const exifr = await getExifr();
      const exif = (await exifr.parse(Buffer.from(buffer), {
        pick: [
          "Make",
          "Model",
          "FNumber",
          "ExposureTime",
          "ISO",
          "FocalLength",
          "DateTimeOriginal",
          "latitude",
          "longitude",
        ],
      })) as ParseResult | undefined;

      if (exif) {
        let locationName = null;
        if (exif.latitude !== undefined && exif.longitude !== undefined) {
          try {
            // Add 1 second delay to respect Nominatim rate limit
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${exif.latitude}&lon=${exif.longitude}&format=json`,
              { headers: { "User-Agent": "HananBhatti-Portfolio/1.0" } }
            );
            if (geoRes.ok) {
              interface NominatimAddress {
                city?: string;
                town?: string;
                village?: string;
                country?: string;
              }
              interface NominatimResult {
                address?: NominatimAddress;
              }
              const geo = (await geoRes.json()) as NominatimResult;
              locationName = [
                geo.address?.city || geo.address?.town || geo.address?.village,
                geo.address?.country,
              ]
                .filter(Boolean)
                .join(", ");
            }
          } catch (geoError) {
            console.error("Failed to reverse geocode GPS coordinates:", geoError);
          }
        }

        let dateStr: string | null = null;
        if (exif.DateTimeOriginal) {
          if (exif.DateTimeOriginal instanceof Date) {
            dateStr = exif.DateTimeOriginal.toISOString();
          } else {
            dateStr = new Date(exif.DateTimeOriginal).toISOString();
          }
        }

        exifData = {
          make: exif.Make || null,
          model: exif.Model || null,
          fNumber: exif.FNumber || null,
          exposureTime: exif.ExposureTime || null,
          iso: exif.ISO || null,
          focalLength: exif.FocalLength || null,
          dateTimeOriginal: dateStr,
          latitude: exif.latitude || null,
          longitude: exif.longitude || null,
          locationName: locationName || null,
        };
      }
    }
  } catch (exifError) {
    console.error("Failed to extract EXIF data:", exifError);
  }

  const count = await prisma.photo.count();
  const photo = await prisma.photo.create({
    data: {
      imageUrl: body.imageUrl,
      title: body.title ?? null,
      order: count,
      visible: true,
      exif_data: exifData !== null ? exifData : undefined,
    },
  });
  return NextResponse.json({ photo }, { status: 201 });
}
