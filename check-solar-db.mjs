import http from 'http';

function fetch(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:8000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function check() {
  try {
    // Get specific solar panel by ID
    const response = await fetch('/api/products/6a0ee06c9285112d60e704b1');
    const product = response.data;
    
    console.log('\n🔍 Solar Panel Database Check:\n');
    console.log('Product:', product.name);
    console.log('Images count:', product.images?.length);
    
    if (product.images && product.images.length > 0) {
      console.log('\n📸 Image Data:');
      product.images.forEach((img, i) => {
        console.log(`\n${i+1}. URL: ${img.url}`);
        console.log(`   Alt: ${img.alt}`);
        console.log(`   Type: ${img.type}`);
      });
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
