'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  HiOutlineBolt,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineClipboardDocumentList,
  HiOutlineUserGroup,
  HiOutlineArrowRight,
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
} from 'react-icons/hi2';

interface BuyRequirement {
  _id: string;
  productName: string;
  quantityRequired: number;
  unit: string;
  description?: string;
  budgetMin?: number;
  budgetMax?: number;
  deliveryTimeline?: string;
  deliveryLocation?: { city?: string; state?: string };
  category?: { name: string };
  buyer: { _id: string; name: string; companyName?: string };
  responses?: { _id: string }[];
  createdAt: string;
  isPriority?: boolean;
  priorityExpiresAt?: string;
}

function isPriorityActive(req: BuyRequirement): boolean {
  return !!req.isPriority && !!req.priorityExpiresAt && new Date(req.priorityExpiresAt) > new Date();
}

function RequirementCard({ item, featured = false }: { item: BuyRequirement; featured?: boolean }) {
  const responseCount = item.responses?.length ?? 0;
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div
      className={`relative bg-white rounded-xl overflow-hidden transition-all hover:shadow-md ${
        featured
          ? 'border-2 border-orange-300 shadow-orange-100 shadow-md'
          : 'border border-gray-100 shadow-sm'
      }`}
    >
      {/* Priority ribbon */}
      {featured && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-400" />
      )}

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            {featured && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2 py-0.5 rounded-full mb-1.5">
                <HiOutlineBolt className="w-2.5 h-2.5" /> PRIORITY
              </span>
            )}
            <h3 className={`font-semibold leading-snug ${featured ? 'text-gray-900' : 'text-gray-800'}`}>
              {item.productName}
            </h3>
            {item.category && (
              <p className="text-xs text-gray-400 mt-0.5">{item.category.name}</p>
            )}
          </div>
          <Link
            href={`/buy-requirements/${item._id}`}
            className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
              featured
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]'
            }`}
          >
            Respond <HiOutlineArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.description}</p>
        )}

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
            <HiOutlineClipboardDocumentList className="w-3.5 h-3.5" />
            {item.quantityRequired} {item.unit}
          </span>
          {(item.budgetMin || item.budgetMax) && (
            <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
              <HiOutlineCurrencyRupee className="w-3.5 h-3.5" />
              {item.budgetMin ? `₹${item.budgetMin.toLocaleString('en-IN')}` : ''}
              {item.budgetMin && item.budgetMax ? '–' : ''}
              {item.budgetMax ? `₹${item.budgetMax.toLocaleString('en-IN')}` : ''}
            </span>
          )}
          {item.deliveryLocation?.city && (
            <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
              <HiOutlineMapPin className="w-3.5 h-3.5" />
              {item.deliveryLocation.city}
              {item.deliveryLocation.state ? `, ${item.deliveryLocation.state}` : ''}
            </span>
          )}
          {item.deliveryTimeline && (
            <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
              <HiOutlineClock className="w-3.5 h-3.5" />
              {item.deliveryTimeline}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <div className="text-xs text-gray-400">
            By <span className="text-gray-600 font-medium">{item.buyer?.companyName || item.buyer?.name}</span>
            <span className="mx-1.5">·</span>
            {timeAgo(item.createdAt)}
          </div>
          {responseCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <HiOutlineUserGroup className="w-3.5 h-3.5" />
              {responseCount} response{responseCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BuyRequirementsList() {
  const [items, setItems] = useState<BuyRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/buy-requirements');
        if (res.data?.success) setItems(res.data.data.buyRequirements || []);
      } catch {
        toast.error('Failed to load requirements');
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, []);

  const filtered = items.filter((it) =>
    search
      ? it.productName.toLowerCase().includes(search.toLowerCase()) ||
        it.description?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const priorityItems = filtered.filter(isPriorityActive);
  const regularItems = filtered.filter((it) => !isPriorityActive(it));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Buy Requirements</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {items.length} active requirements from verified buyers
              </p>
            </div>
            <Link
              href="/buy-requirements/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--primary-dark)] transition"
            >
              Post Requirement
            </Link>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name or description..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--primary)] bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 bg-white rounded-xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <HiOutlineClipboardDocumentList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-500">No requirements found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search or post your own requirement</p>
          </div>
        ) : (
          <>
            {/* Priority featured section */}
            {priorityItems.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    <HiOutlineBolt className="w-3.5 h-3.5" />
                    PRIORITY REQUIREMENTS
                  </div>
                  <p className="text-sm text-gray-500">Featured by buyers — respond first!</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {priorityItems.map((item) => (
                    <RequirementCard key={item._id} item={item} featured />
                  ))}
                </div>
              </div>
            )}

            {/* Regular section */}
            {regularItems.length > 0 && (
              <div>
                {priorityItems.length > 0 && (
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-semibold text-gray-600">All Requirements</span>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">{regularItems.length} total</span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {regularItems.map((item) => (
                    <RequirementCard key={item._id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
