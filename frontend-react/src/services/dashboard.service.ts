import { apiClient } from "./client";
import { DashboardStats } from "../types";

/**
 * GET /statistics
 * Fetch live clinical analysis statistics and distribution.
 */
export async function fetchAnalytics(): Promise<DashboardStats> {
  try {
    const response = await apiClient.get('/statistics', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("kv_token") || ""}`
      }
    });
    if (response.status === 200 && response.data.success) {
      const stats = response.data.data;
      const distribution = Object.entries(stats.condition_distribution || {}).map(([key, value]) => {
        const k = key.toLowerCase();
        let name = 'Normal Renal Parenchyma';
        let color = '#0d9488';
        if (k === 'stone') {
          name = 'Kidney Stone';
          color = '#ef4444';
        } else if (k === 'cyst') {
          name = 'Renal Cyst';
          color = '#0284c7';
        } else if (k === 'tumor') {
          name = 'Renal Tumor';
          color = '#9333ea';
        } else if (k === 'review') {
          name = 'Under Review';
          color = '#f59e0b';
        }
        return {
          name,
          value: value as number,
          color
        };
      });

      const monthlyScans = (stats.scans_by_month || []).map((item: any) => ({
        month: item.month || item.short_month || item.month_key || "Month",
        total: Number(item.total) || 0,
        anomalies: Number(item.anomalies) || 0,
        normals: Number(item.normals) || 0,
      }));

      const total = stats.total_analyses || 0;
      const stones = stats.stone_count ?? (stats.condition_distribution?.['Stone'] || 0);
      const cysts = stats.cyst_count ?? (stats.condition_distribution?.['Cyst'] || 0);
      const tumors = stats.tumor_count ?? (stats.condition_distribution?.['Tumor'] || 0);
      const normals = stats.normal_count ?? (stats.condition_distribution?.['Normal'] || 0);
      const anomalies = stones + cysts + tumors;
      const anomalyPercent = total > 0 ? Math.round((anomalies / total) * 100) : 0;
      const avgConfidence = stats.average_confidence ? Math.round(Number(stats.average_confidence) * 10) / 10 : 0;

      return {
        totalScans: total,
        normalCount: normals,
        stoneCount: stones,
        cystCount: cysts,
        tumorCount: tumors,
        anomalyRate: anomalyPercent,
        pendingReviews: (stats.pending || 0) + (stats.review || 0),
        accuracyRate: avgConfidence,
        currentMonthCount: stats.current_month_count || 0,
        lastMonthCount: stats.last_month_count || 0,
        monthGrowthPercentage: stats.month_growth_percentage ?? null,
        scansByMonth: monthlyScans,
        conditionDistribution: distribution,
        cystDistribution: distribution,
      };
    }
  } catch (e) {
    console.warn("[API Error] Fetch statistics failed", e);
  }

  // Fallback empty structure
  return {
    totalScans: 0,
    normalCount: 0,
    stoneCount: 0,
    anomalyRate: 0,
    pendingReviews: 0,
    accuracyRate: 0,
    currentMonthCount: 0,
    lastMonthCount: 0,
    monthGrowthPercentage: null,
    scansByMonth: [],
    conditionDistribution: [],
    cystDistribution: []
  };
}

export const getStatistics = fetchAnalytics;

