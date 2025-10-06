import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema(
  {
    accountId: { type: String, required: true, unique: true, index: true },
    username: { type: String, index: true },
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },
    accountAgeDays: { type: Number, default: 0 },
    lastActiveAt: { type: Date },
    isHoneypotInteractor: { type: Boolean, default: false },
    duplicateContentCount: { type: Number, default: 0 },
    sharedIpCount: { type: Number, default: 0 },
    // Cached trust score for faster dashboards
    trustScore: { type: Number, default: 100 },
    riskCategory: { type: String, enum: ['Safe', 'Suspicious', 'High Risk'], default: 'Safe' },
    reasonCodes: [{ type: String }],
    evidence: { type: Object, default: {} },
    // Enhanced tracking for manual scans
    scanHistory: [{
      scannedAt: { type: Date, default: Date.now },
      scanType: { type: String, enum: ['manual', 'automatic', 'bulk'], default: 'manual' },
      inputData: { type: Object }, // Store the original input data
      computedResult: { type: Object }, // Store the computed result
      scannerInfo: {
        ip: String,
        userAgent: String,
        source: String // e.g., 'web_interface', 'api', 'bulk_upload'
      }
    }],
    // Additional metadata
    lastScannedAt: { type: Date, default: Date.now },
    totalScans: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true }
  },
  { 
    timestamps: true,
    // Add indexes for better query performance
    indexes: [
      { accountId: 1 },
      { username: 1 },
      { riskCategory: 1 },
      { trustScore: 1 },
      { lastScannedAt: -1 },
      { createdAt: -1 }
    ]
  }
);

// Add a method to record a new scan
AccountSchema.methods.recordScan = function(scanData) {
  this.scanHistory.push({
    scannedAt: new Date(),
    scanType: scanData.scanType || 'manual',
    inputData: scanData.inputData || {},
    computedResult: scanData.computedResult || {},
    scannerInfo: scanData.scannerInfo || {}
  });
  
  this.lastScannedAt = new Date();
  this.totalScans = (this.totalScans || 0) + 1;
  
  return this.save();
};

export default mongoose.model('Account', AccountSchema);



