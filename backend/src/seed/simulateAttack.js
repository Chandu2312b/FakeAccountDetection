import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import Event from '../models/Event.js';
import Account from '../models/Account.js';
import Report from '../models/Report.js';
import Flag from '../models/Flag.js';
import { computeRiskAndTrust } from '../utils/rules.js';

dotenv.config();

const simulateAttack = async () => {
  await connectDB();
  // Burst: create 20 new bot accounts with extreme activity
  const created = [];
  for (let i = 0; i < 20; i++) {
    const accountId = `attack_bot_${Date.now()}_${i}`;
    const doc = {
      accountId,
      username: accountId,
      followerCount: Math.floor(Math.random() * 5),
      followingCount: 1200,
      postsCount: 1000,
      accountAgeDays: 1,
      isHoneypotInteractor: i % 2 === 0,
      duplicateContentCount: 20,
      sharedIpCount: 20
    };
    const risk = computeRiskAndTrust({
      followerCount: doc.followerCount,
      postsCount: doc.postsCount,
      followingCount: doc.followingCount,
      accountAgeDays: doc.accountAgeDays,
      samplePost: 'Claim free gift card',
      isHoneypotInteractor: doc.isHoneypotInteractor,
      duplicateContentCount: doc.duplicateContentCount,
      sharedIpCount: doc.sharedIpCount,
      recentPostsPerDay: 200,
      recentFollowsPerDay: 500
    });
    doc.trustScore = risk.trustScore;
    doc.riskCategory = risk.riskCategory;
    doc.reasonCodes = risk.reasonCodes;
    doc.evidence = risk.evidence;

    await Account.create(doc);
    // Activity surge
    const now = Date.now();
    for (let p = 0; p < 200; p++) {
      await Event.create({
        accountId,
        type: 'post',
        happenedAt: new Date(now - Math.random() * 3600 * 1000)
      });
    }
    for (let f = 0; f < 500; f++) {
      await Event.create({
        accountId,
        type: 'follow',
        happenedAt: new Date(now - Math.random() * 3600 * 1000)
      });
    }
    for (let r = 0; r < 5; r++) {
      await Report.create({
        accountId,
        reason: 'Spam wave',
        reporterId: `attack_reporter_${r}`,
        notes: 'Simulated attack report'
      });
    }
    await Flag.create({
      accountId,
      reasons: doc.reasonCodes,
      evidence: doc.evidence,
      status: 'open'
    });
    created.push(accountId);
  }

  return { created: created.length };
};

export default simulateAttack;







