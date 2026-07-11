'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';

interface QuotaMetric {
  used: number;
  limit: number | string;
  percentage: number;
  isUnlimited: boolean;
  status: 'ok' | 'warning' | 'critical';
}

interface QuotaStatus {
  subscription?: {
    name: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
  };
  quotas: {
    products: QuotaMetric;
    inquiriesPerDay: QuotaMetric;
    featuredListings: QuotaMetric;
  };
  features: {
    prioritySupport: boolean;
    analytics: boolean;
  };
}

const QUOTA_CFG = [
  { key: 'products',        label: 'Products',          icon: '📦', desc: 'Active product listings' },
  { key: 'inquiriesPerDay', label: 'Daily Inquiries',   icon: '💬', desc: 'Buyer inquiries per day'  },
  { key: 'featuredListings',label: 'Featured Listings', icon: '⭐', desc: 'Promoted product slots'   },
] as const;

const BAR_COLOR: Record<string, string> = {
  ok:       'bg-gradient-to-r from-green-400 to-emerald-500',
  warning:  'bg-gradient-to-r from-yellow-400 to-orange-400',
  critical: 'bg-gradient-to-r from-red-500 to-rose-500',
};

const BADGE_CFG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  ok:       { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Good'     },
  warning:  { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Low'      },
  critical: { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Critical' },
};

function QuotaRow({ label, desc, icon, metric }: {
  label: string; desc: string; icon: string; metric: QuotaMetric;
}) {
  const pct   = metric.isUnlimited ? 100 : Math.min(metric.percentage, 100);
  const status = metric.isUnlimited ? 'ok' : metric.status;
  const badge  = BADGE_CFG[status];
  const bar    = BAR_COLOR[status];

  return (
    <div className="group p-4 rounded-2xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{icon}</span>
          <div>
            <p className="text-sm font-bold text-gray-800">{label}</p>
            <p className="text-[11px] text-gray-400">{desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {metric.isUnlimited ? (
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-bold border border-green-100">∞ Unlimited</span>
          ) : (
            <>
              <span className="text-sm font-black text-gray-900">
                {metric.used}
                <span className="text-gray-400 font-normal text-xs"> / {metric.limit}</span>
              </span>
              <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${badge.bg} ${badge.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Warning messages */}
      {!metric.isUnlimited && metric.percentage > 95 && (
        <p className="mt-2 text-[11px] text-red-600 font-semibold flex items-center gap-1">
          🚨 Nearly at limit — upgrade to avoid interruption
        </p>
      )}
      {!metric.isUnlimited && metric.percentage > 80 && metric.percentage <= 95 && (
        <p className="mt-2 text-[11px] text-orange-600 font-medium flex items-center gap-1">
          ⚠️ Running low — consider upgrading your plan
        </p>
      )}
    </div>
  );
}

export default function PlanUsageMeter() {
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sellers/me/quota-status')
      .then(res => { if (res.data.success && res.data.data) setQuotaStatus(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="h-5 bg-gray-100 rounded animate-pulse w-40" />
        {[1,2,3].map(i => (
          <div key={i} className="p-4 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-28" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-16" />
            </div>
            <div className="h-2 bg-gray-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!quotaStatus) return null;

  const { subscription, quotas, features } = quotaStatus;
  const anyFeature = features.prioritySupport || features.analytics;

  // Overall health
  const statuses = [quotas.products.status, quotas.inquiriesPerDay.status, quotas.featuredListings.status];
  const overallBad = statuses.includes('critical');
  const overallWarn = !overallBad && statuses.includes('warning');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-4 flex items-center justify-between border-b border-gray-100 ${overallBad ? 'bg-red-50' : overallWarn ? 'bg-yellow-50' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
        <div>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <span className="text-xl">📊</span>
            Plan Quota Status
          </h2>
          {subscription ? (
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="font-bold text-[#0052cc]">{subscription.name}</span>
              {' · '}
              <span className={subscription.daysRemaining <= 7 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                {subscription.daysRemaining}d remaining
              </span>
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">Free Plan</p>
          )}
        </div>
        {subscription && (
          <div className="text-right">
            <p className="text-[10px] text-gray-400">Expires</p>
            <p className="text-xs font-bold text-gray-700">
              {new Date(subscription.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>

      {/* Quota rows */}
      <div className="p-4 space-y-2">
        {QUOTA_CFG.map(cfg => (
          <QuotaRow
            key={cfg.key}
            label={cfg.label}
            desc={cfg.desc}
            icon={cfg.icon}
            metric={quotas[cfg.key]}
          />
        ))}
      </div>

      {/* Features */}
      {anyFeature && (
        <div className="px-5 pb-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Plan Features</p>
          <div className="flex flex-wrap gap-2">
            {features.prioritySupport && (
              <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-100">
                ⚡ Priority Support
              </span>
            )}
            {features.analytics && (
              <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                📈 Analytics
              </span>
            )}
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      <div className="px-4 pb-4">
        <Link href="/seller/plans">
          <button className="w-full bg-gradient-to-r from-[#0052cc] to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm">
            🚀 Upgrade Plan
            <span className="text-blue-200 font-normal text-xs">Get more limits</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
