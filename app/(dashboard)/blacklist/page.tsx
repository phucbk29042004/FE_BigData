import { getBlacklist } from "@/lib/data";
import { BlacklistManager } from "@/features/blacklist/components/BlacklistManager";
import { ShieldX } from "lucide-react";

export const metadata = {
  title: "Access Control — FraudGuard",
  description: "Real-time network restrictions and blacklist enforcement.",
};

export default async function BlacklistPage() {
  const entries = await getBlacklist();

  return (
    <div className="space-y-12 pb-12">

      {/* ─── Interactive Client Grid ─── */}
      <BlacklistManager initialEntries={entries} />
    </div>
  );
}
