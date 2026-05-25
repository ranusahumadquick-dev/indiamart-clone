// Test keyword extraction locally
const productKeywordMapping = {
  'solar panel': 'solar panel monocrystalline',
  'led': 'led panel light',
  'urea': 'urea fertilizer agricultural',
  'fertilizer': 'fertilizer agricultural',
  'cotton': 'pure cotton fabric',
  'laptop': 'laptop computer',
};

function extractKeyword(title, category) {
  const titleLower = title.toLowerCase();
  const categoryLower = category.toLowerCase();

  // Create array of keywords sorted by length (longest first)
  const sortedKeywords = Object.entries(productKeywordMapping).sort((a, b) =>
    b[0].length - a[0].length
  );

  console.log(`\nTesting: "${title}" with category "${category}"`);
  console.log('Title lowercase:', titleLower);
  console.log('Sorted keywords:', sortedKeywords.map(k => k[0]));

  // Check if title contains any mapped keywords
  for (const [key, searchTerm] of sortedKeywords) {
    if (titleLower.includes(key)) {
      console.log(`✓ Found keyword: "${key}" → Search term: "${searchTerm}"`);
      return searchTerm;
    }
  }

  console.log('✗ No keyword found in title');

  // If no keyword found in title, check category
  if (productKeywordMapping[categoryLower]) {
    console.log(`✓ Found category: "${categoryLower}" → Search term: "${productKeywordMapping[categoryLower]}"`);
    return productKeywordMapping[categoryLower];
  }

  console.log(`✗ No category mapping for "${categoryLower}"`);
  return titleLower;
}

// Test cases
const tests = [
  { title: 'Urea Fertilizer 46% Nitrogen', category: 'food' },
  { title: 'Laptop Computer i7 16GB', category: 'electronics' },
  { title: 'Solar Panel 50W', category: 'electrical' },
  { title: 'Cotton Fabric 100m', category: 'textiles' },
  { title: 'LED Light 18W', category: 'electrical' },
];

console.log('═══════════════════════════════════════════');
console.log('KEYWORD EXTRACTION TEST');
console.log('═══════════════════════════════════════════');

tests.forEach(test => {
  const result = extractKeyword(test.title, test.category);
  console.log(`Final result: "${result}"\n`);
});
