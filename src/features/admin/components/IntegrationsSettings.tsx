"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";

export function IntegrationsSettings() {
  const { toast } = useToast();
  const { data: settings, isLoading } = api.admin.orgSettings.useQuery();

  const [slackUrl, setSlackUrl] = useState("");
  const [notionToken, setNotionToken] = useState("");
  const [notionDbId, setNotionDbId] = useState("");

  useEffect(() => {
    if (settings) {
      setSlackUrl(settings.slackWebhookUrl ?? "");
      setNotionToken(settings.notionToken ?? "");
      setNotionDbId(settings.notionDatabaseId ?? "");
    }
  }, [settings]);

  const saveMutation = api.admin.updateOrgSettings.useMutation({
    onSuccess: () => toast({ title: "Settings saved" }),
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const testSlack = api.admin.testSlack.useMutation({
    onSuccess: () => toast({ title: "Slack test message sent ✓" }),
    onError: (e) => toast({ title: "Slack error", description: e.message, variant: "destructive" }),
  });

  const syncNotion = api.admin.syncNotion.useMutation({
    onSuccess: (r) => toast({ title: `Notion sync complete — ${r.upserted} subjects upserted` }),
    onError: (e) => toast({ title: "Notion error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-secondary/40 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Slack */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Slack</h3>
          <p className="text-xs text-muted-foreground">Incoming webhook for weekly highlights</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="slack-url">Webhook URL</Label>
          <div className="flex gap-2">
            <Input
              id="slack-url"
              type="url"
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/…"
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => testSlack.mutate()}
              disabled={testSlack.isPending || !slackUrl}
              aria-label="Test Slack webhook"
            >
              {testSlack.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
            </Button>
          </div>
        </div>
      </section>

      {/* Notion */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Notion</h3>
          <p className="text-xs text-muted-foreground">Sync curriculum from a Notion database</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notion-token">Integration Token</Label>
          <Input
            id="notion-token"
            type="password"
            value={notionToken}
            onChange={(e) => setNotionToken(e.target.value)}
            placeholder="secret_…"
          />
          <Label htmlFor="notion-db">Database ID</Label>
          <div className="flex gap-2">
            <Input
              id="notion-db"
              value={notionDbId}
              onChange={(e) => setNotionDbId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => syncNotion.mutate()}
              disabled={syncNotion.isPending || !notionToken || !notionDbId}
              aria-label="Sync Notion curriculum"
            >
              {syncNotion.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sync"}
            </Button>
          </div>
        </div>
      </section>

      <Button
        onClick={() =>
          saveMutation.mutate({
            slackWebhookUrl: slackUrl,
            notionToken,
            notionDatabaseId: notionDbId,
          })
        }
        disabled={saveMutation.isPending}
        aria-label="Save integration settings"
      >
        {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save Settings
      </Button>
    </div>
  );
}
