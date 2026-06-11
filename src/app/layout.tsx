import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { PostHogProvider } from "@/components/providers/posthog-provider";
import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/toaster";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TSA OS — the operating system for the student-athlete's day",
  description:
    "An internal platform where academics and athletics feed each other. AI-planned mornings, training afternoons.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <PostHogProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Toaster />
        </PostHogProvider>
      </body>
    </html>
  );
}
