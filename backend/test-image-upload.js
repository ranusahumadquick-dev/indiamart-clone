import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";

// Create a test image file (small PNG)
const testImageBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

const testImagePath = path.join(process.cwd(), "test-image.png");
fs.writeFileSync(testImagePath, testImageBuffer);

console.log("✅ Test image created:", testImagePath);
console.log("");

// Try to upload
const uploadTest = async () => {
  try {
    console.log("🚀 Testing image upload to http://localhost:8000/api/products");
    console.log("");

    // Create FormData
    const form = new FormData();
    form.append("name", "Test Product with Image");
    form.append("description", "Test product to verify image upload");
    form.append("price", "1000");
    form.append("priceUnit", "Piece");
    form.append("category", "6790184f7b9c8a5d3e4c5b6a");
    form.append("minOrderQuantity", "1");
    form.append("stock", "100");
    form.append("tags", JSON.stringify(["test"]));
    form.append("allowSamples", "false");

    // Add test image
    const imageStream = fs.createReadStream(testImagePath);
    form.append("images", imageStream, "test-image.png");

    console.log("📋 FormData prepared:");
    console.log("  - name: Test Product with Image");
    console.log("  - price: 1000");
    console.log("  - images: 1 file (test-image.png)");
    console.log("");

    // Try to upload
    const res = await axios.post(
      "http://localhost:8000/api/products",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "Authorization": "Bearer YOUR_AUTH_TOKEN_HERE"
        }
      }
    );

    console.log("✅ Upload successful!");
    console.log("   Product ID:", res.data.data._id);
    console.log("   Images stored:", res.data.data.images?.length || 0);
    if (res.data.data.images?.length > 0) {
      console.log("   Image URL:", res.data.data.images[0].url);
    }
  } catch (err) {
    console.error("❌ Upload failed!");
    if (err.response) {
      console.error("   Status:", err.response.status);
      console.error("   Message:", err.response.data?.message);
      console.error("   Error:", err.response.data?.error);
    } else {
      console.error("   Error:", err.message);
    }
  } finally {
    // Clean up
    fs.unlinkSync(testImagePath);
    console.log("");
    console.log("🧹 Test image cleaned up");
  }
};

uploadTest();
