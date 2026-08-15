'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import axios from '@/lib/axios';
import {
  HiOutlineEllipsisVertical,
  HiOutlineEye,
  HiOutlineShieldCheck,
  HiOutlineXCircle,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineLockClosed,
} from '@/lib/icons';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  companyName?: string;
  phone?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  gstRegDate?: string;
  gstAge?: number;
  gstVerified?: boolean;
  annualTurnover?: string;
  sellerStatus?: string;
  sellerStatusNote?: string;
  sellerDocs?: { itr?: string; caCertificate?: string; bankStatement?: string; uploadedAt?: string };
  isVerified: boolean;
  isActive: boolean;
  accountFrozen?: boolean;
  verificationRequested?: boolean;
  verificationRequestedAt?: string;
  verificationNote?: string;
  createdAt: string;
  lastLogin?: string;
}

interface UserStats {
  total: number;
  buyers: number;
  sellers: number;
  active: number;
  verified: number;
  pendingVerification?: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const PAGE_SIZE = 10;

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    buyers: 0,
    sellers: 0,
    active: 0,
    verified: 0
  });
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: PAGE_SIZE, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'buyers' | 'sellers' | 'active' | 'verified' | 'pending_verification'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [sellerActing, setSellerActing] = useState(false);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Debounce search input before hitting the server
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset to page 1 whenever the filter or search changes
  useEffect(() => { setPage(1); }, [filter, debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [filter, debouncedSearch, page]);

  // Close the row action menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ filter, page: String(page), limit: String(PAGE_SIZE) });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await axios.get(`/admin/users?${params.toString()}`);
      if (res.data?.success) {
        setUsers(res.data.data.users);
        setStats(res.data.data.stats);
        if (res.data.data.pagination) setPagination(res.data.data.pagination);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const action = currentStatus ? 'deactivate' : 'activate';
      const res = await axios.patch(`/admin/users/${userId}/status`, { isActive: !currentStatus });
      if (res.data?.success) {
        setUsers(prev => prev.map(user =>
          user._id === userId ? { ...user, isActive: !currentStatus } : user
        ));
        toast.success(`User ${action}d successfully`);
      }
    } catch (err: any) {
      console.error('Error updating user status:', err);
      toast.error('Failed to update user status');
    }
  };

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const action = currentStatus ? 'unverify' : 'verify';
      const res = await axios.patch(`/admin/users/${userId}/verify`, { isVerified: !currentStatus });
      if (res.data?.success) {
        setUsers(prev => prev.map(user =>
          user._id === userId ? { ...user, isVerified: !currentStatus } : user
        ));
        toast.success(`User ${action}d successfully`);
      }
    } catch (err: any) {
      console.error('Error verifying user:', err);
      toast.error('Failed to verify user');
    }
  };

  const toggleFreeze = async (userId: string, currentlyFrozen: boolean) => {
    try {
      const reason = !currentlyFrozen ? window.prompt('Reason for freezing this seller (optional):') ?? '' : '';
      const res = await axios.patch(`/admin/users/${userId}/freeze`, { frozen: !currentlyFrozen, reason });
      if (res.data?.success) {
        setUsers(prev => prev.map(user =>
          user._id === userId ? { ...user, accountFrozen: !currentlyFrozen } : user
        ));
        toast.success(`Seller ${!currentlyFrozen ? 'frozen' : 'unfrozen'} successfully`);
      }
    } catch (err: any) {
      console.error('Error freezing seller:', err);
      toast.error(err.response?.data?.message || 'Failed to update freeze status');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await axios.delete(`/admin/users/${userId}`);
      if (res.data?.success) {
        setUsers(prev => prev.filter(user => user._id !== userId));
        toast.success('User deleted successfully');
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete user');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
    setRejectReason('');
    setShowRejectBox(false);
  };

  const approveSeller = async () => {
    if (!selectedUser) return;
    setSellerActing(true);
    try {
      await axios.patch(`/seller-verify/admin/${selectedUser._id}/approve`);
      toast.success(`✅ ${selectedUser.companyName || selectedUser.name} approved!`);
      setSelectedUser(prev => prev ? { ...prev, sellerStatus: 'approved', gstVerified: true } : null);
      fetchUsers();
    } catch (err: any) { toast.error(err?.message || 'Failed to approve'); }
    finally { setSellerActing(false); }
  };

  const rejectSeller = async () => {
    if (!selectedUser) return;
    if (!rejectReason.trim()) { toast.error('Enter rejection reason'); return; }
    setSellerActing(true);
    try {
      await axios.patch(`/seller-verify/admin/${selectedUser._id}/reject`, { reason: rejectReason });
      toast.success(`${selectedUser.companyName || selectedUser.name} rejected`);
      setSelectedUser(prev => prev ? { ...prev, sellerStatus: 'rejected' } : null);
      setRejectReason('');
      fetchUsers();
    } catch (err: any) { toast.error(err?.message || 'Failed to reject'); }
    finally { setSellerActing(false); }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'seller': return 'bg-blue-100 text-blue-800';
      case 'buyer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getVerificationColor = (isVerified: boolean) => {
    return isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">Manage platform buyers and sellers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">👥</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Buyers</p>
              <p className="text-2xl font-bold text-green-600">{stats.buyers}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">🛒</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sellers</p>
              <p className="text-2xl font-bold text-blue-600">{stats.sellers}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">🏪</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Users', count: null },
              { value: 'buyers', label: 'Buyers', count: null },
              { value: 'sellers', label: 'Sellers', count: null },
              { value: 'active', label: 'Active', count: null },
              { value: 'verified', label: 'Verified', count: null },
              { value: 'pending_verification', label: '🔔 Verify Requests', count: stats.pendingVerification ?? 0 },
            ].map(({ value, label, count }) => (
              <button
                key={value}
                onClick={() => setFilter(value as any)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                  filter === value
                    ? value === 'pending_verification' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                    : value === 'pending_verification' && (count ?? 0) > 0
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 font-semibold'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
                {value === 'pending_verification' && (count ?? 0) > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${filter === value ? 'bg-white/30 text-white' : 'bg-amber-500 text-white'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 font-medium text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.companyName && (
                            <div className="text-sm text-gray-500">{user.companyName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full w-fit ${getStatusColor(user.isActive)}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {user.accountFrozen && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full w-fit bg-sky-100 text-sky-700 border border-sky-300">
                            🥶 Frozen
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full w-fit ${getVerificationColor(user.isVerified)}`}>
                          {user.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                        {!user.isVerified && user.verificationRequested && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full w-fit bg-amber-100 text-amber-700 border border-amber-300">
                            🔔 Requested
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <div className="relative inline-block text-left" ref={openMenuId === user._id ? menuRef : undefined}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === user._id ? null : user._id)}
                          className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-colors"
                          aria-label="Row actions"
                        >
                          <HiOutlineEllipsisVertical className="w-4 h-4" />
                        </button>

                        {openMenuId === user._id && (
                          <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-20 overflow-hidden">
                            <button
                              onClick={() => { openEditModal(user); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <HiOutlineEye className="w-4 h-4 text-gray-400" />
                              View Details
                            </button>
                            <button
                              onClick={() => { toggleVerification(user._id, user.isVerified); setOpenMenuId(null); }}
                              title={user.verificationNote ? `Note: ${user.verificationNote}` : undefined}
                              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors ${
                                user.isVerified ? 'text-amber-600' : user.verificationRequested ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                            >
                              <HiOutlineShieldCheck className="w-4 h-4" />
                              {user.isVerified ? 'Unverify' : user.verificationRequested ? 'Approve Verification' : 'Verify'}
                            </button>
                            <button
                              onClick={() => { toggleUserStatus(user._id, user.isActive); setOpenMenuId(null); }}
                              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors ${
                                user.isActive ? 'text-orange-600' : 'text-emerald-600'
                              }`}
                            >
                              {user.isActive
                                ? <HiOutlineXCircle className="w-4 h-4" />
                                : <HiOutlineCheckCircle className="w-4 h-4" />}
                              {user.isActive ? 'Ban User' : 'Unban User'}
                            </button>
                            {user.role === 'seller' && (
                              <button
                                onClick={() => { toggleFreeze(user._id, !!user.accountFrozen); setOpenMenuId(null); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors ${
                                  user.accountFrozen ? 'text-sky-600' : 'text-gray-600'
                                }`}
                              >
                                <HiOutlineLockClosed className="w-4 h-4" />
                                {user.accountFrozen ? 'Unfreeze Publishing' : 'Freeze Publishing'}
                              </button>
                            )}
                            <div className="my-1 border-t border-gray-100" />
                            <button
                              onClick={() => { deleteUser(user._id); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                              Delete User
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-800">{rangeStart}-{rangeEnd}</span> of{' '}
              <span className="font-semibold text-gray-800">{pagination.total}</span> users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <HiOutlineChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 px-2">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page >= pagination.pages}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#f0f2f5] rounded-2xl w-full max-w-4xl shadow-2xl my-4 overflow-hidden">

            {/* Top bar */}
            <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200">
              <button onClick={() => setShowEditModal(false)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0052cc] font-semibold transition">
                ← Back to User List
              </button>
              <button onClick={() => setShowEditModal(false)} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-lg transition">×</button>
            </div>

            <div className="overflow-y-auto max-h-[80vh] p-6">

              {/* Page Title */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h1 className="text-2xl font-black text-gray-900">{selectedUser.companyName || selectedUser.name}</h1>
                  <p className="text-sm text-gray-400 mt-1">Seller ID: {selectedUser._id}</p>
                </div>
                <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold mt-1 ${
                  selectedUser.sellerStatus === 'approved' ? 'bg-green-50 border-green-300 text-green-700' :
                  selectedUser.sellerStatus === 'rejected' ? 'bg-red-50 border-red-300 text-red-700' :
                  selectedUser.sellerStatus === 'under_review' ? 'bg-yellow-50 border-yellow-300 text-yellow-700' :
                  'bg-gray-100 border-gray-300 text-gray-600'}`}>
                  <span className={`w-2 h-2 rounded-full ${
                    selectedUser.sellerStatus === 'approved' ? 'bg-green-500' :
                    selectedUser.sellerStatus === 'rejected' ? 'bg-red-500' :
                    selectedUser.sellerStatus === 'under_review' ? 'bg-yellow-400' : 'bg-gray-400'}`} />
                  {selectedUser.sellerStatus === 'approved' ? 'Approved' :
                   selectedUser.sellerStatus === 'rejected' ? 'Rejected' :
                   selectedUser.sellerStatus === 'under_review' ? 'Under Review' : 'Pending'}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* LEFT col */}
                <div className="lg:col-span-2 space-y-4">

                  {/* Contact Details */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                      <span className="text-[#0052cc]">👤</span>
                      <h2 className="font-black text-gray-700 text-xs uppercase tracking-widest">Contact Details</h2>
                    </div>
                    <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-4">
                      {[
                        { label: 'Owner / Contact Name', value: selectedUser.name },
                        { label: 'Company Name', value: selectedUser.companyName },
                        { label: 'Phone Number', value: selectedUser.phone },
                        { label: 'Email Address', value: selectedUser.email },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5 break-all">{value || <span className="text-gray-400 font-normal italic">Not provided</span>}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Business Location */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                      <span className="text-[#0052cc]">📍</span>
                      <h2 className="font-black text-gray-700 text-xs uppercase tracking-widest">Business Location</h2>
                    </div>
                    <div className="px-5 py-4 grid grid-cols-3 gap-x-8 gap-y-4">
                      {[
                        { label: 'City',    value: selectedUser.city },
                        { label: 'State',   value: selectedUser.state },
                        { label: 'Pincode', value: selectedUser.pincode },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">{value || <span className="text-gray-400 font-normal italic">Not provided</span>}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GST & Verification */}
                  {selectedUser.role === 'seller' && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                        <span className="text-[#0052cc]">🛡️</span>
                        <h2 className="font-black text-gray-700 text-xs uppercase tracking-widest">GST & Verification</h2>
                      </div>
                      <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">GST Number</p>
                          <p className="text-sm font-mono font-bold text-gray-800 mt-0.5">{selectedUser.gstNumber || <span className="text-gray-400 font-normal font-sans italic">Not provided</span>}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">GST Status</p>
                          <p className={`text-sm font-bold mt-0.5 ${selectedUser.gstVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                            {selectedUser.gstVerified ? '✅ Verified' : '⏳ Pending Verification'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">GST Registration Date</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">
                            {selectedUser.gstRegDate
                              ? new Date(selectedUser.gstRegDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                              : <span className="text-gray-400 font-normal italic">Not provided</span>}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">GST Age</p>
                          <p className={`text-sm font-bold mt-0.5 ${(selectedUser.gstAge || 0) >= 2 ? 'text-green-600' : selectedUser.gstAge != null ? 'text-red-600' : 'text-gray-400'}`}>
                            {selectedUser.gstAge != null
                              ? `${selectedUser.gstAge} year${selectedUser.gstAge !== 1 ? 's' : ''} ${selectedUser.gstAge >= 2 ? '✅' : '❌'}`
                              : <span className="font-normal italic">Not verified yet</span>}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Annual Turnover (Self-Declared)</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">{selectedUser.annualTurnover || <span className="text-gray-400 font-normal italic">Not provided</span>}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Registered On</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">
                            {new Date(selectedUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Uploaded Documents */}
                  {selectedUser.role === 'seller' && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-2">
                          <span className="text-[#0052cc]">📄</span>
                          <h2 className="font-black text-gray-700 text-xs uppercase tracking-widest">Uploaded Documents</h2>
                        </div>
                        {![selectedUser.sellerDocs?.itr, selectedUser.sellerDocs?.caCertificate, selectedUser.sellerDocs?.bankStatement].some(u => u && u.trim()) && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full font-semibold">⚠️ No documents uploaded</span>
                        )}
                      </div>
                      <div className="p-5 space-y-2.5">
                        {[
                          { label: 'ITR Certificate', url: selectedUser.sellerDocs?.itr,           color: 'border-blue-200 bg-blue-50 text-blue-700' },
                          { label: 'CA Certificate',  url: selectedUser.sellerDocs?.caCertificate, color: 'border-purple-200 bg-purple-50 text-purple-700' },
                          { label: 'Bank Statement',  url: selectedUser.sellerDocs?.bankStatement,  color: 'border-teal-200 bg-teal-50 text-teal-700' },
                        ].map(({ label, url, color }) =>
                          url && url.trim() ? (
                            <a key={label} href={url} target="_blank" rel="noreferrer"
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${color} text-sm font-semibold hover:opacity-80 transition`}>
                              📄 {label}
                              <span className="ml-auto text-xs font-bold underline">View →</span>
                            </a>
                          ) : (
                            <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-200 text-gray-400 text-sm">
                              📄 {label}
                              <span className="ml-auto text-xs bg-gray-100 px-2 py-0.5 rounded-full">Not uploaded</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* RIGHT col */}
                <div className="space-y-4">

                  {/* Current Status */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Current Status</p>
                    <div className={`flex items-center gap-2 font-black text-lg ${
                      selectedUser.sellerStatus === 'approved' ? 'text-green-600' :
                      selectedUser.sellerStatus === 'rejected' ? 'text-red-600' :
                      selectedUser.sellerStatus === 'under_review' ? 'text-yellow-600' : 'text-gray-600'}`}>
                      <span className={`w-3 h-3 rounded-full ${
                        selectedUser.sellerStatus === 'approved' ? 'bg-green-500' :
                        selectedUser.sellerStatus === 'rejected' ? 'bg-red-500' :
                        selectedUser.sellerStatus === 'under_review' ? 'bg-yellow-400' : 'bg-gray-400'}`} />
                      {selectedUser.sellerStatus === 'approved' ? 'Approved' :
                       selectedUser.sellerStatus === 'rejected' ? 'Rejected' :
                       selectedUser.sellerStatus === 'under_review' ? 'Under Review' : 'Pending'}
                    </div>
                    {selectedUser.sellerStatusNote && (
                      <p className="text-xs text-gray-500 mt-3 bg-gray-50 rounded-xl p-3">{selectedUser.sellerStatusNote}</p>
                    )}
                  </div>

                  {/* Quick Info */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Quick Info</p>
                    <div className="space-y-2.5 text-sm text-gray-700">
                      <div className="flex items-center gap-2">📞 {selectedUser.phone || '—'}</div>
                      <div className="flex items-center gap-2 break-all">✉️ {selectedUser.email}</div>
                      <div className="flex items-center gap-2">📍 {[selectedUser.city, selectedUser.state].filter(Boolean).join(', ') || '—'}</div>
                      {selectedUser.gstNumber && <div className="flex items-center gap-2">🛡️ <span className="font-mono text-xs">{selectedUser.gstNumber}</span></div>}
                    </div>
                  </div>

                  {/* Action */}
                  {selectedUser.role === 'seller' && selectedUser.sellerStatus !== 'approved' && selectedUser.sellerStatus !== 'rejected' && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Admin Action</p>
                      {!showRejectBox ? (
                        <div className="space-y-2">
                          <button onClick={approveSeller} disabled={sellerActing}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition">
                            {sellerActing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '✅'}
                            Approve Seller
                          </button>
                          <button onClick={() => setShowRejectBox(true)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm transition">
                            ❌ Reject Seller
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-gray-600">Rejection Reason:</p>
                          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g. GST too new, documents unclear..."
                            rows={3} autoFocus
                            className="w-full border-2 border-red-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400 resize-none" />
                          <button onClick={rejectSeller} disabled={sellerActing}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition">
                            {sellerActing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                            Confirm Reject
                          </button>
                          <button onClick={() => { setShowRejectBox(false); setRejectReason(''); }}
                            className="w-full border-2 border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {(selectedUser.sellerStatus === 'approved' || selectedUser.sellerStatus === 'rejected') && (
                    <div className={`rounded-2xl border p-4 text-sm font-bold ${selectedUser.sellerStatus === 'approved' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                      {selectedUser.sellerStatus === 'approved' ? '✅ Seller Approved' : '❌ Seller Rejected'}
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
