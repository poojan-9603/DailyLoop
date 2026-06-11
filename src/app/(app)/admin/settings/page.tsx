import { IntegrationsSettings } from "@/features/admin/components/IntegrationsSettings";

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage integrations for your organization</p>
      </div>
      <IntegrationsSettings />
    </div>
  );
}
