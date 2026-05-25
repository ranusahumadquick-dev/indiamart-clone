import fetch from 'node-fetch';

const API_URL = 'http://localhost:8000';

async function testChat() {
  console.log('🧪 Testing Chat System...\n');

  try {
    // Generate unique emails and phones
    const timestamp = Math.floor(Date.now() / 1000);
    const buyerEmail = `buyer${timestamp}@test.com`;
    const sellerEmail = `seller${timestamp}@test.com`;
    const randomPart1 = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
    const randomPart2 = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
    const buyerPhone = `9201${randomPart1.slice(0, 6)}`;
    const sellerPhone = `9301${randomPart2.slice(0, 6)}`;

    // Register buyer
    console.log('Registering buyer...');
    const buyerRes = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Buyer',
        email: buyerEmail,
        phone: buyerPhone,
        password: 'Test123!',
        role: 'buyer'
      })
    });
    const buyerJson = await buyerRes.json();
    if (!buyerJson.data || !buyerJson.data.accessToken) {
      throw new Error(`Buyer registration failed: ${JSON.stringify(buyerJson)}`);
    }
    const buyerToken = buyerJson.data.accessToken;
    const buyerId = buyerJson.data.user._id;
    console.log(`✅ Buyer registered: ${buyerId}\n`);

    // Register seller
    console.log('Registering seller...');
    const sellerRes = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Seller',
        email: sellerEmail,
        phone: sellerPhone,
        password: 'Test123!',
        role: 'seller'
      })
    });
    const sellerJson = await sellerRes.json();
    if (!sellerJson.data || !sellerJson.data.accessToken) {
      throw new Error(`Seller registration failed: ${JSON.stringify(sellerJson)}`);
    }
    const sellerToken = sellerJson.data.accessToken;
    const sellerId = sellerJson.data.user._id;
    console.log(`✅ Seller registered: ${sellerId}\n`);

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
    const convJson = await convRes.json();
    const conversationId = convJson.data._id;
    console.log(`✅ Conversation created: ${conversationId}\n`);

    // Send message
    console.log('Sending message from buyer...');
    const msgRes = await fetch(`${API_URL}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`
      },
      body: JSON.stringify({ text: 'Hello seller, interested in your products!' })
    });
    const msgJson = await msgRes.json();
    console.log(`✅ Message sent: "${msgJson.data.text}"\n`);

    // Check seller's unread count
    console.log('Checking seller unread count...');
    const unreadRes = await fetch(`${API_URL}/api/chat/conversations?role=seller`, {
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });
    const unreadJson = await unreadRes.json();
    const conversations = unreadJson.data.conversations || [];
    const totalUnreadMessages = conversations.reduce((sum, c) => sum + (c.sellerUnreadCount || 0), 0);
    const conversationsWithUnread = unreadJson.data.unreadCount;

    console.log(`✅ Seller's unread status:`);
    console.log(`   - Total messages unread: ${totalUnreadMessages}`);
    console.log(`   - Conversations with unread: ${conversationsWithUnread}\n`);

    if (totalUnreadMessages > 0) {
      console.log('✅ Badge will show number:', totalUnreadMessages);
    } else {
      console.log('❌ No unread messages found (should be 1)');
      process.exit(1);
    }

    // Send message from seller
    console.log('\nSending message from seller...');
    const sellerMsgRes = await fetch(`${API_URL}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sellerToken}`
      },
      body: JSON.stringify({ text: 'Thanks for your interest! How can I help?' })
    });
    const sellerMsgJson = await sellerMsgRes.json();
    console.log(`✅ Seller message sent: "${sellerMsgJson.data.text}"\n`);

    // Check buyer's unread count
    console.log('Checking buyer unread count...');
    const buyerUnreadRes = await fetch(`${API_URL}/api/chat/conversations?role=buyer`, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    });
    const buyerUnreadJson = await buyerUnreadRes.json();
    const buyerConversations = buyerUnreadJson.data.conversations || [];
    const buyerTotalUnreadMessages = buyerConversations.reduce((sum, c) => sum + (c.buyerUnreadCount || 0), 0);
    console.log(`✅ Buyer's unread message count: ${buyerTotalUnreadMessages}\n`);

    // Mark messages as read
    console.log('Marking messages as read (seller)...');
    const readRes = await fetch(`${API_URL}/api/chat/conversations/${conversationId}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });
    console.log(`✅ Messages marked as read\n`);

    // Verify unread count is zero
    console.log('Verifying unread count after read...');
    const finalUnreadRes = await fetch(`${API_URL}/api/chat/conversations?role=seller`, {
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });
    const finalUnreadJson = await finalUnreadRes.json();
    const finalConversations = finalUnreadJson.data.conversations || [];
    const finalUnreadMessages = finalConversations.reduce((sum, c) => sum + (c.sellerUnreadCount || 0), 0);
    console.log(`✅ Final unread count: ${finalUnreadMessages}`);

    if (finalUnreadMessages === 0) {
      console.log('\n🎉 All tests passed! Chat system working correctly.');
    } else {
      console.log(`\n❌ Unread count should be 0 but is ${finalUnreadMessages}`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testChat();
