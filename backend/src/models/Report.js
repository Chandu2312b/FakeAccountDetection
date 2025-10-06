import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema(
  {
    accountId: { type: String, index: true, required: true },
    reportedBy: { type: String, required: true },
    reason: { 
      type: String, 
      enum: [
        'spam content',
        'bot-like behaviour', 
        'fake-followers',
        'impersonation',
        'harassment',
        'suspicious activity',
        'misleading behaviour',
        'other'
      ],
      required: true 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      default: 'medium' 
    },
    description: { type: String, required: true },
    evidence: [{
      type: { 
        type: String, 
        enum: ['screenshot_url', 'post_content', 'pattern_observation', 'other'] 
      },
      content: String,
      url: String
    }],
    location: {
      country: String,
      region: String,
      city: String,
      ll: [Number] // [lat, lon]
    },
    ip: { type: String },
    userAgent: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'under_review', 'resolved', 'dismissed'], 
      default: 'pending' 
    },
    adminNotes: { type: String },
    resolvedAt: { type: Date },
    resolvedBy: { type: String }
  },
  { timestamps: true }
);

// Add indexes for better query performance
ReportSchema.index({ accountId: 1, createdAt: -1 });
ReportSchema.index({ status: 1, priority: 1 });
ReportSchema.index({ 'location.ll': '2dsphere' });

export default mongoose.model('Report', ReportSchema);



