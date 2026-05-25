// Debug the image service logic
const defaultImages = {
  'fabrics': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop',
  'textiles': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop',
  'raw materials': 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=500&h=500&fit=crop',
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
};

function getDefaultProductImage(category) {
  console.log(`  Looking for category: "${category}"`);
  console.log(`  Lowercase: "${category.toLowerCase()}"`);
  console.log(`  Available keys: ${Object.keys(defaultImages).join(', ')}`);

  const result = defaultImages[category.toLowerCase()];
  console.log(`  Found: ${result ? 'YES' : 'NO'}`);

  if (result) {
    console.log(`  Returning: ${result.substring(0, 80)}...`);
    return result;
  }

  console.log(`  Using fallback image`);
  return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop';
}

// Test
console.log('Testing default image lookup:\n');

const testCases = [
  'food',
  'electrical',
  'electronics',
  'textiles',
  'machinery'
];

testCases.forEach(category => {
  console.log(`\nCategory: "${category}"`);
  getDefaultProductImage(category);
});
