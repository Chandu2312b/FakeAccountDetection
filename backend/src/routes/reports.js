import { Router } from 'express';
import Report from '../models/Report.js';
import Event from '../models/Event.js';

const router = Router();

// POST /api/reports/submit
// Submit a new account report with geo-location tracking
router.post('/submit', async (req, res) => {
  try {
    const {
      accountId,
      reportedBy,
      reason,
      priority = 'medium',
      description,
      evidence = []
    } = req.body;

    // Validate required fields
    if (!accountId || !reportedBy || !reason || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields: accountId, reportedBy, reason, and description are required' 
      });
    }

    // Get client information for tracking
    const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    // Get geo-location from request (if available from IP geolocation service)
    let location = null;
    if (req.headers['x-geo-location']) {
      try {
        location = JSON.parse(req.headers['x-geo-location']);
      } catch (e) {
        console.warn('Invalid geo-location header:', e.message);
      }
    }

    // Create the report
    const report = new Report({
      accountId,
      reportedBy,
      reason,
      priority,
      description,
      evidence,
      location,
      ip: clientIp,
      userAgent
    });

    await report.save();

    // Log the report event for analytics
    await Event.create({
      accountId,
      type: 'report',
      ip: clientIp,
      location,
      meta: {
        reportId: report._id,
        reason,
        priority,
        reportedBy
      }
    });

    console.log(`📝 New report submitted for account ${accountId} by ${reportedBy}: ${reason}`);

    res.json({
      success: true,
      reportId: report._id,
      message: 'Report submitted successfully. Thank you for helping maintain platform integrity.',
      warning: 'False reports may result in penalties. Please ensure your report is accurate and well-documented.'
    });

  } catch (error) {
    console.error('❌ Report submission failed:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit report',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/reports/pending
// Get pending reports for admin review
router.get('/pending', async (req, res) => {
  try {
    const { limit = 50, priority } = req.query;
    
    const filter = { status: 'pending' };
    if (priority) {
      filter.priority = priority;
    }

    const reports = await Report.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .select('-ip -userAgent'); // Exclude sensitive info

    res.json({
      success: true,
      reports,
      count: reports.length
    });

  } catch (error) {
    console.error('❌ Failed to fetch pending reports:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch reports'
    });
  }
});

// PUT /api/reports/:id/status
// Update report status (admin only)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, resolvedBy } = req.body;

    if (!['pending', 'under_review', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = { status };
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (resolvedBy) updateData.resolvedBy = resolvedBy;
    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolvedAt = new Date();
    }

    const report = await Report.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('❌ Failed to update report status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update report'
    });
  }
});

// GET /api/reports/stats
// Get report statistics for analytics
router.get('/stats', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    const [
      totalReports,
      pendingReports,
      resolvedReports,
      reportsByReason,
      reportsByPriority,
      reportsByLocation
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
      ])
    ]);

    res.json({
      success: true,
      stats: {
        total: totalReports,
        pending: pendingReports,
        resolved: resolvedReports,
        byReason: reportsByReason,
        byPriority: reportsByPriority,
        byLocation: reportsByLocation
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch report stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch report statistics'
    });
  }
});

// GET /api/reports/count/:accountId
// Get report count for a specific account
router.get('/count/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const count = await Report.countDocuments({ accountId });
    
    res.json({
      success: true,
      accountId,
      reportCount: count
    });

  } catch (error) {
    console.error('❌ Failed to get report count:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get report count'
    });
  }
});

export default router;
