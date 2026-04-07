/**
 * Hook: useFraudChartData
 *
 * Tổng hợp mảng Transaction thô thành 4 cấu trúc dữ liệu sẵn sàng cho Recharts.
 * Toàn bộ tính toán được bọc trong useMemo để tránh re-compute khi component cha re-render.
 *
 * Nguồn dữ liệu: Transaction[] (đến từ Redis SSE hoặc snapshot tĩnh)
 * Output:
 *   - hourlyData:     Biểu đồ 1 – Tần suất Giao dịch Gian lận Theo Thời gian
 *   - riskBandData:   Biểu đồ 2 – Phân bố Mức độ Rủi ro
 *   - fraudTypeData:  Biểu đồ 3 – Phân loại Cảnh báo (theo fraud_type)
 *   - txTypeData:     Biểu đồ 4 – Nguồn Giao dịch (PAYMENT / TRANSFER / CASH_OUT)
 *
 * Edge cases:
 *   - Giao dịch không có fraud_probability → phân loại dựa trên is_fraud (0 → Low, 1 → High)
 *   - Giao dịch không có hour → trích xuất từ timestamp
 *   - fraud_type null → bỏ qua khi tính Biểu đồ 3
 */
import { useMemo } from "react";
import type { Transaction } from "@/lib/validators/fraud";

// ─── Output Types ─────────────────────────────────────────────────────────────

/** Biểu đồ 1: mỗi điểm là 1 giờ (0–23), track tổng GD và GD gian lận */
export interface HourlyPoint {
  hour: string;      // vd: "00:00", "13:00"
  total: number;
  fraud: number;
}

/** Biểu đồ 2: phân bố mức độ rủi ro theo fraud_probability */
export interface RiskBandPoint {
  name: string;       // "An toàn", "Thấp", "Trung bình", "Cao", "Nghiêm trọng"
  value: number;
  color: string;
}

/** Biểu đồ 3: top fraud_type + số lượng */
export interface FraudTypePoint {
  name: string;
  count: number;
}

/** Biểu đồ 4: % giao dịch bị fraud theo loại hình (PAYMENT/TRANSFER/CASH_OUT) */
export interface TxTypePoint {
  type: string;       // nhãn tiếng Việt
  total: number;
  fraud: number;
}

export interface FraudChartData {
  hourlyData: HourlyPoint[];
  riskBandData: RiskBandPoint[];
  fraudTypeData: FraudTypePoint[];
  txTypeData: TxTypePoint[];
}

// ─── Risk Band Config ─────────────────────────────────────────────────────────
const RISK_BANDS: Array<{
  name: string;
  color: string;
  check: (p: number | undefined, isFraud: 0 | 1) => boolean;
}> = [
  {
    name: "An toàn",
    color: "#10b981",
    check: (p, f) => f === 0 && (p === undefined || p < 0.3),
  },
  {
    name: "Thấp",
    color: "#06B6D4",
    check: (p, f) => f === 0 && p !== undefined && p >= 0.3 && p < 0.5,
  },
  {
    name: "Trung bình",
    color: "#F59E0B",
    check: (p) => p !== undefined && p >= 0.5 && p < 0.7,
  },
  {
    name: "Cao",
    color: "#F97316",
    check: (p) => p !== undefined && p >= 0.7 && p < 0.9,
  },
  {
    name: "Nghiêm trọng",
    color: "#e11d48",
    check: (p, f) => f === 1 && (p === undefined || p >= 0.9),
  },
];

// ─── Tx Type Label Map ────────────────────────────────────────────────────────
const TX_TYPE_LABELS: Record<string, string> = {
  PAYMENT: "Thanh toán",
  TRANSFER: "Chuyển tiền",
  CASH_OUT: "Rút tiền",
};

// ─── Main Hook ────────────────────────────────────────────────────────────────
export function useFraudChartData(transactions: Transaction[]): FraudChartData {
  return useMemo(() => {
    // ── Biểu đồ 1: Tần suất Giao dịch Gian lận Theo Thời gian ─────────────
    // Nhóm theo giờ (0–23), đếm tổng GD và GD gian lận
    const hourMap = new Map<number, { total: number; fraud: number }>();
    for (let h = 0; h < 24; h++) {
      hourMap.set(h, { total: 0, fraud: 0 });
    }

    for (const tx of transactions) {
      // Lấy hour từ field có sẵn, hoặc trích xuất từ timestamp
      const rawHour =
        tx.hour !== undefined
          ? tx.hour
          : new Date(tx.timestamp).getHours();
      const safeHour = Number.isFinite(rawHour) ? Math.max(0, Math.min(23, rawHour)) : 0;
      const slot = hourMap.get(safeHour)!;
      slot.total += 1;
      if (tx.is_fraud === 1) slot.fraud += 1;
    }

    const hourlyData: HourlyPoint[] = Array.from(hourMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([h, counts]) => ({
        hour: `${String(h).padStart(2, "0")}:00`,
        ...counts,
      }));

    // ── Biểu đồ 2: Phân bố Mức độ Rủi ro ─────────────────────────────────
    const bandCounts: number[] = new Array(RISK_BANDS.length).fill(0);
    for (const tx of transactions) {
      const prob = tx.fraud_probability;
      const idx = RISK_BANDS.findIndex((b) => b.check(prob, tx.is_fraud));
      if (idx >= 0) bandCounts[idx] += 1;
    }

    const riskBandData: RiskBandPoint[] = RISK_BANDS
      .map((band, i) => ({ name: band.name, value: bandCounts[i], color: band.color }))
      .filter((d) => d.value > 0); // ẩn nhãn 0 để biểu đồ gọn

    // ── Biểu đồ 3: Phân loại Cảnh báo (fraud_type) ─────────────────────────
    const typeCountMap: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.is_fraud === 1 && tx.fraud_type) {
        typeCountMap[tx.fraud_type] = (typeCountMap[tx.fraud_type] ?? 0) + 1;
      }
    }

    const fraudTypeData: FraudTypePoint[] = Object.entries(typeCountMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // giới hạn hiển thị top 6

    // ── Biểu đồ 4: Nguồn Giao dịch (PAYMENT/TRANSFER/CASH_OUT) ─────────────
    const txTypeMap: Record<string, { total: number; fraud: number }> = {};
    for (const tx of transactions) {
      if (!txTypeMap[tx.type]) txTypeMap[tx.type] = { total: 0, fraud: 0 };
      txTypeMap[tx.type].total += 1;
      if (tx.is_fraud === 1) txTypeMap[tx.type].fraud += 1;
    }

    const txTypeData: TxTypePoint[] = Object.entries(txTypeMap).map(
      ([type, counts]) => ({
        type: TX_TYPE_LABELS[type] ?? type,
        total: counts.total,
        fraud: counts.fraud,
      }),
    );

    return { hourlyData, riskBandData, fraudTypeData, txTypeData };
  }, [transactions]);
}
