async function testAPI() {
  try {
    const response = await fetch('http://localhost:8000/api/products?page=1&limit=2');
    const data = await response.json();

    console.log('API Response Status:', response.status);
    console.log('\n First Product:');

    if (data.data && data.data.products && data.data.products[0]) {
      const product = data.data.products[0];
      console.log('Name:', product.name);
      console.log('Category type:', typeof product.category);
      console.log('Category value:', JSON.stringify(product.category, null, 2));
      console.log('Category.name:', product.category?.name ? 'EXISTS' : 'MISSING');

      console.log('\nProduct Object Keys:', Object.keys(product).slice(0, 15));
    } else {
      console.log('No products in response');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
