/**
 * @file app/api/uploadthing/route.ts
 * @description Next.js API route handling requests for the route.ts endpoint.
 */

import { createRouteHandler } from "uploadthing/next";
import { fileRouter } from "./core";

export const { GET, POST } = createRouteHandler({ router: fileRouter });
