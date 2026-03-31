import { cn } from "@/lib/utils";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  accentClass?: string;
  icon: React.ReactNode;
}

/**
 * StatCard – Refactored to use SpotlightCard
 */
export function StatCard({
  title,
  value,
  description,
  accentClass = "text-accent",
  icon,
}: StatCardProps) {
  return (
    <SpotlightCard className="flex flex-col h-full">
      {/* Header block */}
      <div className="px-5 py-4 flex items-center justify-between">
        <p className="text-foreground-muted text-sm font-500 tracking-tight">{title}</p>
        <div className={cn("text-foreground-subtle transition-all duration-300", accentClass)}>
          {icon}
        </div>
      </div>
      
      {/* Value block */}
      <div className="px-5 pb-5 mt-auto">
        <p className="text-3xl font-600 text-foreground tracking-tight">{value}</p>
        {description && (
          <p className="text-xs text-foreground-muted mt-2 font-400">{description}</p>
        )}
      </div>
    </SpotlightCard>
  );
}
