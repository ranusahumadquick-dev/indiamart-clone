import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const API_URL = "http://localhost:8000/api";

const api = axios.create({ baseURL: API_URL });

async function test() {
  console.log("🧪 Testing product creation with image upload...\n");

  // 1. Login as seller
  console.log("1️⃣ Logging in as seller...");
  const email = `seller_test_${Date.now()}@test.com`;
  const password = "Test@1234";
  const phone = `9${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;

  try {
    // Register
    await api.post("/auth/register", {
      name: "Test Seller Image",
      email,
      phone,
      password,
      role: "seller",
      companyName: "Test Image Company",
    }).catch(() => console.log("   (Seller may already exist)"));

    // Login
    const loginRes = await api.post("/auth/login", {
      email,
      password,
    });

    const token = loginRes.data.data.token;
    console.log("✅ Logged in. Token:", token.substring(0, 20) + "...\n");

    // 2. Create product with image
    console.log("2️⃣ Creating product with image...");

    const existingImage = path.join(process.cwd(), "backend/uploads/products/1779801015783-623291989.jpg");

    if (!fs.existsSync(existingImage)) {
      console.error("❌ Test image not found:", existingImage);
      return;
    }

    console.log("   Using test image:", existingImage);
    console.log("   File exists:", fs.existsSync(existingImage));
    console.log("   File size:", fs.statSync(existingImage).size, "bytes\n");

    const fd = new FormData();
    fd.append("name", "Test Product With Real Image");
    fd.append("description", "This product has a real uploaded image");
    fd.append("price", "500");
    fd.append("priceUnit", "Piece");
    fd.append("category", "6a04a7b60e70c60d4a9abc00");
    fd.append("minOrderQuantity", "1");

    // Append image file
    const imageStream = fs.createReadStream(existingImage);
    fd.append("images", imageStream, "test-image.jpg");
    console.log("   FormData created with image");

    const createRes = await api.post("/products", fd, {
      headers: {
        ...fd.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("\n✅ Product created successfully!");
    console.log("   Product ID:", createRes.data.data._id);
    console.log("   Product Name:", createRes.data.data.name);
    console.log("   Images array:", JSON.stringify(createRes.data.data.images, null, 2));

    if (createRes.data.data.images && createRes.data.data.images.length > 0) {
      console.log("\n✅ SUCCESS: Images were saved to the product!");
      console.log("   First image URL:", createRes.data.data.images[0].url);
    } else {
      console.log("\n❌ PROBLEM: Images array is empty in response!");
    }

    // 3. Fetch the product back
    console.log("\n3️⃣ Fetching product from API...");
    const fetchRes = await api.get("/products/" + createRes.data.data._id);
    console.log("   Fetched product images:", JSON.stringify(fetchRes.data.data.images, null, 2));

  } catch (err) {
    console.error("\n❌ Error:", err.response?.data?.message || err.message);
    console.error("Full error:", err.response?.data || err.message);
  }
}

test();
