// =============================================
// 💰 PRICING HELPER — Calculate tiered prices
// =============================================

export const getPriceForQuantity = (product, quantity) => {
  // If no pricing slabs, return default price
  if (!product.pricingSlabs || product.pricingSlabs.length === 0) {
    return product.price;
  }

  // Find applicable pricing slab for the quantity
  const applicableSlab = product.pricingSlabs.find((slab) => {
    const meetsMin = quantity >= slab.minQty;
    const meetsMax = slab.maxQty ? quantity <= slab.maxQty : true;
    return meetsMin && meetsMax;
  });

  // Return slab price if found, otherwise default price
  return applicableSlab ? applicableSlab.price : product.price;
};

export const getAvailablePricingTiers = (product) => {
  if (!product.pricingSlabs || product.pricingSlabs.length === 0) {
    return [
      {
        minQty: 1,
        maxQty: null,
        price: product.price,
        label: `1+ @ ₹${product.price}`,
      },
    ];
  }

  // Sort slabs by minQty
  const sortedSlabs = [...product.pricingSlabs].sort((a, b) => a.minQty - b.minQty);

  return sortedSlabs.map((slab) => ({
    minQty: slab.minQty,
    maxQty: slab.maxQty,
    price: slab.price,
    label: slab.maxQty
      ? `${slab.minQty}-${slab.maxQty} @ ₹${slab.price}`
      : `${slab.minQty}+ @ ₹${slab.price}`,
  }));
};

// Calculate total price with tiered pricing
export const calculateTotalPrice = (product, quantity) => {
  const unitPrice = getPriceForQuantity(product, quantity);
  return unitPrice * quantity;
};

// Calculate savings with tiered pricing
export const calculateSavings = (product, quantity) => {
  const defaultPrice = product.price * quantity;
  const tieredPrice = calculateTotalPrice(product, quantity);
  const savings = defaultPrice - tieredPrice;
  const savingsPercent = defaultPrice > 0 ? Math.round((savings / defaultPrice) * 100) : 0;

  return { savings, savingsPercent };
};

export default {
  getPriceForQuantity,
  getAvailablePricingTiers,
  calculateTotalPrice,
  calculateSavings,
};
