import { NextResponse } from "next/server";
import { db } from "@/server/db";

// 1x1 transparent PNG
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

export async function GET(
  _req: Request,
  { params }: { params: { digestId: string } },
) {
  // Fire-and-forget update
  db.digest
    .update({
      where: { id: params.digestId },
      data: { openedAt: new Date() },
    })
    .catch(() => undefined);

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
