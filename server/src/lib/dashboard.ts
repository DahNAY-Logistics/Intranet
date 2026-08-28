import { dashboardRanges } from 'core/constants.ts';
import type { DashboardRange } from 'core/constants.ts';
import type { DashboardStatsResponse, MoodTrendPoint, MoodTrendResponse } from 'core/types/dashboard.ts';

import prisma from '../db.ts';

interface DashboardStatsRow {
  publishedAnnouncements: bigint;
  publishedEvents: bigint;
  totalQuickLinks: bigint;
  totalBanners: bigint;
  totalResources: bigint;
}

export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  const [row] = await prisma.$queryRaw<[DashboardStatsRow]>`SELECT * FROM get_dashboard_stats()`;

  return {
    publishedAnnouncements: Number(row.publishedAnnouncements),
    publishedEvents: Number(row.publishedEvents),
    totalQuickLinks: Number(row.totalQuickLinks),
    totalBanners: Number(row.totalBanners),
    totalResources: Number(row.totalResources),
  };
}

interface MoodTrendRow {
  date: Date;
  label: string;
  axisLabel: string;
  isTick: boolean;
  VeryHappy: bigint;
  Happy: bigint;
  Neutral: bigint;
  Sad: bigint;
  VerySad: bigint;
}

const moodTrendRanges = {
  [dashboardRanges.weekly]: { days: 7, maxTicks: 7 },
  [dashboardRanges.monthly]: { days: 30, maxTicks: 6 },
} as const;

export async function getMoodTrend(range: DashboardRange): Promise<MoodTrendResponse> {
  const { days, maxTicks } = moodTrendRanges[range];
  const rows = await prisma.$queryRaw<MoodTrendRow[]>`SELECT * FROM get_mood_trend(${days}, ${maxTicks})`;

  const data: MoodTrendPoint[] = rows.map((row) => ({
    date: row.date.toISOString().slice(0, 10),
    label: row.label,
    axisLabel: row.axisLabel,
    isTick: row.isTick,
    VeryHappy: Number(row.VeryHappy),
    Happy: Number(row.Happy),
    Neutral: Number(row.Neutral),
    Sad: Number(row.Sad),
    VerySad: Number(row.VerySad),
  }));

  return { range, data };
}
