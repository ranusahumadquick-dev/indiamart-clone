import axios from "axios";
const API_URL = "http://localhost:8000/api";

const api = axios.create({ baseURL: API_URL });

console.log("📝 Creating test accounts...\n");

async function registerUser(email, password, role) {
  try {
    const res = await api.post("/auth/register", {
      name: role === "buyer" ? "Test Buyer" : "Test Seller",
      email,
      phone: "9999999999",
      password,
      role,
      companyName: role === "seller" ? "Test Seller Company" : undefined,
    });
    console.log(`✅ ${role.toUpperCase()} registered: ${email}`);
    return res.data.data.user;
  } catch (err) {
    if (err.response?.data?.message?.includes("already")) {
      console.log(`⏭️  ${role.toUpperCase()} already exists: ${email}`);
      return null;
    }
    console.error(`❌ Failed to register ${role}:`, err.response?.data?.message);
    return null;
  }
}

async function main() {
  try {
    await registerUser("buyer@test.com", "password123", "buyer");
    await registerUser("seller@test.com", "password123", "seller");
    console.log("\n✅ Test accounts ready!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

main();
