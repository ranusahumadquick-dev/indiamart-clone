'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';
import { HiOutlineExclamationTriangle, HiOutlineCheckCircle, HiOutlineClock } from "@/lib/icons";

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalCategories: number;
  totalInquiries: number;
  pendingApprovals: number;
  newThisMonth: number;
  revenue: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'product' | 'inquiry';
  title: string;
  user: string;
  timestamp: string;
}

interface PendingActions {
  products: number;
  verifications: number;
  bannedUsers: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalCategories: 0,
    totalInquiries: 0,
    pendingApprovals: 0,
    newThisMonth: 0,
    revenue: 0,
  });
  const [pendingActions, setPendingActions] = useState<PendingActions>({
    products: 0,
    verifications: 0,
    bannedUsers: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchAnalytics();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/admin/dashboard');
      if (res.data?.success) {
        setStats(res.data.data.stats);
        setRecentActivity(res.data.data.recentActivity || []);
      }
    } catch (err: any) {
      toast.error('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const res = await axios.get(`/admin/dashboard/analytics?period=${period}`);
      if (res.data?.success) {
        setPendingActions(res.data.data.pendingActions);
      }
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your platform overview.</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as '7d' | '30d' | '90d')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Last {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Actions Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pendingActions.products > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 items-start">
            <HiOutlineClock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-yellow-900">{pendingActions.products} Products Pending</p>
              <p className="text-sm text-yellow-800">Awaiting approval</p>
            </div>
          </div>
        )}
        {pendingActions.verifications > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 items-start">
            <HiOutlineExclamationTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-blue-900">{pendingActions.verifications} Seller Verifications</p>
              <p className="text-sm text-blue-800">Pending review</p>
            </div>
          </div>
        )}
        {pendingActions.bannedUsers > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 items-start">
            <HiOutlineCheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-red-900">{pendingActions.bannedUsers} Banned Users</p>
              <p className="text-sm text-red-800">Currently inactive</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Total Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
          <p className="text-sm text-green-600 mt-2">+{stats.newThisMonth} this month</p>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Total Products</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
          <p className="text-sm text-yellow-600 mt-2">{stats.pendingApprovals} pending</p>
        </div>

        {/* Total Inquiries */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalInquiries}</p>
          <p className="text-sm text-blue-600 mt-2">Active marketplace</p>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.revenue)}</p>
          <p className="text-sm text-green-600 mt-2">All transactions</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Categories */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Categories</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCategories}</p>
          <p className="text-sm text-gray-500 mt-2">All product categories</p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingApprovals}</p>
          <p className="text-sm text-gray-500 mt-2">Awaiting action</p>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Average per Category</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.totalCategories > 0 ? Math.round(stats.totalProducts / stats.totalCategories) : 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">Products per category</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition">
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    activity.type === 'user'
                      ? 'bg-blue-600'
                      : activity.type === 'product'
                      ? 'bg-green-600'
                      : 'bg-purple-600'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500 mt-1">By: {activity.user}</p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent activity to display
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
