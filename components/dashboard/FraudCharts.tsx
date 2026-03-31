"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Deep Space Palette ───────────────────────────────────────
const COLORS = [
  "#5E6AD2", // Signature Accent (Indigo)
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#e11d48", // Rose Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
];

interface FraudByType {
  name: string;
  count: number;
}

interface FraudByTxType {
  type: string;
  total: number;
  fraud: number;
}

interface FraudChartsProps {
  fraudByType: FraudByType[];
  fraudByTxType: FraudByTxType[];
}

// Custom tooltip glassmorphism
const GlassTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-background-elevated/80 backdrop-blur-md px-4 py-3 rounded-lg border border-border-default shadow-cinematic text-sm font-500 pointer-events-none">
        {label && <p className="font-600 text-foreground mb-2">{label}</p>}
        {payload.map((p: any, i: number) => (
          <p key={i} className="flex items-center gap-2 text-foreground-muted">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill ?? p.color }} />
            <span>{p.name}:</span>
            <span className="font-600 text-foreground">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function FraudCharts({ fraudByType, fraudByTxType }: FraudChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ─ Biểu đồ cột: Phân bổ ─ */}
      <div className="bg-gradient-to-b from-white/[0.04] to-transparent rounded-2xl p-6 border border-border-default shadow-cinematic relative overflow-hidden group">
        <div className="absolute inset-0 rounded-2xl pointer-events-none shadow-inner-glow" />
        
        <h3 className="text-sm font-500 text-foreground-muted tracking-tight mb-8">
          Phân loại Cảnh báo
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={fraudByType} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fontFamily: "var(--font-sans)", fill: "#8A8F98" }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: "#8A8F98" }}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="count" name="Số lượng" radius={[4, 4, 4, 4]} barSize={24}>
              {fraudByType.map((_, index) => (
                <Cell 
                  key={index} 
                  fill={COLORS[index % COLORS.length]} 
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer" 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ─ Biểu đồ tròn: Tỉ lệ ─ */}
      <div className="bg-gradient-to-b from-white/[0.04] to-transparent rounded-2xl p-6 border border-border-default shadow-cinematic relative overflow-hidden group">
        <div className="absolute inset-0 rounded-2xl pointer-events-none shadow-inner-glow" />
        <div className="absolute right-0 top-0 w-64 h-64 bg-accent-glow blur-[80px] rounded-full pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
        
        <h3 className="text-sm font-500 text-foreground-muted tracking-tight mb-8 relative z-10">
          Nguồn Giao dịch
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={fraudByTxType}
              dataKey="fraud"
              nameKey="type"
              cx="50%"
              cy="45%"
              outerRadius={90}
              innerRadius={60}
              paddingAngle={4}
              cornerRadius={4}
              stroke="none"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                const RADIAN = Math.PI / 180;
                const r = innerRadius + (outerRadius - innerRadius) * 0.5 + 24;
                const x = Number(cx) + r * Math.cos(-midAngle * RADIAN);
                const y = Number(cy) + r * Math.sin(-midAngle * RADIAN);
                return (
                  <text
                    x={x}
                    y={y}
                    fill="#EDEDEF"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={11}
                    fontFamily="var(--font-mono)"
                    fontWeight={500}
                  >
                     {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {fraudByTxType.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<GlassTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-[11px] font-500 text-foreground-muted ml-1 font-mono tracking-widest uppercase">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
