# 🔧 Universal Variants System - Implementation Code Templates

Ready-to-use code snippets for implementing the universal variants system.

---

## Backend: TypeScript/Node.js + MongoDB

### 1. Types Definition (`src/types/variants.ts`)

```typescript
export interface VariantAttributeValue {
  label: string;
  value: string;
  hexCode?: string; // For colors
  displayImage?: string;
}

export interface VariantAttribute {
  name: string;
  type: 'swatch' | 'button' | 'dropdown' | 'text';
  values: VariantAttributeValue[];
  isRequired: boolean;
  displayOrder: number;
}

export interface VariantTemplate {
  _id?: string;
  categoryId: string;
  categoryName: string;
  variantAttributes: VariantAttribute[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductVariant {
  _id?: string;
  sku: string;
  attributeValues: Record<string, string>;
  images: string[];
  thumbnail?: string;
  video?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  moq: number;
  specifications: { key: string; value: string }[];
  isAvailable: boolean;
  createdAt?: Date;
}

export interface Product {
  _id?: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  hasVariants: boolean;
  variants: ProductVariant[];
  baseSpecifications: { key: string; value: string }[];
  createdAt?: Date;
  updatedAt?: Date;
}
```

### 2. Mongoose Models

```typescript
// models/VariantTemplate.ts
import mongoose from 'mongoose';

const variantTemplateSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  categoryName: {
    type: String,
    required: true,
  },
  variantAttributes: [
    {
      name: String,
      type: {
        type: String,
        enum: ['swatch', 'button', 'dropdown', 'text'],
      },
      values: [
        {
          label: String,
          value: String,
          hexCode: String,
          displayImage: String,
        },
      ],
      isRequired: Boolean,
      displayOrder: Number,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const VariantTemplate = mongoose.model(
  'VariantTemplate',
  variantTemplateSchema
);

// models/Product.ts (Modified)
const productSchema = new mongoose.Schema({
  name: String,
  category: mongoose.Schema.Types.ObjectId,
  description: String,
  basePrice: Number,
  hasVariants: { type: Boolean, default: false },
  variants: [
    {
      sku: String,
      attributeValues: mongoose.Schema.Types.Mixed,
      images: [String],
      thumbnail: String,
      video: String,
      price: Number,
      originalPrice: Number,
      stock: Number,
      moq: { type: Number, default: 1 },
      specifications: [{ key: String, value: String }],
      isAvailable: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  baseSpecifications: [{ key: String, value: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Product = mongoose.model('Product', productSchema);
```

### 3. API Routes

```typescript
// routes/variants.ts
import express from 'express';
import { VariantTemplate, Product } from '../models';

const router = express.Router();

// Get variant template for category
router.get('/template/:categoryId', async (req, res) => {
  try {
    const template = await VariantTemplate.findOne({
      categoryId: req.params.categoryId,
    });
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get product with variants
router.get('/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });

    const template = await VariantTemplate.findOne({
      categoryId: product.category,
    });

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        variantTemplate: template,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Find variant by attributes
router.post('/search', async (req, res) => {
  try {
    const { productId, attributes } = req.body;
    const product = await Product.findById(productId);

    const variant = product.variants.find((v) =>
      Object.entries(attributes).every(([key, value]) => v.attributeValues[key] === value)
    );

    if (!variant)
      return res
        .status(404)
        .json({ success: false, message: 'Variant not found' });

    res.json({ success: true, data: { variant } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create variants (Admin)
router.post('/:productId/create', async (req, res) => {
  try {
    const { variants } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      {
        hasVariants: true,
        variants: variants,
      },
      { new: true }
    );

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
```

---

## Frontend: React + TypeScript

### 1. Custom Hook (`hooks/useVariantSelector.ts`)

```typescript
import { useState, useCallback, useMemo } from 'react';
import { Product, ProductVariant } from '@/types/variants';

export function useVariantSelector(product: Product) {
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );

  const findVariantByAttributes = useCallback(
    (attributes: Record<string, string>) => {
      return product.variants.find((variant) =>
        Object.entries(attributes).every(
          ([key, value]) => variant.attributeValues[key] === value
        )
      );
    },
    [product.variants]
  );

  const handleAttributeSelect = useCallback(
    (attributeName: string, value: string) => {
      const newAttributes = { ...selectedAttributes, [attributeName]: value };
      setSelectedAttributes(newAttributes);

      const variant = findVariantByAttributes(newAttributes);
      if (variant) {
        setSelectedVariant(variant);
      }
    },
    [selectedAttributes, findVariantByAttributes]
  );

  const availableValues = useMemo(() => {
    const available: Record<string, Set<string>> = {};

    product.variants
      .filter((v) => v.isAvailable && v.stock > 0)
      .forEach((variant) => {
        Object.entries(variant.attributeValues).forEach(([key, value]) => {
          if (!available[key]) available[key] = new Set();
          available[key].add(value);
        });
      });

    return available;
  }, [product.variants]);

  return {
    selectedAttributes,
    selectedVariant,
    handleAttributeSelect,
    availableValues,
    findVariantByAttributes,
  };
}
```

### 2. Variant Selector Component

```typescript
// components/ProductVariants/UniversalVariantSelector.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useVariantSelector } from '@/hooks/useVariantSelector';
import { Product, VariantTemplate } from '@/types/variants';

interface Props {
  product: Product;
  variantTemplate: VariantTemplate;
  onVariantChange?: (variant: any) => void;
}

export default function UniversalVariantSelector({
  product,
  variantTemplate,
  onVariantChange,
}: Props) {
  const { selectedAttributes, selectedVariant, handleAttributeSelect, availableValues } =
    useVariantSelector(product);

  return (
    <div className="space-y-6">
      {/* Variant Attribute Selectors */}
      <div className="space-y-4">
        {variantTemplate.variantAttributes
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((attribute) => (
            <div key={attribute.name}>
              <label className="block text-sm font-semibold mb-2">
                {attribute.name}
                {attribute.isRequired && <span className="text-red-500">*</span>}
              </label>

              {attribute.type === 'swatch' ? (
                // Swatch Selector (Colors)
                <div className="flex flex-wrap gap-3">
                  {attribute.values.map((value) => (
                    <button
                      key={value.value}
                      onClick={() =>
                        handleAttributeSelect(attribute.name, value.value)
                      }
                      className={`w-12 h-12 rounded-lg border-2 transition ${
                        selectedAttributes[attribute.name] === value.value
                          ? 'border-blue-500 ring-2 ring-blue-300'
                          : 'border-gray-300'
                      } ${
                        availableValues[attribute.name]?.has(value.value)
                          ? 'cursor-pointer'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      style={
                        attribute.type === 'swatch' && value.hexCode
                          ? { backgroundColor: value.hexCode }
                          : {}
                      }
                      title={value.label}
                      disabled={
                        !availableValues[attribute.name]?.has(value.value)
                      }
                    />
                  ))}
                </div>
              ) : attribute.type === 'button' ? (
                // Button Selector (Sizes)
                <div className="flex flex-wrap gap-2">
                  {attribute.values.map((value) => (
                    <button
                      key={value.value}
                      onClick={() =>
                        handleAttributeSelect(attribute.name, value.value)
                      }
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition ${
                        selectedAttributes[attribute.name] === value.value
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-300 text-gray-700'
                      } ${
                        availableValues[attribute.name]?.has(value.value)
                          ? 'cursor-pointer'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      disabled={
                        !availableValues[attribute.name]?.has(value.value)
                      }
                    >
                      {value.label}
                    </button>
                  ))}
                </div>
              ) : (
                // Dropdown Selector
                <select
                  value={selectedAttributes[attribute.name] || ''}
                  onChange={(e) =>
                    handleAttributeSelect(attribute.name, e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select {attribute.name}</option>
                  {attribute.values.map((value) => (
                    <option
                      key={value.value}
                      value={value.value}
                      disabled={
                        !availableValues[attribute.name]?.has(value.value)
                      }
                    >
                      {value.label}
                      {!availableValues[attribute.name]?.has(value.value) &&
                        ' (Unavailable)'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
      </div>

      {/* Variant Details */}
      {selectedVariant && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Price</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{selectedVariant.price}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Stock</p>
              <p className="text-2xl font-bold text-green-600">
                {selectedVariant.stock} units
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">MOQ</p>
              <p className="text-lg font-semibold">{selectedVariant.moq}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">SKU</p>
              <p className="text-lg font-semibold">{selectedVariant.sku}</p>
            </div>
          </div>

          {/* Variant Specifications */}
          {selectedVariant.specifications.length > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-100">
              <p className="text-sm font-semibold mb-2">Specifications</p>
              <div className="space-y-1 text-sm">
                {selectedVariant.specifications.map((spec, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-gray-600">{spec.key}</span>
                    <span className="font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Images */}
      {selectedVariant && (
        <div className="space-y-3">
          <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden">
            <Image
              src={selectedVariant.images[0] || '/placeholder.jpg'}
              alt={`${product.name} - ${Object.values(
                selectedVariant.attributeValues
              ).join(', ')}`}
              width={500}
              height={500}
              className="w-full h-full object-cover"
            />
          </div>
          {selectedVariant.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {selectedVariant.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`View ${idx + 1}`}
                  className="w-20 h-20 rounded-lg object-cover cursor-pointer border-2 border-gray-200 hover:border-blue-500"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Admin Panel Component

### Variant Management Page

```typescript
// app/admin/products/[id]/variants/page.tsx
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Product, VariantTemplate } from '@/types/variants';

export default function VariantManagementPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [template, setTemplate] = useState<VariantTemplate | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, templateRes] = await Promise.all([
          api.get(`/products/${params.id}`),
          api.get(`/variants/template/${product?.category}`),
        ]);

        setProduct(productRes.data.data);
        setTemplate(templateRes.data.data);
        setVariants(productRes.data.data.variants || []);
      } catch (error) {
        console.error('Failed to fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, product?.category]);

  const handleCreateVariants = async (newVariants: any[]) => {
    try {
      await api.post(`/variants/${params.id}/create`, { variants: newVariants });
      alert('Variants created successfully!');
      setVariants(newVariants);
    } catch (error) {
      console.error('Failed to create variants:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{product?.name}</h1>

      {/* Variant Template Info */}
      {template && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Variant Template</h2>
          <div className="space-y-2">
            {template.variantAttributes.map((attr) => (
              <div key={attr.name}>
                <span className="font-medium">{attr.name}</span>
                <p className="text-sm text-gray-600">
                  {attr.values.length} options
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variants Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Attributes</th>
              <th className="text-left p-2">SKU</th>
              <th className="text-left p-2">Price</th>
              <th className="text-left p-2">Stock</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant._id} className="border-b">
                <td className="p-2">
                  {Object.entries(variant.attributeValues).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      {key}: {value}
                    </div>
                  ))}
                </td>
                <td className="p-2">{variant.sku}</td>
                <td className="p-2">₹{variant.price}</td>
                <td className="p-2">{variant.stock}</td>
                <td className="p-2">
                  <button className="text-blue-600 hover:underline">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## Database Indexing

```javascript
// Create these indexes for optimal performance
db.products.createIndex({ category: 1 });
db.products.createIndex({ "variants.attributeValues": 1 });
db.products.createIndex({ "variants.sku": 1 });
db.products.createIndex({ "variants.stock": 1, category: 1 });
db.varianttemplates.createIndex({ categoryId: 1 });
```

---

## Testing Example

```typescript
// __tests__/variants.test.ts
import { useVariantSelector } from '@/hooks/useVariantSelector';
import { Product } from '@/types/variants';

describe('Variant Selector', () => {
  const mockProduct: Product = {
    _id: '123',
    name: 'T-Shirt',
    category: 'clothing',
    description: 'Test',
    basePrice: 500,
    hasVariants: true,
    variants: [
      {
        sku: 'TSH-BLK-S',
        attributeValues: { Color: 'black', Size: 's' },
        images: ['img1'],
        price: 499,
        stock: 50,
        moq: 1,
        specifications: [],
        isAvailable: true,
      },
    ],
    baseSpecifications: [],
  };

  it('should find variant by attributes', () => {
    const { findVariantByAttributes } = useVariantSelector(mockProduct);
    const variant = findVariantByAttributes({ Color: 'black', Size: 's' });
    expect(variant?.sku).toBe('TSH-BLK-S');
  });

  it('should handle attribute selection', () => {
    const { handleAttributeSelect, selectedVariant } =
      useVariantSelector(mockProduct);
    handleAttributeSelect('Color', 'black');
    handleAttributeSelect('Size', 's');
    expect(selectedVariant?.sku).toBe('TSH-BLK-S');
  });
});
```

---

## Deployment Checklist

```
□ Database migrations applied
□ Indexes created
□ API endpoints tested
□ Frontend components compiled
□ Admin panel functional
□ Image CDN configured
□ Caching layers enabled
□ Error handling added
□ Documentation complete
□ Mobile tested
□ Performance benchmarks met
```

---

**Ready to implement? Follow the steps in order and test each phase before moving to the next!** 🚀
