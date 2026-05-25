const axios = require('axios');

async function testImageApi() {
  const baseUrl = 'http://localhost:8000/api';

  console.log('🔍 Testing Product Image API Endpoints\n');

  // Test cases with different products
  const testCases = [
    { title: 'Solar Panel 50W', category: 'electrical', productId: 'test-solar-1' },
    { title: 'Laptop Computer i7 16GB', category: 'electronics', productId: 'test-laptop-1' },
    { title: 'Professional Camera HD', category: 'electronics', productId: 'test-camera-1' },
    { title: 'Cotton Fabric Roll 100m', category: 'fabrics', productId: 'test-cotton-1' },
    { title: 'Steel Pipe 2 inch Industrial', category: 'raw materials', productId: 'test-steel-1' },
    { title: 'LED Light Bulb 18W', category: 'electrical', productId: 'test-led-1' },
    { title: 'Coffee Beans Premium 1kg', category: 'food', productId: 'test-coffee-1' },
    { title: 'Power Drill 18V Professional', category: 'tools', productId: 'test-drill-1' },
    { title: 'Office Chair Ergonomic', category: 'furniture', productId: 'test-chair-1' },
    { title: 'Motorcycle Bike 150cc', category: 'automotive', productId: 'test-bike-1' },
  ];

  console.log('📦 Testing Image API with sample products:\n');

  for (const testCase of testCases) {
    try {
      const url = `${baseUrl}/images/products/${testCase.productId}/image?title=${encodeURIComponent(
        testCase.title
      )}&category=${encodeURIComponent(testCase.category)}`;

      console.log(`Testing: "${testCase.title}"`);
      console.log(`  URL: ${url.substring(0, 100)}...`);

      const response = await axios.get(url, { timeout: 10000 });

      if (response.data && response.data.success) {
        console.log(`  ✓ Image fetched: ${response.data.data.imageUrl.substring(0, 60)}...`);
        console.log('');
      } else {
        console.log(`  ⚠️ API response: ${JSON.stringify(response.data).substring(0, 80)}`);
        console.log('');
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`     Status: ${error.response.status}`);
        console.log(`     Response: ${JSON.stringify(error.response.data).substring(0, 80)}`);
      }
      console.log('');
    }
  }

  // Test batch API
  console.log('📦 Testing Batch Image API:\n');
  try {
    const response = await axios.post(`${baseUrl}/images/products/images/batch`, {
      products: [
        { productId: 'batch-1', title: 'Solar Panel', category: 'electrical' },
        { productId: 'batch-2', title: 'Laptop', category: 'electronics' },
        { productId: 'batch-3', title: 'Camera', category: 'electronics' },
      ],
    }, { timeout: 10000 });

    if (response.data && response.data.success) {
      console.log(`✓ Batch API response received`);
      console.log(`  Products processed: ${response.data.data.length}`);
      response.data.data.forEach((item) => {
        console.log(`  - ${item.productId}: ${item.imageUrl?.substring(0, 50)}...`);
      });
    }
  } catch (error) {
    console.log(`❌ Batch API Error: ${error.message}`);
  }
}

testImageApi();
