// Category-based Purchase Mode Configuration
export const PURCHASE_MODE_CONFIG = {
  // Categories supporting BOTH Wholesale and Customization
  BOTH: [
    'industrial-machinery',
    'hydraulic-equipment',
    'solar-products',
    'electronics-components',
    'led-lights',
    'packaging-machines',
    'agriculture-equipment',
    'furniture',
    'apparel-textiles',
    'promotional-products'
  ],

  // Categories supporting ONLY Wholesale
  WHOLESALE_ONLY: [
    'laptops',
    'mobile-accessories',
    'water-bottles',
    'kids-toys',
    'home-appliances',
    'consumer-electronics',
    'grocery-products',
    'office-supplies'
  ]
};

export const getPurchaseModes = (categorySlug) => {
  const slug = categorySlug?.toLowerCase()?.replace(/\s+/g, '-') || '';

  if (PURCHASE_MODE_CONFIG.BOTH.includes(slug)) {
    return ['wholesale', 'customization'];
  }

  if (PURCHASE_MODE_CONFIG.WHOLESALE_ONLY.includes(slug)) {
    return ['wholesale'];
  }

  // Default to wholesale only for unknown categories
  return ['wholesale'];
};

export const supportsBothModes = (categorySlug) => {
  const modes = getPurchaseModes(categorySlug);
  return modes.includes('wholesale') && modes.includes('customization');
};

export const supportsCustomization = (categorySlug) => {
  const modes = getPurchaseModes(categorySlug);
  return modes.includes('customization');
};
