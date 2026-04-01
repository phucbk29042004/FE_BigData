import { Sidebar } from "@/components/shared/Sidebar";

/**
 * Dashboard layout – Sidebar + Cinematic Ambient Workspace
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-ambient-layer relative overflow-hidden">
      
      {/* ─── Cinematic Environment Layers ─── */}
      <div className="absolute inset-0 pointer-events-none texture-noise z-0" />
      <div className="absolute inset-0 pointer-events-none texture-grid opacity-[0.03] z-0" />
      
      {/* Floating Light Blobs */}
      <div className="absolute top-[-20%] left-[20%] w-[1000px] h-[600px] bg-accent blur-[150px] rounded-[100%] opacity-10 pointer-events-none blob-float z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[500px] bg-[#9E7BFF] blur-[120px] rounded-[100%] opacity-[0.08] pointer-events-none blob-float-alt z-0" />

      {/* ─── Application Interface ─── */}
      <div className="relative z-10 flex w-full">
        <Sidebar />
        {/* Offset content by sidebar width (w-56 = 224px) */}
        <main className="flex-1 overflow-y-auto w-full pt-16 lg:pt-0 pl-0 lg:pl-56 transition-all duration-300">
          <div className="max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12">
            {children}
          </div>
        </main>
      </div>
      
    </div>
  );
}
