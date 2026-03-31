import { Suspense } from "react";
import { getFraudStats, getTransactions } from "@/lib/data";
import { StatCard } from "@/components/dashboard/StatCard";
import { FraudCharts } from "@/components/dashboard/FraudCharts";
import { TransactionTable } from "@/features/transactions/components/TransactionTable";
import { ShieldAlert, Activity, DollarSign, TrendingUp, Zap } from "lucide-react";

export default async function DashboardPage() {
  const [stats, transactions] = await Promise.all([
    getFraudStats(),
    getTransactions(),
  ]);

  const fraudRatePercent = (stats.fraudRate * 100).toFixed(1);

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* ─── BENTO GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-min gap-6">

        {/* ROW 1: 4 KPI Cards */}
        <div className="col-span-1 md:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Tổng Giao dịch"
            value={stats.totalTransactions.toString()}
            description="Đã phân tích hôm nay"
            icon={<Activity size={18} />}
            accentClass="text-foreground"
          />
          <StatCard
            title="Phát hiện Bất thường"
            value={stats.totalFraud.toString()}
            description={`${fraudRatePercent}% tỉ lệ cảnh báo`}
            icon={<ShieldAlert size={18} />}
            accentClass="text-rose"
          />
          <StatCard
            title="Giá trị Bảo vệ"
            value={`${(stats.totalAmount / 1_000_000).toFixed(1)}M ₫`}
            description="Tổng tiền thanh khoản"
            icon={<DollarSign size={18} />}
            accentClass="text-emerald"
          />
          <StatCard
            title="Thiệt hại Ngăn chặn"
            value={`${(stats.fraudAmount / 1_000_000).toFixed(1)}M ₫`}
            description="Đã chặn tức thời"
            icon={<TrendingUp size={18} />}
            accentClass="text-accent"
          />
        </div>

        {/* ROW 2: Charts */}
        <FraudCharts
          fraudByType={stats.fraudByType}
          fraudByTxType={stats.fraudByTxType}
        />

        {/* ROW 3: Live Data Grid / Logs */}
        <Suspense
          fallback={
            <div className="col-span-1 lg:col-span-12 w-full h-[500px] flex items-center justify-center bg-gradient-to-b from-white/[0.04] to-transparent rounded-2xl border border-border-default shadow-cinematic">
              <Zap size={24} className="text-accent animate-pulse opacity-50" />
            </div>
          }
        >
          {/* Note: TransactionTable already specifies col-span-12 inside its Spotlight wrapper now */}
          <TransactionTable transactions={transactions} />
        </Suspense>

      </div>
    </div>
  );
}
