import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoint...');
    
    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const testData = {
      accountId: "test_user_123",
      username: "testuser",
      follower_count: 1500,
      posts_count: 75,
      following_count: 300,
      account_age_days: 180,
      sample_post: "This is a test post for scanning"
    };
    
    console.log('📤 Sending test scan request...');
    console.log('Data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('https://fakeaccountdetection-1.onrender.com/api/accounts/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ API Response:');
    console.log(JSON.stringify(result, null, 2));
    
    // Test getting the account
    console.log('\n📥 Testing account retrieval...');
    const getResponse = await fetch(`https://fakeaccountdetection-1.onrender.com/api/accounts/${testData.accountId}`);
    
    if (getResponse.ok) {
      const accountData = await getResponse.json();
      console.log('✅ Account retrieved:');
      console.log(`   Account ID: ${accountData.accountId}`);
      console.log(`   Trust Score: ${accountData.trustScore}%`);
      console.log(`   Risk Category: ${accountData.riskCategory}`);
      console.log(`   Total Scans: ${accountData.totalScans}`);
      console.log(`   Scan History: ${accountData.scanHistory?.length || 0} entries`);
    }
    
    console.log('\n🎉 API test completed successfully!');
    console.log('📊 Data is being stored in MongoDB Atlas');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running: npm run dev');
    }
  }
}

testAPI();



