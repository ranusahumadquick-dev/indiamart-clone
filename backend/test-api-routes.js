// Test script to verify API endpoints are accessible

const testApiRoutes = () => {
  const BASE_URL = 'http://localhost:8000';
  
  console.log("Testing Password Reset API Endpoints");
  console.log("=====================================");
  
  // Test data
  const testData = {
    email: "test@example.com",
    newPassword: "newPassword123",
    resetToken: "test-token-123"
  };
  
  // Test functions
  const testPasswordResetRequest = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/password-reset/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testData.email }),
      });
      
      const data = await response.json();
      console.log(`\n📤 POST /api/password-reset/request:`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data)}`);
      
      if (data.resetToken) {
        console.log(`   ✅ Reset token generated: ${data.resetToken}`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  };
  
  const testPasswordReset = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/password-reset/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: testData.resetToken, 
          newPassword: testData.newPassword 
        }),
      });
      
      const data = await response.json();
      console.log(`\n🔐 POST /api/password-reset/reset:`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data)}`);
      
      if (response.status === 200) {
        console.log(`   ✅ Password reset successful!`);
      } else {
        console.log(`   ⚠️  Expected error for invalid token`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  };
  
  // Test API health endpoint
  const testHealthEndpoint = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: 'GET',
      });
      
      const data = await response.json();
      console.log(`\n🏥 GET /api/health:`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${data.message}`);
      
      if (response.status === 200) {
        console.log(`   ✅ API is running!`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  };
  
  // Run tests
  console.log("\n🔄 Running API tests...");
  
  testHealthEndpoint().then(() => {
    testPasswordResetRequest().then(() => {
      testPasswordReset().then(() => {
        console.log("\n🎉 API testing complete!");
        console.log("💡 Note: These tests will work without MongoDB connection");
        console.log("   but actual password reset requires database connection.");
      });
    });
  });
};

// Run the test
testApiRoutes();