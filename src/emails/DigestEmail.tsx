import * as React from "react";
import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Img,
  Head,
  Preview,
  Section,
  Hr,
} from "@react-email/components";

interface DigestEmailProps {
  studentName: string;
  content: string;
  magicUrl: string;
  pixelUrl: string;
  date: string;
}

export function DigestEmail({ studentName, content, magicUrl, pixelUrl, date }: DigestEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{studentName}&apos;s day at Texas Sports Academy — {date}</Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "sans-serif", margin: 0 }}>
        <Container style={{ maxWidth: "520px", margin: "40px auto", backgroundColor: "#ffffff", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          {/* Header */}
          <Section style={{ backgroundColor: "#1e3a5f", padding: "24px 32px" }}>
            <Heading style={{ color: "#ffffff", fontSize: "20px", fontWeight: "700", margin: 0 }}>
              Texas Sports Academy
            </Heading>
            <Text style={{ color: "#93c5fd", fontSize: "13px", margin: "4px 0 0" }}>
              Daily Digest &mdash; {date}
            </Text>
          </Section>

          {/* Content */}
          <Section style={{ padding: "32px 32px 24px" }}>
            <Text style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: "0 0 16px" }}>
              {studentName}&apos;s Day
            </Text>
            <Text style={{ fontSize: "15px", lineHeight: "1.6", color: "#374151", margin: "0 0 24px" }}>
              {content}
            </Text>

            <Button
              href={magicUrl}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                padding: "12px 24px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              View Full Day &rarr;
            </Button>
          </Section>

          <Hr style={{ borderColor: "#e5e7eb", margin: "0 32px" }} />

          {/* Footer */}
          <Section style={{ padding: "16px 32px 24px" }}>
            <Text style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>
              You&apos;re receiving this because you&apos;re linked to {studentName}&apos;s account.
              The link above expires in 7 days.
            </Text>
          </Section>

          {/* Tracking pixel */}
          <Img src={pixelUrl} width="1" height="1" alt="" style={{ display: "block" }} />
        </Container>
      </Body>
    </Html>
  );
}

export default DigestEmail;
