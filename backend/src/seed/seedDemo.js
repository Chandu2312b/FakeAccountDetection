import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import Account from '../models/Account.js';
import Event from '../models/Event.js';
import Report from '../models/Report.js';
import Honeypot from '../models/Honeypot.js';
import Flag from '../models/Flag.js';
import { geolocateIp } from '../services/geo.js';
import { computeRiskAndTrust } from '../utils/rules.js';

dotenv.config();

const randomIp = () => {
  const blocks = [
    [ '8.8.8.8', '1.1.1.1', '9.9.9.9', '208.67.222.222' ],
    [ '23.16.45.12', '45.33.32.156', '104.16.132.229' ],
    [ '185.199.108.153', '172.217.20.14', '151.101.1.69' ],
    [ '89.160.20.112', '64.233.160.0', '91.198.174.192' ]
  ];
  const b = blocks[Math.floor(Math.random() * blocks.length)];
  return b[Math.floor(Math.random() * b.length)];
};

const createLoginEvent = async (accountId) => {
  const ip = randomIp();
  const loc = geolocateIp(ip);
  return Event.create({
    accountId,
    type: 'login',
    ip,
    location: loc || undefined,
    happenedAt: new Date()
  });
};

const main = async () => {
  await connectDB();
  console.log('Seeding demo data...');

  await Promise.all([
    Account.deleteMany({}),
    Event.deleteMany({}),
    Report.deleteMany({}),
    Honeypot.deleteMany({}),
    Flag.deleteMany({})
  ]);

  // Honeypots
  const honeypots = await Honeypot.insertMany([
    { baitId: 'hp-001', description: 'Fake giveaway link' },
    { baitId: 'hp-002', description: 'Suspicious comment lure' }
  ]);

  // Normal users
  const normals = [];
  for (let i = 1; i <= 25; i++) {
    const accountId = `user_${i}`;
    const doc = {
      accountId,
      username: `normal_${i}`,
      followerCount: 200 + i * 3,
      followingCount: 150 + i,
      postsCount: 50 + i,
      accountAgeDays: 365 + i,
      isHoneypotInteractor: false,
      duplicateContentCount: 0,
      sharedIpCount: 1
    };
    const risk = computeRiskAndTrust({
      followerCount: doc.followerCount,
      postsCount: doc.postsCount,
      followingCount: doc.followingCount,
      accountAgeDays: doc.accountAgeDays,
      isHoneypotInteractor: doc.isHoneypotInteractor,
      duplicateContentCount: doc.duplicateContentCount,
      sharedIpCount: doc.sharedIpCount,
      recentPostsPerDay: 1,
      recentFollowsPerDay: 2
    });
    doc.trustScore = risk.trustScore;
    doc.riskCategory = risk.riskCategory;
    doc.reasonCodes = risk.reasonCodes;
    doc.evidence = risk.evidence;
    normals.push(doc);
  }

  // Bots
  const bots = [];
  for (let i = 1; i <= 15; i++) {
    const accountId = `bot_${i}`;
    const doc = {
      accountId,
      username: `bot_${i}`,
      followerCount: Math.floor(Math.random() * 20),
      followingCount: 800 + Math.floor(Math.random() * 400),
      postsCount: 300 + Math.floor(Math.random() * 400),
      accountAgeDays: Math.floor(Math.random() * 5) + 1,
      isHoneypotInteractor: i % 3 === 0,
      duplicateContentCount: 10,
      sharedIpCount: 10
    };
    const risk = computeRiskAndTrust({
      followerCount: doc.followerCount,
      postsCount: doc.postsCount,
      followingCount: doc.followingCount,
      accountAgeDays: doc.accountAgeDays,
      samplePost: 'Get free crypto now!',
      isHoneypotInteractor: doc.isHoneypotInteractor,
      duplicateContentCount: doc.duplicateContentCount,
      sharedIpCount: doc.sharedIpCount,
      recentPostsPerDay: 50,
      recentFollowsPerDay: 120
    });
    doc.trustScore = risk.trustScore;
    doc.riskCategory = risk.riskCategory;
    doc.reasonCodes = risk.reasonCodes;
    doc.evidence = risk.evidence;
    bots.push(doc);
  }

  const accounts = await Account.insertMany([...normals, ...bots]);

  // Events & Reports
  for (const acc of accounts) {
    // Some logins
    const loginCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < loginCount; i++) {
      await createLoginEvent(acc.accountId);
    }
    // Activity events for rates
    const posts = acc.riskCategory === 'High Risk' ? 80 : 7;
    const follows = acc.riskCategory === 'High Risk' ? 200 : 10;
    for (let i = 0; i < posts; i++) {
      await Event.create({
        accountId: acc.accountId,
        type: 'post',
        happenedAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000)
      });
    }
    for (let i = 0; i < follows; i++) {
      await Event.create({
        accountId: acc.accountId,
        type: 'follow',
        happenedAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000)
      });
    }
    // Reports for top-reported table
    if (acc.riskCategory !== 'Safe') {
      const reps = 2 + Math.floor(Math.random() * 5);
      for (let r = 0; r < reps; r++) {
        await Report.create({
          accountId: acc.accountId,
          reason: 'Spam',
          reporterId: `reporter_${r}`,
          notes: 'Auto-generated demo report'
        });
      }
    }
  }

  // Open flags for suspicious/high risk
  const risky = accounts.filter(a => a.riskCategory !== 'Safe');
  for (const acc of risky) {
    await Flag.create({
      accountId: acc.accountId,
      reasons: acc.reasonCodes,
      evidence: acc.evidence,
      status: 'open'
    });
  }

  console.log(`Seeded ${accounts.length} accounts, ${risky.length} flagged.`);
  process.exit(0);
};

main().catch(e => {
  console.error(e);
  process.exit(1);
});







