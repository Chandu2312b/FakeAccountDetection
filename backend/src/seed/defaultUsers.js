import { connectDB } from '../config/db.js';
import Account from '../models/Account.js';
import Event from '../models/Event.js';
import dotenv from 'dotenv';

dotenv.config();

const defaultUsers = [
  {
    accountId: 'user_001',
    username: 'john_doe_real',
    followerCount: 1250,
    followingCount: 450,
    postsCount: 89,
    accountAgeDays: 1200,
    trustScore: 95,
    riskCategory: 'Safe',
    reasonCodes: ['normal_activity', 'consistent_posting'],
    evidence: { activityPattern: 'regular', engagementRate: 0.08 }
  },
  {
    accountId: 'user_002',
    username: 'sarah_wilson',
    followerCount: 2300,
    followingCount: 1200,
    postsCount: 156,
    accountAgeDays: 800,
    trustScore: 88,
    riskCategory: 'Safe',
    reasonCodes: ['normal_activity', 'good_engagement'],
    evidence: { activityPattern: 'regular', engagementRate: 0.12 }
  },
  {
    accountId: 'user_003',
    username: 'mike_chen',
    followerCount: 450,
    followingCount: 890,
    postsCount: 23,
    accountAgeDays: 200,
    trustScore: 75,
    riskCategory: 'Suspicious',
    reasonCodes: ['low_follower_ratio', 'recent_account'],
    evidence: { followerRatio: 0.51, accountAge: 'new' }
  },
  {
    accountId: 'user_004',
    username: 'emma_brown',
    followerCount: 5600,
    followingCount: 200,
    postsCount: 234,
    accountAgeDays: 1500,
    trustScore: 92,
    riskCategory: 'Safe',
    reasonCodes: ['high_engagement', 'established_account'],
    evidence: { engagementRate: 0.15, accountAge: 'established' }
  },
  {
    accountId: 'user_005',
    username: 'alex_smith',
    followerCount: 120,
    followingCount: 2100,
    postsCount: 5,
    accountAgeDays: 45,
    trustScore: 25,
    riskCategory: 'High Risk',
    reasonCodes: ['extreme_follower_ratio', 'very_recent_account', 'minimal_posts'],
    evidence: { followerRatio: 0.06, accountAge: 'very_new', postFrequency: 'very_low' }
  },
  {
    accountId: 'user_006',
    username: 'lisa_garcia',
    followerCount: 1800,
    followingCount: 600,
    postsCount: 78,
    accountAgeDays: 900,
    trustScore: 85,
    riskCategory: 'Safe',
    reasonCodes: ['normal_activity', 'consistent_posting'],
    evidence: { activityPattern: 'regular', engagementRate: 0.09 }
  },
  {
    accountId: 'user_007',
    username: 'david_jones',
    followerCount: 3200,
    followingCount: 800,
    postsCount: 145,
    accountAgeDays: 1100,
    trustScore: 90,
    riskCategory: 'Safe',
    reasonCodes: ['high_engagement', 'established_account'],
    evidence: { engagementRate: 0.11, accountAge: 'established' }
  },
  {
    accountId: 'user_008',
    username: 'fake_account_1',
    followerCount: 50,
    followingCount: 1500,
    postsCount: 2,
    accountAgeDays: 30,
    trustScore: 15,
    riskCategory: 'High Risk',
    reasonCodes: ['extreme_follower_ratio', 'very_recent_account', 'minimal_posts', 'suspicious_username'],
    evidence: { followerRatio: 0.03, accountAge: 'very_new', postFrequency: 'very_low', usernamePattern: 'suspicious' }
  },
  {
    accountId: 'user_009',
    username: 'maria_rodriguez',
    followerCount: 2100,
    followingCount: 400,
    postsCount: 98,
    accountAgeDays: 750,
    trustScore: 87,
    riskCategory: 'Safe',
    reasonCodes: ['normal_activity', 'good_engagement'],
    evidence: { activityPattern: 'regular', engagementRate: 0.10 }
  },
  {
    accountId: 'user_010',
    username: 'bot_account_123',
    followerCount: 25,
    followingCount: 2000,
    postsCount: 1,
    accountAgeDays: 15,
    trustScore: 5,
    riskCategory: 'High Risk',
    reasonCodes: ['extreme_follower_ratio', 'very_recent_account', 'minimal_posts', 'bot_like_behavior'],
    evidence: { followerRatio: 0.01, accountAge: 'very_new', postFrequency: 'very_low', behaviorPattern: 'bot' }
  },
  {
    accountId: 'user_011',
    username: 'james_wilson',
    followerCount: 3400,
    followingCount: 700,
    postsCount: 167,
    accountAgeDays: 1300,
    trustScore: 91,
    riskCategory: 'Safe',
    reasonCodes: ['high_engagement', 'established_account'],
    evidence: { engagementRate: 0.13, accountAge: 'established' }
  },
  {
    accountId: 'user_012',
    username: 'anna_taylor',
    followerCount: 980,
    followingCount: 350,
    postsCount: 45,
    accountAgeDays: 400,
    trustScore: 78,
    riskCategory: 'Suspicious',
    reasonCodes: ['low_engagement', 'recent_account'],
    evidence: { engagementRate: 0.05, accountAge: 'new' }
  },
  {
    accountId: 'user_013',
    username: 'robert_lee',
    followerCount: 4200,
    followingCount: 900,
    postsCount: 189,
    accountAgeDays: 1600,
    trustScore: 93,
    riskCategory: 'Safe',
    reasonCodes: ['high_engagement', 'established_account'],
    evidence: { engagementRate: 0.14, accountAge: 'established' }
  },
  {
    accountId: 'user_014',
    username: 'suspicious_user',
    followerCount: 80,
    followingCount: 1800,
    postsCount: 3,
    accountAgeDays: 60,
    trustScore: 20,
    riskCategory: 'High Risk',
    reasonCodes: ['extreme_follower_ratio', 'recent_account', 'minimal_posts', 'suspicious_username'],
    evidence: { followerRatio: 0.04, accountAge: 'new', postFrequency: 'very_low', usernamePattern: 'suspicious' }
  },
  {
    accountId: 'user_015',
    username: 'jennifer_davis',
    followerCount: 1500,
    followingCount: 500,
    postsCount: 67,
    accountAgeDays: 600,
    trustScore: 82,
    riskCategory: 'Safe',
    reasonCodes: ['normal_activity', 'consistent_posting'],
    evidence: { activityPattern: 'regular', engagementRate: 0.07 }
  },
  {
    accountId: 'user_016',
    username: 'william_miller',
    followerCount: 2800,
    followingCount: 650,
    postsCount: 123,
    accountAgeDays: 1000,
    trustScore: 89,
    riskCategory: 'Safe',
    reasonCodes: ['high_engagement', 'established_account'],
    evidence: { engagementRate: 0.12, accountAge: 'established' }
  },
  {
    accountId: 'user_017',
    username: 'fake_bot_456',
    followerCount: 15,
    followingCount: 2500,
    postsCount: 0,
    accountAgeDays: 10,
    trustScore: 2,
    riskCategory: 'High Risk',
    reasonCodes: ['extreme_follower_ratio', 'very_recent_account', 'no_posts', 'bot_like_behavior'],
    evidence: { followerRatio: 0.006, accountAge: 'very_new', postFrequency: 'none', behaviorPattern: 'bot' }
  },
  {
    accountId: 'user_018',
    username: 'olivia_martin',
    followerCount: 1900,
    followingCount: 450,
    postsCount: 89,
    accountAgeDays: 850,
    trustScore: 86,
    riskCategory: 'Safe',
    reasonCodes: ['normal_activity', 'good_engagement'],
    evidence: { activityPattern: 'regular', engagementRate: 0.08 }
  },
  {
    accountId: 'user_019',
    username: 'daniel_anderson',
    followerCount: 3600,
    followingCount: 750,
    postsCount: 156,
    accountAgeDays: 1400,
    trustScore: 92,
    riskCategory: 'Safe',
    reasonCodes: ['high_engagement', 'established_account'],
    evidence: { engagementRate: 0.13, accountAge: 'established' }
  },
  {
    accountId: 'user_020',
    username: 'sophia_thomas',
    followerCount: 1100,
    followingCount: 300,
    postsCount: 34,
    accountAgeDays: 350,
    trustScore: 72,
    riskCategory: 'Suspicious',
    reasonCodes: ['low_engagement', 'recent_account'],
    evidence: { engagementRate: 0.04, accountAge: 'new' }
  }
];

async function seedDefaultUsers() {
  try {
    console.log('🌱 Connecting to MongoDB Atlas...');
    await connectDB();
    
    console.log('🗑️ Clearing existing accounts...');
    await Account.deleteMany({});
    
    console.log('👥 Creating 20 default users...');
    
    for (let i = 0; i < defaultUsers.length; i++) {
      const user = defaultUsers[i];
      
      // Create account with scan history
      const account = new Account({
        ...user,
        scanHistory: [{
          scannedAt: new Date(),
          scanType: 'automatic',
          inputData: {
            accountId: user.accountId,
            username: user.username,
            follower_count: user.followerCount,
            posts_count: user.postsCount,
            following_count: user.followingCount,
            account_age_days: user.accountAgeDays
          },
          computedResult: {
            trustScore: user.trustScore,
            riskCategory: user.riskCategory,
            reasonCodes: user.reasonCodes,
            evidence: user.evidence
          },
          scannerInfo: {
            ip: '127.0.0.1',
            userAgent: 'seeder',
            source: 'default_users'
          }
        }],
        lastScannedAt: new Date(),
        totalScans: 1
      });
      
      await account.save();
      
      // Create some events for analytics
      const eventTypes = ['login', 'post', 'follow'];
      const eventCount = Math.floor(Math.random() * 10) + 5;
      
      for (let j = 0; j < eventCount; j++) {
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const daysAgo = Math.floor(Math.random() * 30);
        const eventDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        
        await Event.create({
          accountId: user.accountId,
          type: eventType,
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          location: {
            country: ['USA', 'Canada', 'UK', 'Germany', 'France', 'Japan', 'Australia'][Math.floor(Math.random() * 7)],
            region: 'Unknown',
            city: 'Unknown'
          },
          meta: {
            source: 'default_seed',
            riskCategory: user.riskCategory
          },
          happenedAt: eventDate
        });
      }
      
      console.log(`✅ Created user ${i + 1}/20: ${user.username} (${user.riskCategory})`);
    }
    
    console.log('🎉 Successfully seeded 20 default users!');
    console.log('📊 Summary:');
    
    const safeCount = await Account.countDocuments({ riskCategory: 'Safe' });
    const suspiciousCount = await Account.countDocuments({ riskCategory: 'Suspicious' });
    const highRiskCount = await Account.countDocuments({ riskCategory: 'High Risk' });
    
    console.log(`   Safe: ${safeCount} users`);
    console.log(`   Suspicious: ${suspiciousCount} users`);
    console.log(`   High Risk: ${highRiskCount} users`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding default users:', error);
    process.exit(1);
  }
}

seedDefaultUsers();



