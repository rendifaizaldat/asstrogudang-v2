// app/(dashboard)/settings/page.tsx
import { getSettings } from "./actions";
import SettingsForm from "@/components/settings/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Pengaturan Sistem</h2>
        <p className="text-slate-500 text-sm">
          Sesuaikan identitas aplikasi, logo, dan format laporan.
        </p>
      </div>

      <SettingsForm initialData={settings || {}} />
    </div>
  );
}
