"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import api from "@/lib/axios";

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
  subcategories?: SubCategory[];
}

// Fallback category images (Unsplash free-to-use)
const CATEGORY_IMAGES: Record<string, string> = {
  default: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80",
  electronics: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80",
  machinery: "https://images.unsplash.com/photo-1565793979498-a23b69f1e65f?w=400&q=80",
  textile: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
  pharma: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
  construction: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
  automobile: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80",
  chemical: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&q=80",
  furniture: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
  sports: "https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee?w=400&q=80",
  agriculture: "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=400&q=80",
  medical: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80",
};

// Sub-category fallback images for the 6 grid cards
const SUB_IMAGES = [
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&q=70",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&q=70",
  "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200&q=70",
  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=200&q=70",
  "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?w=200&q=70",
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&q=70",
];

function getCategoryImage(cat: Category): string {
  if (cat.image) return cat.image;
  const slug = cat.slug?.toLowerCase() || "";
  for (const key of Object.keys(CATEGORY_IMAGES)) {
    if (slug.includes(key)) return CATEGORY_IMAGES[key];
  }
  return CATEGORY_IMAGES.default;
}

function getSubImage(sub: SubCategory, index: number): string {
  if (sub.image) return sub.image;
  return SUB_IMAGES[index % SUB_IMAGES.length];
}

// Single category block — IndiaMART style
function CategoryBlock({ cat }: { cat: Category }) {
  const subs = cat.subcategories || [];
  const leftSubs = subs.slice(6); // extra ones shown in left panel
  const gridSubs = subs.slice(0, 6); // 6 cards in 2×3 grid

  return (
    <div className="border-t border-gray-200 pt-6 pb-2">
      {/* Category title */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">{cat.name}</h2>

      <div className="flex gap-3">
        {/* LEFT — Banner panel */}
        <div className="w-52 shrink-0 rounded-lg overflow-hidden relative min-h-[200px] hidden sm:block">
          <img
            src={getCategoryImage(cat)}
            alt={cat.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = CATEGORY_IMAGES.default; }}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Sub names on left panel */}
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <ul className="space-y-0.5 mb-3">
              {leftSubs.slice(0, 5).map((s) => (
                <li key={s._id}>
                  <Link
                    href={`/products?category=${s.slug}`}
                    className="text-xs text-white/90 hover:text-white hover:underline leading-tight block truncate"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href={`/products?category=${cat.slug}`}
              className="inline-block bg-white text-gray-800 text-xs font-bold px-4 py-1.5 rounded hover:bg-gray-100 transition"
            >
              View All
            </Link>
          </div>
        </div>

        {/* RIGHT — 2×3 Subcategory grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {gridSubs.map((sub, i) => (
            <Link
              key={sub._id}
              href={`/products?category=${sub.slug}`}
              className="border border-gray-200 rounded-lg p-2.5 hover:border-[#0052cc] hover:shadow-sm transition group flex gap-2 items-start"
            >
              {/* Sub image */}
              <div className="w-14 h-14 shrink-0 rounded overflow-hidden bg-gray-100">
                <img
                  src={getSubImage(sub, i)}
                  alt={sub.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => { (e.target as HTMLImageElement).src = SUB_IMAGES[i % SUB_IMAGES.length]; }}
                />
              </div>
              {/* Sub name */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#0052cc] group-hover:underline truncate leading-tight">
                  {sub.name}
                </p>
              </div>
            </Link>
          ))}

          {/* If fewer than 6 subs, fill with a "View All" card */}
          {gridSubs.length < 6 && (
            <Link
              href={`/products?category=${cat.slug}`}
              className="border border-dashed border-gray-300 rounded-lg p-2.5 hover:border-[#0052cc] transition flex items-center justify-center text-xs text-[#0052cc] font-semibold"
            >
              View All →
            </Link>
          )}
        </div>
      </div>

      {/* Mobile View All link */}
      <div className="sm:hidden mt-3">
        <Link
          href={`/products?category=${cat.slug}`}
          className="text-xs text-[#0052cc] font-semibold hover:underline"
        >
          View All {cat.name} →
        </Link>
      </div>
    </div>
  );
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/categories?limit=50").then((res) => {
      const all: Category[] = res.data?.data?.categories || res.data?.data || [];
      // Only parent categories (no parentCategory)
      const parents = all.filter((c: any) => !c.parentCategory);
      setCategories(parents.slice(0, 8)); // show max 8 category blocks
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-t border-gray-200 pt-6">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
              <div className="flex gap-3">
                <div className="w-52 h-48 bg-gray-200 rounded-lg animate-pulse hidden sm:block" />
                <div className="flex-1 grid grid-cols-3 gap-2">
                  {[1,2,3,4,5,6].map((j) => (
                    <div key={j} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-6 bg-white">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {categories.map((cat) => (
          <CategoryBlock key={cat._id} cat={cat} />
        ))}

        {/* Bottom CTA */}
        <div className="border-t border-gray-200 pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            Explore <strong>50M+</strong> products across <strong>100+</strong> categories from verified suppliers
          </p>
          <Link
            href="/categories"
            className="bg-[#0052cc] text-white text-sm font-bold px-6 py-2.5 rounded hover:bg-[#003d99] transition"
          >
            View All Categories →
          </Link>
        </div>
      </div>
    </section>
  );
}
