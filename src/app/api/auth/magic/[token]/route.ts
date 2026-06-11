import { NextResponse } from "next/server";
import { verifyMagic } from "@/lib/magic-token";
import { env } from "@/env";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } },
) {
  const secret = env.MAGIC_LINK_SECRET ?? env.AUTH_SECRET;
  const payload = await verifyMagic(params.token, secret);

  if (!payload) {
    return NextResponse.redirect(new URL("/sign-in?error=InvalidMagicLink", env.NEXT_PUBLIC_APP_URL));
  }

  const response = NextResponse.redirect(new URL("/parent", env.NEXT_PUBLIC_APP_URL));

  response.cookies.set("tsa_parent", params.token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return response;
}
