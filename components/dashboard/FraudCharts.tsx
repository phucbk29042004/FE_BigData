/**
 * FraudCharts – Dashboard Trực quan hóa Gian lận (4 Biểu đồ)
 *
 * Nhận trực tiếp danh sách giao dịch (Transaction[]) và tự tổng hợp dữ liệu
 * thông qua hook useFraudChartData (chạy bằng useMemo – không tính toán lại khi props không đổi).
 *
 * Bố cục: 2×2 grid, mỗi ô là một biểu đồ độc lập, cao = 280px
 *   [Biểu đồ 1: Tần suất Giao dịch Gian lận Theo Thời gian] [Biểu đồ 2: Phân bố Mức độ Rủi ro]
 *   [Biểu đồ 3: Phân loại Cảnh báo                        ] [Biểu đồ 4: Nguồn Giao dịch      ]
 */
"use client";

import { memo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Transaction } from "@/lib/validators/fraud";
import { useFraudChartData } from "@/features/transactions/hooks/useFraudChartData";

// ─── Design Palette (đồng nhất với globals.css) ──────────────────────────────
const ACCENT = "#5E6AD2";
const ROSE   = "#e11d48";
const CHART_COLORS = ["#5E6AD2", "#10B981", "#F59E0B", "#e11d48", "#8B5CF6", "#06B6D4"];

// ─── Custom Tooltip Glassmorphism ─────────────────────────────────────────────
function GlassTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string; fill?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      role="tooltip"
      className="bg-[#0a0a0c]/90 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shadow-xl text-sm pointer-events-none"
    >
      {label && <p className="font-semibold text-white mb-2 text-xs">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-[#8A8F98] text-xs mt-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.fill ?? p.color }} />
          <span>{p.name}:</span>
          <span className="font-semibold text-white">{p.value.toLocaleString("vi-VN")}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Chart Card Wrapper ───────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_2px_20px_rgba(0,0,0,0.4)]"
      aria-label={title}
    >
      {/* Inner highlight edge */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]" />
      {/* Accent glow top-right */}
      <div className="absolute right-0 top-0 w-48 h-48 bg-[rgba(94,106,210,0.12)] blur-[60px] rounded-full pointer-events-none" />

      <div className="relative z-10 px-6 pt-5 pb-2">
        <h3 className="text-sm font-semibold text-white tracking-tight leading-snug">{title}</h3>
        {subtitle && (
          <p className="text-[11px] text-[#8A8F98] mt-0.5 font-mono uppercase tracking-widest">
            {subtitle}
          </p>
        )}
      </div>
      <div className="relative z-10 px-4 pb-5">{children}</div>
    </div>
  );
}

// ─── Biểu đồ 1: Tần suất Giao dịch Gian lận Theo Thời gian ─────────────────
function Chart1_HourlyTrend({ data }: { data: ReturnType<typeof useFraudChartData>["hourlyData"] }) {
  return (
    <ResponsiveContainer width="100%" height={248}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={ACCENT} stopOpacity={0.25} />
            <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradFraud" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={ROSE} stopOpacity={0.35} />
            <stop offset="95%" stopColor={ROSE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", fill: "#8A8F98" }}
          tickLine={false}
          axisLine={false}
          interval={3}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", fill: "#8A8F98" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<GlassTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: "12px" }}
          formatter={(v) => <span style={{ fontSize: 10, color: "#8A8F98", fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", letterSpacing: "0.12em" }}>{v}</span>}
        />
        <Area
          type="monotone"
          dataKey="total"
          name="Tổng GD"
          stroke={ACCENT}
          strokeWidth={1.5}
          fill="url(#gradTotal)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: ACCENT }}
        />
        <Area
          type="monotone"
          dataKey="fraud"
          name="Gian lận"
          stroke={ROSE}
          strokeWidth={1.5}
          fill="url(#gradFraud)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: ROSE }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Biểu đồ 2: Phân bố Mức độ Rủi ro ──────────────────────────────────────
function Chart2_RiskDistribution({ data }: { data: ReturnType<typeof useFraudChartData>["riskBandData"] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={248}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="40%"
          cy="47%"
          outerRadius={88}
          innerRadius={54}
          paddingAngle={3}
          cornerRadius={4}
          stroke="none"
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
            cx?: number; cy?: number; midAngle?: number;
            innerRadius?: number; outerRadius?: number; percent?: number;
          }) => {
            if (percent == null || percent < 0.04) return null;
            if (midAngle == null || innerRadius == null || outerRadius == null) return null;
            const RADIAN = Math.PI / 180;
            const r = innerRadius + (outerRadius - innerRadius) * 0.5 + 22;
            const x = Number(cx) + r * Math.cos(-midAngle * RADIAN);
            const y = Number(cy) + r * Math.sin(-midAngle * RADIAN);
            return (
              <text x={x} y={y} fill="#EDEDEF" textAnchor="middle" dominantBaseline="central" fontSize={10} fontFamily="JetBrains Mono, monospace">
                {`${(percent * 100).toFixed(0)}%`}
              </text>
            );
          }}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        {/* Tâm biểu đồ: tổng số */}
        <text x="40%" y="44%" textAnchor="middle" dominantBaseline="middle" fill="#EDEDEF" fontSize={18} fontWeight={600} fontFamily="Inter, sans-serif">
          {total.toLocaleString("vi-VN")}
        </text>
        <text x="40%" y="56%" textAnchor="middle" dominantBaseline="middle" fill="#8A8F98" fontSize={10} fontFamily="JetBrains Mono, monospace">
          GD
        </text>
        <Tooltip content={<GlassTooltip />} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          iconSize={8}
          formatter={(value, entry) => {
            const e = entry as { payload?: { value: number; color: string } };
            return (
              <span style={{ fontSize: 11, color: "#8A8F98", fontFamily: "Inter, sans-serif" }}>
                {value}
                {e.payload?.value !== undefined && (
                  <span style={{ color: "#EDEDEF", marginLeft: 4, fontWeight: 600 }}>
                    {e.payload.value.toLocaleString("vi-VN")}
                  </span>
                )}
              </span>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Biểu đồ 3: Phân loại Cảnh báo (Horizontal Bar) ─────────────────────────
function Chart3_FraudTypes({ data }: { data: ReturnType<typeof useFraudChartData>["fraudTypeData"] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[248px] text-[#8A8F98] text-xs font-mono">
        Không có dữ liệu
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={248}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", fill: "#8A8F98" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fontSize: 10, fontFamily: "Inter, sans-serif", fill: "#8A8F98" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<GlassTooltip />} />
        <Bar dataKey="count" name="Số cảnh báo" radius={[0, 4, 4, 0]} barSize={16}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Biểu đồ 4: Nguồn Giao dịch (Grouped Bar: total vs fraud) ───────────────
function Chart4_TxTypeSource({ data }: { data: ReturnType<typeof useFraudChartData>["txTypeData"] }) {
  return (
    <ResponsiveContainer width="100%" height={248}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="type"
          tick={{ fontSize: 11, fontFamily: "Inter, sans-serif", fill: "#8A8F98" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", fill: "#8A8F98" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<GlassTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: "12px" }}
          formatter={(v) => <span style={{ fontSize: 10, color: "#8A8F98", fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", letterSpacing: "0.12em" }}>{v}</span>}
        />
        <Bar dataKey="total" name="Tổng GD" fill={ACCENT} radius={[4, 4, 0, 0]} barSize={28} fillOpacity={0.7} />
        <Bar dataKey="fraud" name="Gian lận" fill={ROSE}  radius={[4, 4, 0, 0]} barSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
import { useSharedLiveTransactions } from "@/features/transactions/components/LiveTransactionsProvider";

export const FraudCharts = memo(function FraudCharts() {
  const { liveTransactions } = useSharedLiveTransactions();
  const { hourlyData, riskBandData, fraudTypeData, txTypeData } =
    useFraudChartData(liveTransactions);

  return (
    <section aria-label="Trực quan hóa dữ liệu gian lận">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* ─── Hàng 1 ─── */}
        <ChartCard
          title="Tần suất Giao dịch Gian lận Theo Thời gian"
          subtitle="Theo giờ trong ngày · Tổng GD vs Gian lận"
        >
          <Chart1_HourlyTrend data={hourlyData} />
        </ChartCard>

        <ChartCard
          title="Phân bố Mức độ Rủi ro"
          subtitle="Theo fraud_probability · Tất cả giao dịch"
        >
          <Chart2_RiskDistribution data={riskBandData} />
        </ChartCard>

        {/* ─── Hàng 2 ─── */}
        <ChartCard
          title="Phân loại Cảnh báo"
          subtitle="Theo loại hình gian lận phát hiện · Top 6"
        >
          <Chart3_FraudTypes data={fraudTypeData} />
        </ChartCard>

        <ChartCard
          title="Nguồn Giao dịch"
          subtitle="Thanh toán · Chuyển tiền · Rút tiền"
        >
          <Chart4_TxTypeSource data={txTypeData} />
        </ChartCard>
      </div>
    </section>
  );
});
