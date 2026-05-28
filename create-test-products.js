import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const API_URL = "http://localhost:8000/api";

const api = axios.create({ baseURL: API_URL });

async function loginSeller() {
  // Try to register first, then login
  const email = `seller_${Date.now()}@test.com`;
  const password = "Test@1234";
  const phone = `9${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;

  try {
    // Try to register
    await api.post("/auth/register", {
      name: "Test Seller",
      email,
      phone,
      password,
      role: "seller",
      companyName: "Test Company",
    }).catch(() => {
      // If registration fails, that's ok - seller might exist
    });

    // Login
    const res = await api.post("/auth/login", {
      email,
      password,
    });
    return { token: res.data.data.token, email, password };
  } catch (err) {
    console.error("❌ Login failed");
    return null;
  }
}

async function createProducts(token) {
  // Use existing image files from backend uploads
  const sampleImagePath = path.join(process.cwd(), "backend/uploads/products/1779801015783-623291989.jpg");

  const products = [
    {
      name: "Stainless Steel Pipe 304 Grade",
      description: "Premium quality seamless pipes for industrial use. Available in various diameters for plumbing, construction, and industrial applications.",
      category: "6a04a7b60e70c60d4a9abc00",
      price: 450,
      minOrderQuantity: 10,
      allowSamples: true,
      samplePrice: 100,
      sampleMinQty: 5,
      hasImage: true
    },
    {
      name: "LED Panel Light 18W",
      description: "Energy efficient LED panel lights with superior brightness. Perfect for offices, shops, and homes. Long lifespan and low power consumption.",
      category: "6a04a7b60e70c60d4a9abc00",
      price: 1200,
      minOrderQuantity: 5,
      allowSamples: true,
      samplePrice: 300,
      sampleMinQty: 1,
      hasImage: true
    },
    {
      name: "Cotton Fabric Roll",
      description: "High quality cotton fabric for garments and home textiles. Breathable, soft, and durable. Suitable for clothing, curtains, and upholstery.",
      category: "6a04a7b60e70c60d4a9abc00",
      price: 150,
      minOrderQuantity: 20,
      allowSamples: true,
      samplePrice: 50,
      sampleMinQty: 2,
      hasImage: true
    },
  ];

  for (const product of products) {
    try {
      const fd = new FormData();
      fd.append("name", product.name);
      fd.append("description", product.description);
      fd.append("price", product.price);
      fd.append("priceUnit", "Piece");
      fd.append("category", product.category);
      fd.append("minOrderQuantity", product.minOrderQuantity);
      fd.append("allowSamples", String(product.allowSamples));
      fd.append("samplePrice", product.samplePrice);
      fd.append("sampleMinQty", product.sampleMinQty);

      // Add image if available
      if (product.hasImage && fs.existsSync(sampleImagePath)) {
        const imageStream = fs.createReadStream(sampleImagePath);
        fd.append("images", imageStream, "product.jpg");
      }

      const res = await api.post("/products", fd, {
        headers: {
          ...fd.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
      });
      const imageCount = res.data.data.images?.length || 0;
      console.log(`✅ Created: ${res.data.data.name} (${imageCount} image${imageCount !== 1 ? 's' : ''})`);
    } catch (err) {
      console.log(`⚠️  Product creation issue: ${err.response?.data?.message || err.message}`);
    }
  }
}

async function main() {
  console.log("📝 Creating test products...\n");

  const seller = await loginSeller();
  if (!seller) {
    console.log("❌ Failed to create/login seller");
    return;
  }

  console.log(`✅ Seller logged in: ${seller.email}\n`);
  await createProducts(seller.token);
  console.log("\n✅ Done! Products should now be visible on /products page");
}

main();
