'use client';

import React, { useState, useMemo } from 'react';
import { getPurchaseModes, supportsBothModes } from '@/config/purchaseModes';
import WholesaleSection from './WholesaleSection';
import CustomizationSection from './CustomizationSection';
import { motion, AnimatePresence } from 'framer-motion';

interface DynamicPurchaseSystemProps {
  // Product Data
  product: {
    _id: string;
    name: string;
    price: number;
    stock: number;
    moq?: number;
    bulkPrices?: Array<{ quantity: number; price: number }>;
    category?: {
      name: string;
      slug: string;
    };
    subCategory?: {
      name: string;
      slug: string;
    };
  };
  // Seller Data
  seller: {
    _id: string;
    name: string;
    companyName?: string;
  };
}

export const DynamicPurchaseSystem: React.FC<DynamicPurchaseSystemProps> = ({
  product,
  seller
}) => {
  const [activeTab, setActiveTab] = useState<'wholesale' | 'customization'>('wholesale');

  // Get available purchase modes based on category
  const purchaseModes = useMemo(() => {
    const categorySlug = product.category?.slug || product.subCategory?.slug || '';
    return getPurchaseModes(categorySlug);
  }, [product.category?.slug, product.subCategory?.slug]);

  const hasCustomization = purchaseModes.includes('customization');
  const categorySlug = product.category?.slug || product.subCategory?.slug || '';

  // Validate active tab
  const validTab = purchaseModes.includes(activeTab) ? activeTab : 'wholesale';

  if (purchaseModes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation - Only show if both modes are available */}
      {hasCustomization && (
        <div className="flex gap-2 border-b border-gray-200">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('wholesale')}
            className={`px-6 py-3 font-semibold text-sm transition-all duration-300 relative ${
              validTab === 'wholesale'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              🏭 Wholesale
            </span>
            {validTab === 'wholesale' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-blue-400"
                transition={{ type: 'spring', bounce: 0.2 }}
              />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('customization')}
            className={`px-6 py-3 font-semibold text-sm transition-all duration-300 relative ${
              validTab === 'customization'
                ? 'text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              🎨 Customization
            </span>
            {validTab === 'customization' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-400"
                transition={{ type: 'spring', bounce: 0.2 }}
              />
            )}
          </motion.button>
        </div>
      )}

      {/* Tab Content with Animation */}
      <AnimatePresence mode="wait">
        {validTab === 'wholesale' && (
          <motion.div
            key="wholesale"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <WholesaleSection
              moq={product.moq || 100}
              price={product.price}
              bulkPrices={product.bulkPrices}
              productId={product._id}
              productName={product.name}
              sellerId={seller._id}
              stock={product.stock}
            />
          </motion.div>
        )}

        {validTab === 'customization' && hasCustomization && (
          <motion.div
            key="customization"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <CustomizationSection
              productId={product._id}
              productName={product.name}
              sellerId={seller._id}
              categorySlug={categorySlug}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Info Badge */}
      <div className="text-xs text-gray-500 text-center pt-2">
        <span className="inline-block bg-gray-100 px-3 py-1 rounded-full">
          📦 {hasCustomization ? 'Wholesale & Customization' : 'Wholesale'} Available
        </span>
      </div>
    </div>
  );
};

export default DynamicPurchaseSystem;
