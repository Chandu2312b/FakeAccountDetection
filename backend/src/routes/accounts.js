import { Router } from 'express';
import Account from '../models/Account.js';
import Event from '../models/Event.js';
import Report from '../models/Report.js';
import Flag from '../models/Flag.js';
import { computeRiskAndTrust } from '../utils/rules.js';

const router = Router();

/*
POST /api/accounts/scan
Body:
{
  accountId?: string,
  username?: string,
  follower_count?: number,
  posts_count?: number,
  following_count?: number,
  account_age_days?: number,
  sample_post?: string
}
Returns account metadata + trust score, reasons, evidence.
*/
router.post('/scan', async (req, res) => {
  try {
    const {
      accountId,
      username,
      follower_count,
      posts_count,
      following_count,
      account_age_days,
      sample_post
    } = req.body || {};

    if (!accountId && !username) {
      return res.status(400).json({ error: 'Provide accountId or username' });
    }

    // Get client information for tracking
    const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const source = req.headers['x-source'] || 'web_interface';

    console.log(`🔍 Starting scan for account: ${accountId || username}`);
    console.log(`📊 Client IP: ${clientIp}, Source: ${source}`);

    let account = await Account.findOne({ accountId: accountId || username });

    // If stats supplied, prefer them; else fallback to DB if exists; else defaults
    const followerCount = Number.isFinite(follower_count) ? follower_count : (account?.followerCount || 0);
    const postsCount = Number.isFinite(posts_count) ? posts_count : (account?.postsCount || 0);
    const followingCount = Number.isFinite(following_count) ? following_count : (account?.followingCount || 0);
    const accountAgeDays = Number.isFinite(account_age_days) ? account_age_days : (account?.accountAgeDays || 0);
    const samplePost = typeof sample_post === 'string' ? sample_post : '';

    // Estimate recent activity rates from events (last 7 days)
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const [postEvents, followEvents] = await Promise.all([
      Event.countDocuments({ accountId: accountId || username, type: 'post', happenedAt: { $gte: since } }),
      Event.countDocuments({ accountId: accountId || username, type: 'follow', happenedAt: { $gte: since } })
    ]);
    let recentPostsPerDay = +(postEvents / 7).toFixed(2);
    let recentFollowsPerDay = +(followEvents / 7).toFixed(2);
    // If user provided lifetime stats and age, derive fallback rates if events are sparse
    if ((postEvents < 5) && accountAgeDays > 0 && postsCount > 0) {
      recentPostsPerDay = Math.max(recentPostsPerDay, +(postsCount / Math.max(1, accountAgeDays)).toFixed(2));
    }
    if ((followEvents < 5) && accountAgeDays > 0 && followingCount > 0) {
      recentFollowsPerDay = Math.max(recentFollowsPerDay, +(followingCount / Math.max(1, accountAgeDays)).toFixed(2));
    }

    const isHoneypotInteractor = !!(account?.isHoneypotInteractor);
    const duplicateContentCount = account?.duplicateContentCount || 0;
    const sharedIpCount = account?.sharedIpCount || 0;

    const result = computeRiskAndTrust({
      followerCount,
      postsCount,
      followingCount,
      accountAgeDays,
      samplePost,
      isHoneypotInteractor,
      duplicateContentCount,
      sharedIpCount,
      recentPostsPerDay,
      recentFollowsPerDay
    });

    // Prepare data for saving
    const toSave = {
      accountId: accountId || username,
      username: username || accountId,
      followerCount,
      postsCount,
      followingCount,
      accountAgeDays,
      isHoneypotInteractor,
      duplicateContentCount,
      sharedIpCount,
      trustScore: result.trustScore,
      riskCategory: result.riskCategory,
      reasonCodes: result.reasonCodes,
      evidence: result.evidence,
      lastScannedAt: new Date(),
      totalScans: account ? (account.totalScans || 0) + 1 : 1
    };

    // Upsert account with latest computed trust
    account = await Account.findOneAndUpdate(
      { accountId: toSave.accountId },
      { $set: toSave },
      { upsert: true, new: true }
    );

    // Record the scan details
    const scanData = {
      scanType: 'manual',
      inputData: {
        accountId,
        username,
        follower_count,
        posts_count,
        following_count,
        account_age_days,
        sample_post
      },
      computedResult: {
        trustScore: result.trustScore,
        riskCategory: result.riskCategory,
        reasonCodes: result.reasonCodes,
        evidence: result.evidence,
        followerCount,
        postsCount,
        followingCount,
        accountAgeDays,
        recentPostsPerDay,
        recentFollowsPerDay
      },
      scannerInfo: {
        ip: clientIp,
        userAgent: userAgent,
        source: source
      }
    };

    // Add scan to history
    await Account.findOneAndUpdate(
      { accountId: toSave.accountId },
      { 
        $push: { scanHistory: scanData },
        $set: { lastScannedAt: new Date() }
      }
    );

    // Log the scan event
    await Event.create({
      accountId: toSave.accountId,
      type: 'report',
      ip: clientIp,
      meta: {
        scanType: 'manual',
        riskCategory: result.riskCategory,
        trustScore: result.trustScore,
        reasonCodes: result.reasonCodes
      }
    });

    // If non-safe, open or update a flag for admin review
    if (result.riskCategory !== 'Safe') {
      await Flag.findOneAndUpdate(
        { accountId: toSave.accountId },
        { $setOnInsert: { accountId: toSave.accountId }, $set: { reasons: result.reasonCodes, evidence: result.evidence, status: 'open' } },
        { upsert: true, new: true }
      );
      console.log(`🚨 Flagged account ${toSave.accountId} as ${result.riskCategory}`);
    }

    console.log(`✅ Scan completed for ${toSave.accountId}: ${result.riskCategory} (${result.trustScore}%)`);

    res.json({
      success: true,
      account: {
        accountId: account.accountId,
        username: account.username,
        trustScore: result.trustScore,
        riskCategory: result.riskCategory,
        reasonCodes: result.reasonCodes,
        evidence: result.evidence,
        lastScannedAt: account.lastScannedAt,
        totalScans: account.totalScans
      },
      scanDetails: {
        scannedAt: new Date(),
        inputData: scanData.inputData,
        computedResult: scanData.computedResult
      }
    });
  } catch (err) {
    console.error('❌ Scan failed:', err);
    res.status(500).json({ 
      success: false,
      error: 'Scan failed',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Basic account details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const acc = await Account.findOne({ accountId: id });
  if (!acc) return res.status(404).json({ error: 'Not found' });
  res.json(acc);
});

// Get scan history for an account
router.get('/:id/scans', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    const account = await Account.findOne({ accountId: id })
      .select('scanHistory totalScans lastScannedAt')
      .lean();
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const scanHistory = account.scanHistory
      .sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    res.json({
      accountId: id,
      totalScans: account.totalScans,
      lastScannedAt: account.lastScannedAt,
      scanHistory,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: account.scanHistory.length
      }
    });
  } catch (err) {
    console.error('Error fetching scan history:', err);
    res.status(500).json({ error: 'Failed to fetch scan history' });
  }
});

// Get all accounts with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      riskCategory, 
      minTrustScore, 
      maxTrustScore,
      sortBy = 'lastScannedAt',
      sortOrder = 'desc'
    } = req.query;
    
    const filter = {};
    if (riskCategory) filter.riskCategory = riskCategory;
    if (minTrustScore || maxTrustScore) {
      filter.trustScore = {};
      if (minTrustScore) filter.trustScore.$gte = parseInt(minTrustScore);
      if (maxTrustScore) filter.trustScore.$lte = parseInt(maxTrustScore);
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [accounts, total] = await Promise.all([
      Account.find(filter)
        .select('accountId username trustScore riskCategory reasonCodes lastScannedAt totalScans createdAt followerCount followingCount postsCount accountAgeDays')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Account.countDocuments(filter)
    ]);

    // Get report counts for all accounts
    const accountIds = accounts.map(acc => acc.accountId);
    const reportCounts = await Report.aggregate([
      { $match: { accountId: { $in: accountIds } } },
      { $group: { _id: '$accountId', count: { $sum: 1 } } }
    ]);

    // Create a map of accountId to report count
    const reportCountMap = {};
    reportCounts.forEach(item => {
      reportCountMap[item._id] = item.count;
    });

    // Add report counts to accounts
    const accountsWithReports = accounts.map(account => ({
      ...account,
      reportCount: reportCountMap[account.accountId] || 0
    }));
    
    res.json({
      accounts: accountsWithReports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

export default router;


