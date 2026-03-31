import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";

/**
 * Dashboard layout – Sidebar + Topbar + Bento Grid Main Content
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#050506] relative overflow-hidden">
      
      {/* ─── Cinematic Environment Layers ─── */}
      <div className="absolute inset-0 pointer-events-none texture-noise z-0" />
      <div className="absolute inset-0 pointer-events-none texture-grid opacity-[0.03] z-0" />
      
      {/* Floating Light Blobs */}
      <div className="absolute top-[-20%] left-[20%] w-[1000px] h-[600px] bg-accent blur-[150px] rounded-[100%] opacity-10 pointer-events-none blob-float z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[500px] bg-[#9E7BFF] blur-[120px] rounded-[100%] opacity-[0.08] pointer-events-none blob-float-alt z-0" />

      {/* ─── Application Interface ─── */}
      <div className="relative z-10 flex w-full">
        <Sidebar />
        
        {/* Main Content Area (Offset by Sidebar Width padding pl-64) */}
        <div className="flex-1 flex flex-col min-w-0 pl-64">
          <Topbar />
          <main className="flex-1 overflow-y-auto w-full">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 lg:p-10">
              {children}
            </div>
          </main>
        </div>
      </div>
      
    </div>
  );
}
