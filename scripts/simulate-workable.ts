/**
 * Simulates a Workable candidate_hired webhook for testing.
 *
 * Usage: npx tsx --env-file=.env.local scripts/simulate-workable.ts
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const SECRET = process.env.WORKABLE_WEBHOOK_SECRET ?? "";

const payload = {
  event_type: "candidate_hired",
  data: {
    candidate: {
      name: "Jordan Smith",
      email: `coach-${Date.now()}@tsa.demo`,
    },
    job: {
      title: "Sprint Coach",
    },
  },
};

async function main() {
  console.log(`Sending Workable webhook to ${APP_URL}/api/webhooks/workable`);
  const res = await fetch(`${APP_URL}/api/webhooks/workable`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(SECRET ? { "x-workable-signature": SECRET } : {}),
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${text}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
