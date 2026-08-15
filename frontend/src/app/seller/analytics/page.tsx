'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  HiOutlineEnvelope,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineArrowTrendingUp,
  HiOutlineShoppingBag,
  HiOutlineInformationCircle,
  HiOutlineArrowPath,
} from "@/lib/icons";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AllTime {
  totalInquiries: number;
  totalQuotes: number;
  totalOrders: number;
  totalRevenue: number;
  avgResponseTime: number;
  responseRate: number;
  conversionRate: number;
  productCount: number;
  hasData: boolean;
}

interface Period {
  inquiries: number;
  responded: number;
  quotes: number;
  orders: number;
  revenue: number;
  hasPeriodData: boolean;
}

interface DailyPoint {
  date: string;
  label: string;
  inquiriesReceived: number;
  inquiriesResponded: number;
  quotationsSent: number;
  orders: number;
  revenue: number;
}

interface DashboardData {
  allTime: AllTime;
  period: Period;
  daily: DailyPoint[];
  periodDays: number;
  periodStart: string;
  periodEnd: string;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  periodValue,
  periodLabel,
  sub,
  icon,
  iconBg,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  periodValue?: React.ReactNode;
  periodLabel?: string;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-gray-900 tabular-nums leading-none">{value}</p>
      )}
      {periodValue != null && (
        <div className="flex items-center gap-1.5">
          <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
            {periodValue} {periodLabel}
          </span>
        </div>
      )}
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── Empty chart placeholder ──────────────────────────────────────────────────

function EmptyChart({ hint }: { hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-52 text-center px-6">
      <HiOutlineChartBar className="w-10 h-10 text-gray-200 mb-3" />
      <p className="text-sm text-gray-400 leading-relaxed">{hint}</p>
    </div>
  );
}

// ─── Subsample series for readability on long ranges ─────────────────────────

function subsample(data: DailyPoint[], maxPoints = 30): DailyPoint[] {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0 || i === data.length - 1);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DAY_OPTIONS = [7, 14, 30, 60, 90];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (selectedDays: number, isRefresh = false) => {
      try {
        isRefresh ? setRefreshing(true) : setLoading(true);
        setError(null);
        console.log('[Analytics] Fetching dashboard, days =', selectedDays);

        // axios interceptor handles Bearer token automatically
        const res = await api.get('/analytics/seller/dashboard', {
          params: { days: selectedDays },
        });

        const payload: DashboardData = res.data.data;
        console.log('[Analytics] allTime:', payload.allTime);
        console.log('[Analytics] period:', payload.period);
        setData(payload);
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Failed to load analytics';
        console.error('[Analytics] Error:', err?.response?.data || err.message);
        setError(msg);
        if (!isRefresh) toast.error(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData(days);
  }, [days, fetchData]);

  const chartData = subsample(data?.daily ?? [], 30);
  const hasChartData = (data?.daily ?? []).some(
    (d) => d.inquiriesReceived > 0 || d.quotationsSent > 0 || d.orders > 0
  );
  const hasRevenueData = (data?.daily ?? []).some((d) => d.revenue > 0 || d.orders > 0);

  const { allTime, period } = data ?? ({} as Partial<DashboardData>);

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
              <p className="text-gray-500 text-sm mt-1">
                All-time totals with activity breakdown for selected period
              </p>
            </div>
            <button
              onClick={() => fetchData(days, true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 shadow-sm"
            >
              <HiOutlineArrowPath className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* ── Period selector ──────────────────────────────────────────── */}
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-600">Period for charts:</span>
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  days === d
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Last {d} days
              </button>
            ))}
          </div>

          {/* ── Error state ──────────────────────────────────────────────── */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <HiOutlineInformationCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">{error}</p>
              </div>
              <button
                onClick={() => fetchData(days)}
                className="text-sm text-red-700 underline font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* ── No-data banner (only when genuinely no activity ever) ────── */}
          {!loading && !error && allTime && !allTime.hasData && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-3">
              <HiOutlineInformationCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">No analytics available yet</p>
                <p className="text-sm text-blue-700 mt-1 leading-relaxed">
                  Data will appear automatically as your business receives activity — when buyers
                  send inquiries, you reply with quotations, and orders are placed.
                  {allTime.productCount > 0 && (
                    <span>
                      {' '}You have <strong>{allTime.productCount}</strong> active product
                      {allTime.productCount !== 1 ? 's' : ''} listed — share them with buyers to
                      start receiving inquiries.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* ── No-period-data banner (has all-time data but not in range) ─ */}
          {!loading && !error && allTime?.hasData && !period?.hasPeriodData && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <HiOutlineInformationCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                No activity in the last <strong>{days} days</strong>. Charts below are empty for
                this period — try selecting a longer range.
              </p>
            </div>
          )}

          {/* ── KPI Cards — all-time totals ──────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard
              label="Inquiries Received"
              value={(allTime?.totalInquiries ?? 0).toLocaleString()}
              periodValue={period?.inquiries}
              periodLabel={`in ${days}d`}
              sub={`${allTime?.responseRate ?? 0}% all-time response rate`}
              icon={<HiOutlineEnvelope className="w-5 h-5 text-green-600" />}
              iconBg="bg-green-100"
              loading={loading}
            />
            <KpiCard
              label="Quotations Sent"
              value={(allTime?.totalQuotes ?? 0).toLocaleString()}
              periodValue={period?.quotes}
              periodLabel={`in ${days}d`}
              sub={`${allTime?.conversionRate ?? 0}% inquiry→order rate`}
              icon={<HiOutlineChartBar className="w-5 h-5 text-orange-600" />}
              iconBg="bg-orange-100"
              loading={loading}
            />
            <KpiCard
              label="Orders"
              value={(allTime?.totalOrders ?? 0).toLocaleString()}
              periodValue={period?.orders}
              periodLabel={`in ${days}d`}
              sub="All-time completed orders"
              icon={<HiOutlineShoppingBag className="w-5 h-5 text-blue-600" />}
              iconBg="bg-blue-100"
              loading={loading}
            />
            <KpiCard
              label="Revenue"
              value={`₹${(allTime?.totalRevenue ?? 0).toLocaleString('en-IN')}`}
              periodValue={period?.revenue != null ? `₹${period.revenue.toLocaleString('en-IN')}` : undefined}
              periodLabel={`in ${days}d`}
              sub="From paid orders (all time)"
              icon={<HiOutlineArrowTrendingUp className="w-5 h-5 text-purple-600" />}
              iconBg="bg-purple-100"
              loading={loading}
            />
          </div>

          {/* ── Charts ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            {/* Inquiries Trend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">Inquiries Trend</h3>
                <span className="text-xs text-gray-400">Last {days} days</span>
              </div>
              {loading ? (
                <div className="h-52 bg-gray-50 rounded-lg animate-pulse" />
              ) : hasChartData ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      labelStyle={{ fontWeight: 600, color: '#111827' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="inquiriesReceived"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      name="Inquiries"
                    />
                    <Line
                      type="monotone"
                      dataKey="quotationsSent"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      name="Quotations"
                    />
                    <Line
                      type="monotone"
                      dataKey="inquiriesResponded"
                      stroke="#3b82f6"
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      dot={false}
                      name="Responded"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart hint="No inquiries in this period. Extend the date range or share your products with buyers." />
              )}
            </div>

            {/* Orders & Revenue */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">Orders & Revenue</h3>
                <span className="text-xs text-gray-400">Last {days} days</span>
              </div>
              {loading ? (
                <div className="h-52 bg-gray-50 rounded-lg animate-pulse" />
              ) : hasRevenueData ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      labelStyle={{ fontWeight: 600, color: '#111827' }}
                      formatter={(val: number, name: string) =>
                        name === 'Revenue (₹)' ? [`₹${val.toLocaleString('en-IN')}`, name] : [val, name]
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="orders" fill="#3b82f6" name="Orders" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue (₹)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart hint="No orders in this period. Revenue will appear here once buyers place orders." />
              )}
            </div>
          </div>

          {/* ── Performance Metrics ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <HiOutlineClock className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Avg Response Time</span>
              </div>
              {loading ? (
                <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-gray-900">
                  {allTime?.avgResponseTime ?? 0}
                  <span className="text-base font-normal text-gray-500 ml-1">min</span>
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {allTime?.totalInquiries
                  ? 'From inquiry received to your reply'
                  : 'No replies sent yet'}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                  <HiOutlineArrowTrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Conversion Rate</span>
              </div>
              {loading ? (
                <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-gray-900">
                  {allTime?.conversionRate ?? 0}
                  <span className="text-base font-normal text-gray-500">%</span>
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">Inquiries that became orders</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                  <HiOutlineCheckCircle className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Response Rate</span>
              </div>
              {loading ? (
                <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-gray-900">
                  {allTime?.responseRate ?? 0}
                  <span className="text-base font-normal text-gray-500">%</span>
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {allTime?.totalInquiries
                  ? `${allTime.totalInquiries} total inquiries received`
                  : 'No inquiries yet'}
              </p>
            </div>
          </div>

          {/* ── Info note ────────────────────────────────────────────────── */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
            <HiOutlineInformationCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-500 leading-relaxed">
              <strong className="text-gray-700">How analytics work:</strong> KPI cards show
              all-time totals so you always see your true business numbers. The period selector
              (Last 7/14/30… days) controls the chart date range. Data updates automatically when
              buyers send inquiries, sellers reply, or orders are placed — no manual action needed.
            </p>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
