import fetch from 'node-fetch';

// Product title keywords mapping to image search terms
const productKeywordMapping = {
  // Electronics & Gadgets
  'laptop': 'laptop computer',
  'camera': 'camera photography',
  'smartphone': 'smartphone mobile phone',
  'phone': 'mobile phone',
  'tablet': 'tablet device',
  'monitor': 'computer monitor screen',
  'keyboard': 'computer keyboard',
  'mouse': 'computer mouse device',
  'headphone': 'headphones audio',
  'speaker': 'bluetooth speaker',
  'charger': 'phone charger',
  'power bank': 'portable power bank',
  'usb': 'usb cable connector',
  'hdmi': 'hdmi cable',

  // Fabrics & Textiles
  'fabric': 'textile cotton fabric',
  'cotton': 'pure cotton fabric',
  'silk': 'silk fabric material',
  'polyester': 'polyester fabric',
  'printed': 'printed fabric textile',
  'saree': 'traditional saree',
  'cloth': 'fabric cloth textile',
  'denim': 'denim fabric',
  'linen': 'linen fabric',
  'wool': 'wool fabric',

  // Raw Materials
  'steel': 'stainless steel industrial',
  'pipe': 'steel pipe industrial',
  'iron': 'iron metal industrial',
  'copper': 'copper wire industrial',
  'aluminum': 'aluminum sheet metal',
  'chemical': 'industrial chemical product',
  'plastic': 'plastic pellets raw material',
  'rubber': 'rubber material',
  'glass': 'glass sheets',
  'wood': 'wooden material',

  // Machinery & Equipment
  'machine': 'industrial machinery equipment',
  'pump': 'industrial pump machinery',
  'motor': 'electric motor industrial',
  'compressor': 'air compressor industrial',
  'generator': 'electric generator industrial',
  'conveyor': 'conveyor belt',
  'grinding': 'grinding machine',
  'cutting': 'cutting machine',

  // Electrical & Electronics
  'solar panel': 'solar panel monocrystalline',
  'led': 'led panel light',
  'light': 'led light bulb',
  'panel': 'electric panel board',
  'wire': 'electric wire cable',
  'battery': 'industrial battery',
  'transformer': 'electrical transformer',
  'breaker': 'circuit breaker',
  'socket': 'electrical socket',
  'switch': 'light switch',

  // Food & Agriculture
  'rice': 'basmati rice grain',
  'spice': 'spice powder masala',
  'oil': 'cooking oil bottle',
  'tea': 'tea leaves dried',
  'coffee': 'coffee beans',
  'wheat': 'wheat grain bulk',
  'sugar': 'sugar granules',
  'flour': 'wheat flour',
  'salt': 'sea salt',
  'honey': 'raw honey',
  'urea': 'urea fertilizer agricultural',
  'fertilizer': 'fertilizer agricultural',
  'maize': 'maize corn grain',
  'pulse': 'pulses lentils',
  'dal': 'dal lentils',
  'seed': 'agricultural seeds',

  // Tools & Hardware
  'tool': 'hand tool set',
  'drill': 'power drill tool',
  'saw': 'saw tool equipment',
  'wrench': 'wrench tool set',
  'nail': 'steel nail industrial',
  'screw': 'metal screws',
  'hammer': 'hammer tool',
  'plier': 'pliers tool',
  'level': 'spirit level tool',

  // Packaging
  'box': 'cardboard box packaging',
  'bag': 'plastic bag packaging',
  'container': 'plastic container',
  'bottle': 'plastic bottle',
  'wrapper': 'packaging material',
  'carton': 'cardboard carton',
  'pouch': 'packaging pouch',
  'tube': 'packaging tube',

  // Home & Furniture
  'chair': 'office chair furniture',
  'table': 'wooden table furniture',
  'desk': 'office desk',
  'sofa': 'leather sofa',
  'bed': 'bed frame furniture',
  'wardrobe': 'wardrobe cabinet',
  'shelf': 'shelving unit',
  'lamp': 'table lamp',

  // Automotive
  'car': 'car automobile',
  'bike': 'motorcycle bike',
  'tyre': 'vehicle tyre',
  'battery': 'car battery',
  'oil': 'engine oil',
  'spare parts': 'automotive spare parts',

  // Health & Beauty
  'cream': 'cosmetic cream',
  'shampoo': 'hair shampoo',
  'soap': 'body soap',
  'lotion': 'skin lotion',
  'perfume': 'perfume fragrance',
  'deodorant': 'deodorant spray',
};

export async function getProductImageFromApi(title, category) {
  try {
    // Extract best keyword from product title and category
    const keyword = extractKeyword(title, category);

    // Try Pexels API first (faster, more reliable)
    const pexelsUrl = await fetchFromPexels(keyword);
    if (pexelsUrl) return pexelsUrl;

    // Fallback to Unsplash
    const unsplashUrl = await fetchFromUnsplash(keyword);
    if (unsplashUrl) return unsplashUrl;

    // Final fallback
    return getDefaultProductImage(category);
  } catch (error) {
    console.error('Image fetch error:', error);
    return getDefaultProductImage(category);
  }
}

function extractKeyword(title, category) {
  const titleLower = title.toLowerCase();
  const categoryLower = category.toLowerCase();

  // Create array of keywords sorted by length (longest first) for better matching
  const sortedKeywords = Object.entries(productKeywordMapping).sort((a, b) =>
    b[0].length - a[0].length
  );

  // Check if title contains any mapped keywords (longest match first)
  for (const [key, searchTerm] of sortedKeywords) {
    if (titleLower.includes(key)) {
      return searchTerm;
    }
  }

  // If no keyword found in title, check category
  if (productKeywordMapping[categoryLower]) {
    return productKeywordMapping[categoryLower];
  }

  // Extract first meaningful word from title as fallback
  const words = titleLower.split(/\s+/);
  for (const word of words) {
    if (word.length > 3) { // Skip very short words
      for (const [key, searchTerm] of sortedKeywords) {
        if (key.includes(word) || word.includes(key)) {
          return searchTerm;
        }
      }
    }
  }

  // Final fallback: use title or category as search term
  return titleLower || categoryLower;
}

async function fetchFromPexels(keyword) {
  if (!process.env.PEXELS_API_KEY) {
    console.warn('PEXELS_API_KEY not set');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=1`,
      {
        headers: {
          'Authorization': process.env.PEXELS_API_KEY
        }
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (data.photos && data.photos.length > 0) {
      // Return medium quality image (better balance of quality and size)
      return data.photos[0].src.medium;
    }
  } catch (error) {
    console.error('Pexels API error:', error);
  }

  return null;
}

async function fetchFromUnsplash(keyword) {
  if (!process.env.UNSPLASH_API_KEY) {
    console.warn('UNSPLASH_API_KEY not set');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=1&client_id=${process.env.UNSPLASH_API_KEY}`
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
  } catch (error) {
    console.error('Unsplash API error:', error);
  }

  return null;
}

function getDefaultProductImage(category) {
  // Normalize category name - extract first word and convert to lowercase
  let normalizedCategory = (category || '').toLowerCase().trim();

  // Extract first word from compound category names (e.g., "Textiles & Apparel" → "textiles")
  const firstWord = normalizedCategory.split(/[\s&,]+/)[0];

  const defaultImages = {
    'fabrics': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop',
    'textiles': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop',
    'apparel': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop',
    'raw': 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=500&h=500&fit=crop',
    'materials': 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=500&h=500&fit=crop',
    'machinery': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&h=500&fit=crop',
    'electrical': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop',
    'electronics': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    'food': 'https://images.unsplash.com/photo-1599599810694-cd5e986c0e4c?w=500&h=500&fit=crop',
    'agro': 'https://images.unsplash.com/photo-1599599810694-cd5e986c0e4c?w=500&h=500&fit=crop',
    'agriculture': 'https://images.unsplash.com/photo-1599599810694-cd5e986c0e4c?w=500&h=500&fit=crop',
    'tools': 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&h=500&fit=crop',
    'packaging': 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=500&h=500&fit=crop',
    'furniture': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=500&fit=crop',
    'automotive': 'https://images.unsplash.com/photo-1552556239-0461a2f5c5f6?w=500&h=500&fit=crop',
    'building': 'https://images.unsplash.com/photo-1582268611826-92291f1a3d09?w=500&h=500&fit=crop',
    'chemicals': 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=500&h=500&fit=crop',
  };

  // Try exact match first, then first word match
  return defaultImages[normalizedCategory] ||
         defaultImages[firstWord] ||
         'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop';
}

// Cache to avoid repeated API calls
const imageCache = new Map();

export async function getProductImageCached(productId, title, category) {
  if (imageCache.has(productId)) {
    return imageCache.get(productId);
  }

  const imageUrl = await getProductImageFromApi(title, category);
  imageCache.set(productId, imageUrl);

  return imageUrl;
}
