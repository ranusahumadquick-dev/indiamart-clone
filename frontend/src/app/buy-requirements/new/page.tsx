'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { StateDropdown, CityDropdown } from "@/components/common/LocationDropdown";
import { useAuth } from '@/contexts/AuthContext';

export default function NewBuyRequirementPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    productName: '',
    categoryId: '',
    subCategoryId: '',
    description: '',
    quantityRequired: 1,
    unit: 'Piece',
    budgetMin: '',
    budgetMax: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryPincode: '',
  });

  if (!loading && !isAuthenticated) {
    router.push('/auth/login?redirect=/buy-requirements/new');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName || !form.categoryId || !form.quantityRequired) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        productName: form.productName,
        categoryId: form.categoryId,
        subCategoryId: form.subCategoryId,
        description: form.description,
        quantityRequired: Number(form.quantityRequired),
        unit: form.unit,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        deliveryLocation: {
          city: form.deliveryCity,
          state: form.deliveryState,
          pincode: form.deliveryPincode,
        },
      };

      const res = await axios.post('/buy-requirements', payload);
      if (res.data?.success) {
        toast.success('Buy requirement posted');
        router.push('/buy-requirements');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post requirement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Post Buy Requirement</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Name *</label>
            <input name="productName" value={form.productName} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity *</label>
              <input type="number" name="quantityRequired" value={form.quantityRequired} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <select name="unit" value={form.unit} onChange={handleChange} className="w-full mt-1 p-2 border rounded">
                <option>Piece</option>
                <option>Kg</option>
                <option>Meter</option>
                <option>Liter</option>
                <option>Box</option>
                <option>Packet</option>
                <option>Ton</option>
                <option>Set</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="w-full mt-1 p-2 border rounded" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Budget Min</label>
              <input type="number" name="budgetMin" value={form.budgetMin} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Budget Max</label>
              <input type="number" name="budgetMax" value={form.budgetMax} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <StateDropdown label="State" value={form.deliveryState} onChange={(v) => setForm({ ...form, deliveryState: v, deliveryCity: "" })} />
            <CityDropdown label="City" value={form.deliveryCity} onChange={(v) => setForm({ ...form, deliveryCity: v })} state={form.deliveryState} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input name="deliveryPincode" value={form.deliveryPincode} onChange={handleChange} placeholder="Pincode" className="mt-1 p-2 border rounded w-full" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded">{submitting ? 'Posting...' : 'Post Requirement'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
