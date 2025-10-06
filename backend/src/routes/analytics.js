import { Router } from 'express';
import Event from '../models/Event.js';
import Report from '../models/Report.js';
import Account from '../models/Account.js';

const router = Router();

// GET /api/analytics/daily?days=30
router.get('/daily', async (req, res) => {
  const days = Math.min(parseInt(req.query.days || '30', 10), 90);
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  // Count high risk detections per day using account updates
  const pipeline = [
    { $match: { updatedAt: { $gte: since }, riskCategory: { $in: ['Suspicious', 'High Risk'] } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ];
  const data = await Account.aggregate(pipeline);
  res.json(data.map(d => ({ date: d._id, count: d.count })));
});

// GET /api/analytics/top-reported?limit=10
router.get('/top-reported', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
  const pipeline = [
    { $group: { _id: '$accountId', reports: { $sum: 1 } } },
    { $sort: { reports: -1 } },
    { $limit: limit }
  ];
  const data = await Report.aggregate(pipeline);
  res.json(data.map(d => ({ accountId: d._id, reports: d.reports })));
});

// GET /api/analytics/geo
router.get('/geo', async (_req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const events = await Event.find({ happenedAt: { $gte: since }, type: 'login' })
    .select('accountId location happenedAt')
    .limit(2000);
  const markers = events
    .filter(e => e.location && Array.isArray(e.location.ll) && e.location.ll.length === 2)
    .map(e => ({
      accountId: e.accountId,
      lat: e.location.ll[0],
      lon: e.location.ll[1],
      city: e.location.city,
      country: e.location.country,
      happenedAt: e.happenedAt
    }));
  res.json(markers);
});

// GET /api/analytics/summary
router.get('/summary', async (_req, res) => {
  try {
    const [
      totalAccounts,
      safeAccounts,
      suspiciousAccounts,
      highRiskAccounts,
      totalScans,
      recentScans,
      topCountries
    ] = await Promise.all([
      Account.countDocuments(),
      Account.countDocuments({ riskCategory: 'Safe' }),
      Account.countDocuments({ riskCategory: 'Suspicious' }),
      Account.countDocuments({ riskCategory: 'High Risk' }),
      Account.aggregate([{ $group: { _id: null, total: { $sum: '$totalScans' } } }]),
      Account.countDocuments({ lastScannedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Event.aggregate([
        { $match: { location: { $exists: true }, "location.country": { $exists: true } } },
        { $group: { _id: '$location.country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    const totalScansCount = totalScans[0]?.total || 0;

    res.json({
      accounts: {
        total: totalAccounts,
        safe: safeAccounts,
        suspicious: suspiciousAccounts,
        highRisk: highRiskAccounts
      },
      scans: {
        total: totalScansCount,
        recent: recentScans
      },
      topCountries: topCountries.map(c => ({ country: c._id, count: c.count }))
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

// GET /api/analytics/reports
// Get report analytics and statistics
router.get('/reports', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    const [
      totalReports,
      pendingReports,
      resolvedReports,
      reportsByReason,
      reportsByPriority,
      reportsByLocation,
      recentReports
    ] = await Promise.all([
      Report.countDocuments({ createdAt: { $gte: since } }),
      Report.countDocuments({ status: 'pending', createdAt: { $gte: since } }),
      Report.countDocuments({ status: 'resolved', createdAt: { $gte: since } }),
      Report.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$reason', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Report.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Report.aggregate([
        { $match: { createdAt: { $gte: since }, location: { $exists: true } } },
        { $group: { _id: '$location.country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Report.find({ createdAt: { $gte: since } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('accountId reason priority status createdAt')
    ]);

    res.json({
      success: true,
      reports: {
        total: totalReports,
        pending: pendingReports,
        resolved: resolvedReports,
        byReason: reportsByReason,
        byPriority: reportsByPriority,
        byLocation: reportsByLocation,
        recent: recentReports
      }
    });

  } catch (error) {
    console.error('Error fetching report analytics:', error);
    res.status(500).json({ error: 'Failed to fetch report analytics' });
  }
});

// GET /api/analytics/reports/geo
// Get report submissions with geo-location data for mapping
router.get('/reports/geo', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    const reports = await Report.find({
      createdAt: { $gte: since },
      location: { $exists: true },
      'location.ll': { $exists: true, $ne: null }
    })
    .select('accountId reason priority status location createdAt')
    .limit(1000);

    const markers = reports
      .filter(r => r.location && Array.isArray(r.location.ll) && r.location.ll.length === 2)
      .map(r => ({
        accountId: r.accountId,
        lat: r.location.ll[0],
        lon: r.location.ll[1],
        city: r.location.city,
        country: r.location.country,
        reason: r.reason,
        priority: r.priority,
        status: r.status,
        createdAt: r.createdAt
      }));

    res.json({
      success: true,
      markers,
      count: markers.length
    });

  } catch (error) {
    console.error('Error fetching report geo data:', error);
    res.status(500).json({ error: 'Failed to fetch report geo data' });
  }
});

export default router;



