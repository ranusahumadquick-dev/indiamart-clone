export type VariantType = 'color' | 'size' | 'material' | 'style';

export interface VariantOption {
  id: string;
  type: VariantType;
  name: string;
  value: string;
  hexCode?: string; // For color variants
  displayImage?: string; // For visual representation
}

export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  moq: number; // Minimum Order Quantity
  images: string[];
  thumbnail: string;
  specifications: { label: string; value: string }[];

  // Variant options
  options: VariantOption[];

  // Status
  available: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  badge?: string;

  // Meta data
  weight?: string;
  dimensions?: string;
  materials?: string[];
  colors?: string[];
  sizes?: string[];
  styles?: string[];

  // Availability info
  estimatedDelivery?: string;
  trackingInfo?: boolean;

  // Ratings for this variant
  variantRating?: number;
  variantReviews?: number;
  variantRatings?: { rating: number; count: number }[];
}

export interface VariantGroup {
  type: VariantType;
  name: string;
  values: VariantOption[];
  isRequired: boolean;
  displayMode: 'swatch' | 'button' | 'dropdown'; // How to display the option
}

export interface ProductWithVariants {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  baseRating: number;
  baseReviews: number;
  seller: {
    name: string;
    rating: number;
    verified: boolean;
    image?: string;
  };

  variants: ProductVariant[];
  variantGroups: VariantGroup[];

  baseSpecifications: { label: string; value: string }[];
  warranty?: string;
  returnPolicy?: string;
  deliveryInfo?: string;

  defaultVariantId?: string;
}

export interface SelectedVariantState {
  variantId: string;
  selectedOptions: Record<VariantType, string>; // color: 'red', size: 'M', etc.
  selectedImageIndex: number;
}

export interface VariantFilterOption {
  type: VariantType;
  value: string;
  label: string;
  count: number;
  hexCode?: string;
}
