import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  accentClass?: string;
  icon: React.ReactNode;
}

/**
 * StatCard – Linear Modern Cinematic Style
 * Multi-layer shadow, ambient bg, inner highlight edge.
 */
export function StatCard({
  title,
  value,
  description,
  accentClass = "text-accent", // changed to text accent instead of bg block
  icon,
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl transition-all duration-300 ease-out hover:-translate-y-1 bg-gradient-to-b from-white/[0.04] to-transparent shadow-cinematic hover:shadow-cinematic-hover border border-border-default hover:border-border-hover">
      
      {/* Inner top highlight line */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none shadow-inner-glow" />
      
      {/* Optional Mouse Spotlight (Simulated via hover gradient overlay) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(94,106,210,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Header block */}
      <div className="px-6 py-5 flex items-center justify-between">
        <p className="text-foreground-muted text-sm font-500 tracking-tight">{title}</p>
        <div className={cn("text-foreground-subtle group-hover:drop-shadow-[0_0_8px_rgba(94,106,210,0.5)] transition-all duration-300", accentClass)}>
          {icon}
        </div>
      </div>
      
      {/* Value block */}
      <div className="px-6 pb-6 relative z-10">
        <p className="text-3xl font-600 text-foreground tracking-tight">{value}</p>
        {description && (
          <p className="text-sm text-foreground-muted mt-2 font-400">{description}</p>
        )}
      </div>
    </div>
  );
}
