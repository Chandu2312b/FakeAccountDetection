import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import Account from './src/models/Account.js';

// Load environment variables
dotenv.config();

async function testConnection() {
  try {
    console.log('🧪 Testing MongoDB Atlas connection...');
    console.log('📋 Environment check:');
    console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Not set (using default Atlas connection)'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Connection: ${process.env.MONGODB_URI || 'mongodb+srv://bchandu2385_db_user:***@cluster0.47cssvl.mongodb.net/'}`);
    
    // Test database connection
    await connectDB();
    
    // Test basic database operations
    console.log('\n🔍 Testing database operations...');
    
    // Create a test account
    const testAccount = {
      accountId: 'test_account_' + Date.now(),
      username: 'test_user',
      followerCount: 100,
      postsCount: 50,
      followingCount: 200,
      accountAgeDays: 365,
      trustScore: 85,
      riskCategory: 'Safe',
      reasonCodes: ['test_scan'],
      evidence: { test: true }
    };
    
    const savedAccount = await Account.create(testAccount);
    console.log('✅ Test account created:', savedAccount.accountId);
    
    // Test scan recording
    const scanData = {
      scanType: 'manual',
      inputData: { accountId: testAccount.accountId, follower_count: 100 },
      computedResult: { trustScore: 85, riskCategory: 'Safe' },
      scannerInfo: { ip: '127.0.0.1', userAgent: 'test', source: 'test_script' }
    };
    
    await savedAccount.recordScan(scanData);
    console.log('✅ Scan recorded successfully');
    
    // Verify the data was saved
    const retrievedAccount = await Account.findOne({ accountId: testAccount.accountId });
    console.log('✅ Account retrieved:', {
      accountId: retrievedAccount.accountId,
      totalScans: retrievedAccount.totalScans,
      scanHistoryLength: retrievedAccount.scanHistory.length
    });
    
    // Clean up test data
    await Account.deleteOne({ accountId: testAccount.accountId });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All tests passed! MongoDB Atlas connection is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

testConnection();
