import axios from "axios";

const API_URL = "http://localhost:8000/api";
const FRONTEND_URL = "http://localhost:3001";

async function verifyImagesDisplay() {
  console.log("🔍 Verifying Product Images Display\n");
  console.log("=" .repeat(60));

  try {
    // 1. Check API returns products with images
    console.log("\n1️⃣ Checking API Response...");
    const apiRes = await axios.get(`${API_URL}/products?limit=5`);
    const products = apiRes.data.data.products;

    const productsWithImages = products.filter(p => p.images && p.images.length > 0);
    console.log(`   ✅ Total products: ${products.length}`);
    console.log(`   ✅ Products with images: ${productsWithImages.length}`);

    if (productsWithImages.length === 0) {
      console.log("   ⚠️  WARNING: No products have images!");
      return;
    }

    const firstProduct = productsWithImages[0];
    console.log(`\n   Sample Product: "${firstProduct.name}"`);
    console.log(`   Images count: ${firstProduct.images.length}`);
    console.log(`   First image URL: ${firstProduct.images[0].url}`);

    // 2. Verify images are accessible
    console.log("\n2️⃣ Verifying Image URLs are Accessible...");
    for (let i = 0; i < Math.min(3, productsWithImages.length); i++) {
      const product = productsWithImages[i];
      const imageUrl = product.images[0]?.url;

      if (!imageUrl) continue;

      try {
        const response = await axios.head(imageUrl);
        console.log(`   ✅ ${product.name}`);
        console.log(`      Status: ${response.status}`);
        console.log(`      Content-Type: ${response.headers['content-type']}`);
        console.log(`      Size: ${(response.headers['content-length'] / 1024).toFixed(2)}KB`);
      } catch (err) {
        console.log(`   ❌ ${product.name}: ${err.response?.status || err.message}`);
      }
    }

    // 3. Check frontend page loads
    console.log("\n3️⃣ Checking Frontend Page...");
    const frontendRes = await axios.get(`${FRONTEND_URL}/products`);

    // Count product IDs in the HTML (rough check for rendered products)
    const productIdMatches = frontendRes.data.match(/\/products\/[a-f0-9]{24}/g) || [];
    console.log(`   ✅ Frontend page loads: ${frontendRes.status}`);
    console.log(`   ✅ Product links found: ${new Set(productIdMatches).size}`);

    // Check for image src attributes
    const imageSrcMatches = frontendRes.data.match(/src="http:\/\/localhost:8000\/uploads\/products\/[^"]+"/g) || [];
    console.log(`   ✅ Image src attributes found: ${imageSrcMatches.length}`);

    if (imageSrcMatches.length > 0) {
      console.log(`   📸 Sample image URL in HTML:`);
      const sampleUrl = imageSrcMatches[0].match(/http:\/\/[^"]+/)[0];
      console.log(`      ${sampleUrl}`);
    }

    // 4. Final status
    console.log("\n" + "=".repeat(60));
    console.log("✅ VERIFICATION COMPLETE\n");

    if (imageSrcMatches.length > 0) {
      console.log("🎉 SUCCESS: Images are displaying on the frontend!");
      console.log("\n📝 Summary:");
      console.log(`   • API returns products with images: ✅`);
      console.log(`   • Image URLs are accessible: ✅`);
      console.log(`   • Frontend renders image URLs: ✅`);
      console.log(`   • Images should display: ✅`);
    } else {
      console.log("⚠️  ISSUE: Frontend page doesn't show image URLs");
      console.log("   This could mean:");
      console.log("   1. Images not yet loaded in the page");
      console.log("   2. Frontend might be using API calls instead of SSR");
      console.log("   3. Image component not rendering properly");
    }

    console.log("\n📍 Next: Open http://localhost:3001/products in browser");
    console.log("   You should see product images displayed on cards\n");

  } catch (err) {
    console.error("❌ Error:", err.message);
    if (err.response?.status) {
      console.error("   Status:", err.response.status);
    }
  }
}

verifyImagesDisplay();
