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
    <div className="space-y-12 pb-12">
      {/* ─── KPI Stats Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
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

      {/* ─── Charts ─── */}
      <FraudCharts
        fraudByType={stats.fraudByType}
        fraudByTxType={stats.fraudByTxType}
      />

      {/* ─── Transaction Table ─── */}
      <Suspense
        fallback={
          <div className="w-full h-96 flex items-center justify-center bg-gradient-to-b from-white/[0.04] to-transparent rounded-2xl border border-border-default">
            <Zap size={24} className="text-accent animate-pulse opacity-50" />
          </div>
        }
      >
        <TransactionTable transactions={transactions} />
      </Suspense>
    </div>
  );
}
