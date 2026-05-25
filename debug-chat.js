import fetch from 'node-fetch';

const API_URL = 'http://localhost:8000';

async function debugChat() {
  console.log('🔍 Debugging Chat Unread Count...\n');

  try {
    // Create test users
    console.log('Creating test users...');
    const buyerRes = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Debug Buyer',
        email: 'debug.buyer@test.com',
        phone: '9201234568',
        password: 'Debug123!',
        role: 'buyer'
      })
    });
    const buyerData = await buyerRes.json();
    const buyerToken = buyerData.data.accessToken;
    const buyerId = buyerData.data.user._id;

    const sellerRes = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Debug Seller',
        email: 'debug.seller@test.com',
        phone: '9301234568',
        password: 'Debug123!',
        role: 'seller'
      })
    });
    const sellerData = await sellerRes.json();
    const sellerToken = sellerData.data.accessToken;
    const sellerId = sellerData.data.user._id;
    console.log('✅ Users created\n');

    // Create conversation
    console.log('Creating conversation...');
    const convRes = await fetch(`${API_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`
      },
      body: JSON.stringify({ sellerId })
    });
    const convData = await convRes.json();
    const conversationId = convData.data._id;
    console.log(`✅ Conversation created: ${conversationId}`);
    console.log(`   Initial buyerUnreadCount: ${convData.data.buyerUnreadCount}`);
    console.log(`   Initial sellerUnreadCount: ${convData.data.sellerUnreadCount}\n`);

    // Send message from buyer
    console.log('Sending message from buyer to seller...');
    const msgRes = await fetch(`${API_URL}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`
      },
      body: JSON.stringify({ text: 'Debug test message' })
    });
    const msgData = await msgRes.json();
    console.log(`✅ Message sent: ${msgData.data._id}`);
    console.log(`   Message text: ${msgData.data.text}\n`);

    // Fetch conversation as seller to check unread count
    console.log('Fetching conversation as SELLER...');
    const sellerConvRes = await fetch(`${API_URL}/api/chat/conversations?role=seller`, {
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });
    const sellerConvData = await sellerConvRes.json();
    console.log('Seller conversations:');
    sellerConvData.data.conversations.forEach(c => {
      console.log(`  - Conv ${c._id}`);
      console.log(`    buyerUnreadCount: ${c.buyerUnreadCount}`);
      console.log(`    sellerUnreadCount: ${c.sellerUnreadCount}`);
    });
    console.log(`Total unreadCount reported: ${sellerConvData.data.unreadCount}\n`);

    // Fetch conversation as buyer to check unread count
    console.log('Fetching conversation as BUYER...');
    const buyerConvRes = await fetch(`${API_URL}/api/chat/conversations?role=buyer`, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    const buyerConvData = await buyerConvRes.json();
    console.log('Buyer conversations:');
    buyerConvData.data.conversations.forEach(c => {
      console.log(`  - Conv ${c._id}`);
      console.log(`    buyerUnreadCount: ${c.buyerUnreadCount}`);
      console.log(`    sellerUnreadCount: ${c.sellerUnreadCount}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugChat();
