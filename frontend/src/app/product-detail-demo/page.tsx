"use client";

import ProductDetailPage from "@/components/ProductDetail/ProductDetailPage";
import { useState } from "react";

export default function ProductDetailDemoPage() {
  const sampleProducts = [
    {
      id: "prod_001",
      name: "Premium Stainless Steel Industrial Water Bottle - 2L Capacity",
      category: "Kitchen & Dining",
      subcategory: "Water Bottles",
      price: 1499,
      originalPrice: 2499,
      rating: 4.8,
      reviews: 2547,
      stock: 156,
      moq: 10,
      images: [
        "https://images.unsplash.com/photo-1602527336146-ff266650deab?w=800&h=800&fit=crop",
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
        "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&h=800&fit=crop",
      ],
      thumbnails: [
        "https://images.unsplash.com/photo-1602527336146-ff266650deab?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=100&h=100&fit=crop",
      ],
      description:
        "Premium quality stainless steel water bottle with double-wall insulation technology. Keeps beverages cold for 24 hours or hot for 12 hours. Lightweight, durable, and eco-friendly. Perfect for office, gym, and outdoor activities. Comes with leak-proof cap and ergonomic design for comfortable grip.",
      specifications: [
        { label: "Capacity", value: "2 Liters" },
        { label: "Material", value: "Stainless Steel 304" },
        { label: "Weight", value: "450g" },
        { label: "Insulation", value: "Double-Wall" },
        { label: "Temperature Range", value: "-20°C to 100°C" },
        { label: "Warranty", value: "2 Years" },
      ],
      colors: ["Black", "Silver", "Rose Gold", "Blue"],
      sizes: ["1L", "1.5L", "2L", "2.5L"],
      variants: [
        { id: "v1", color: "Black", size: "2L", price: 1499, stock: 50 },
        { id: "v2", color: "Silver", size: "2L", price: 1599, stock: 45 },
        { id: "v3", color: "Blue", size: "1.5L", price: 1299, stock: 60 },
      ],
      seller: {
        name: "TrustTrade Industries",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        rating: 4.9,
        reviews: 12500,
        responseTime: "< 2 hours",
        location: "Mumbai, India",
        verified: true,
      },
      tags: ["Bestseller", "Eco-Friendly", "Free Shipping", "Verified Seller"],
      featured: true,
      deliveryDays: 3,
      deliveryInfo: "Free shipping on orders above ₹999. Standard delivery takes 3-5 business days.",
      returnPolicy: "30 days easy returns. No questions asked. Full refund within 7 days.",
      warranty: "2 years manufacturer warranty covering defects.",
    },
    {
      id: "prod_002",
      name: "Ergonomic Stainless Steel Lunch Container - Microwave Safe",
      category: "Kitchen & Dining",
      subcategory: "Food Storage",
      price: 899,
      originalPrice: 1499,
      rating: 4.6,
      reviews: 1823,
      stock: 220,
      moq: 5,
      images: [
        "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&h=800&fit=crop",
        "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=800&h=800&fit=crop",
        "https://images.unsplash.com/photo-1591004174900-c333cd0c4442?w=800&h=800&fit=crop",
      ],
      thumbnails: [
        "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1591004174900-c333cd0c4442?w=100&h=100&fit=crop",
      ],
      description:
        "Professional-grade stainless steel lunch container with 4 compartments. Microwave safe, dishwasher safe, and leakproof design. Perfect for meal prep and office lunches. Maintains food temperature and keeps flavors separate.",
      specifications: [
        { label: "Capacity", value: "1.2 Liters (4x300ml)" },
        { label: "Material", value: "Food-Grade Stainless Steel" },
        { label: "Compartments", value: "4" },
        { label: "Microwave Safe", value: "Yes" },
        { label: "Dishwasher Safe", value: "Yes" },
        { label: "Lid Type", value: "BPA-Free Silicone" },
      ],
      colors: ["Silver", "Black", "Green"],
      sizes: ["Small (800ml)", "Medium (1.2L)", "Large (1.5L)"],
      variants: [
        { id: "v4", color: "Silver", size: "Medium (1.2L)", price: 899, stock: 100 },
        { id: "v5", color: "Black", size: "Medium (1.2L)", price: 899, stock: 80 },
        { id: "v6", color: "Green", size: "Large (1.5L)", price: 999, stock: 40 },
      ],
      seller: {
        name: "KitchenMasters Ltd",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
        rating: 4.7,
        reviews: 8900,
        responseTime: "< 1 hour",
        location: "Bangalore, India",
        verified: true,
      },
      tags: ["Microwave Safe", "Leak-Proof", "Eco-Friendly", "Best Price"],
      featured: false,
      deliveryDays: 2,
      deliveryInfo: "Express delivery available. Standard delivery in 2-3 days.",
      returnPolicy: "45 days return window with prepaid return label.",
      warranty: "1 year warranty against manufacturing defects.",
    },
    {
      id: "prod_003",
      name: "Professional Grade Stainless Steel Mixing Bowl Set - 3 Pieces",
      category: "Kitchen & Dining",
      subcategory: "Cookware",
      price: 699,
      originalPrice: 1299,
      rating: 4.5,
      reviews: 1204,
      stock: 89,
      moq: 3,
      images: [
        "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=800&h=800&fit=crop",
        "https://images.unsplash.com/photo-1591004174900-c333cd0c4442?w=800&h=800&fit=crop",
        "https://images.unsplash.com/photo-1602527336146-ff266650deab?w=800&h=800&fit=crop",
      ],
      thumbnails: [
        "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1591004174900-c333cd0c4442?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1602527336146-ff266650deab?w=100&h=100&fit=crop",
      ],
      description:
        "Premium mixing bowl set made from food-grade stainless steel. Includes 3 sizes (1L, 1.5L, 2L) with measurement markings. Non-slip rubber base, dishwasher safe, and suitable for both professional and home kitchens.",
      specifications: [
        { label: "Set Contents", value: "3 Bowls + Lids" },
        { label: "Sizes", value: "1L, 1.5L, 2L" },
        { label: "Material", value: "Food-Grade Stainless Steel" },
        { label: "Base", value: "Non-Slip Rubber" },
        { label: "Measurement", value: "Yes (inside markings)" },
        { label: "Weight", value: "1.2 kg" },
      ],
      colors: ["Silver"],
      sizes: ["3-Piece Set"],
      variants: [
        { id: "v7", color: "Silver", size: "3-Piece Set", price: 699, stock: 89 },
      ],
      seller: {
        name: "CookwarePro India",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        rating: 4.8,
        reviews: 5600,
        responseTime: "< 3 hours",
        location: "Chennai, India",
        verified: true,
      },
      tags: ["Professional Grade", "Non-Slip", "Dishwasher Safe", "Value Pack"],
      featured: false,
      deliveryDays: 4,
      deliveryInfo: "Free shipping nationwide. Bulk orders may have additional discounts.",
      returnPolicy: "30 days full refund if not satisfied.",
      warranty: "Lifetime warranty against manufacturing defects.",
    },
    {
      id: "prod_004",
      name: "Heavy-Duty Stainless Steel Utensil Holder - 4 Compartments",
      category: "Kitchen & Dining",
      subcategory: "Kitchen Storage",
      price: 449,
      originalPrice: 899,
      rating: 4.4,
      reviews: 892,
      stock: 345,
      moq: 2,
      images: [
        "https://images.unsplash.com/photo-1591004174900-c333cd0c4442?w=800&h=800&fit=crop",
        "https://images.unsplash.com/photo-1602527336146-ff266650deab?w=800&h=800&fit=crop",
        "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=800&h=800&fit=crop",
      ],
      thumbnails: [
        "https://images.unsplash.com/photo-1591004174900-c333cd0c4442?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1602527336146-ff266650deab?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=100&h=100&fit=crop",
      ],
      description:
        "Sleek and durable stainless steel utensil holder with 4 separate compartments. Perfect for organizing kitchen utensils, cutlery, and cooking tools. Wall-mounted or countertop placement options. Easy to clean and maintain.",
      specifications: [
        { label: "Material", value: "Stainless Steel 201" },
        { label: "Compartments", value: "4" },
        { label: "Capacity", value: "Up to 20 utensils" },
        { label: "Dimensions", value: "20 x 15 x 10 cm" },
        { label: "Installation", value: "Wall Mount / Countertop" },
        { label: "Weight", value: "450g" },
      ],
      colors: ["Brushed Silver", "Mirror Polish"],
      sizes: ["Standard"],
      variants: [
        { id: "v8", color: "Brushed Silver", size: "Standard", price: 449, stock: 200 },
        { id: "v9", color: "Mirror Polish", size: "Standard", price: 499, stock: 145 },
      ],
      seller: {
        name: "HomeOrganizers Co",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        rating: 4.6,
        reviews: 3400,
        responseTime: "< 4 hours",
        location: "Delhi, India",
        verified: true,
      },
      tags: ["Wall-Mounted", "Space-Saver", "Budget-Friendly", "Modern Design"],
      featured: false,
      deliveryDays: 5,
      deliveryInfo: "Standard delivery. COD available on selected areas.",
      returnPolicy: "15 days return for defects only.",
      warranty: "6 months warranty against rust and corrosion.",
    },
  ];

  const [currentProduct, setCurrentProduct] = useState(sampleProducts[0]);

  const relatedProducts = sampleProducts.filter(
    (p) => p.category === currentProduct.category && p.id !== currentProduct.id
  );

  return (
    <ProductDetailPage
      product={currentProduct}
      relatedProducts={relatedProducts}
      onProductChange={(productId) => {
        const newProduct = sampleProducts.find((p) => p.id === productId);
        if (newProduct) setCurrentProduct(newProduct);
      }}
    />
  );
}
