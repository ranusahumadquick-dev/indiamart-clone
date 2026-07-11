import axios from "axios";

(async () => {
  try {
    // Login
    const loginRes = await axios.post("http://localhost:8000/api/auth/login", {
      email: "seller@test.com",
      password: "test1234"
    });
    const token = loginRes.data.data.accessToken;

    // Get products
    const productsRes = await axios.get(
      "http://localhost:8000/api/products/seller/mine?limit=3",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const products = productsRes.data.data.products;
    console.log("📦 PRODUCTS FROM API:\n");
    
    products.forEach((prod, i) => {
      console.log(`${i + 1}. ${prod.name}`);
      console.log(`   Images: ${prod.images?.length || 0}`);
      if (prod.images && prod.images.length > 0) {
        console.log(`   URL 1: ${prod.images[0].url}`);
      }
      console.log("");
    });

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.response?.data?.message || err.message);
    process.exit(1);
  }
})();
