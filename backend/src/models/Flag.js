import mongoose from 'mongoose';

const FlagSchema = new mongoose.Schema(
  {
    accountId: { type: String, index: true, required: true },
    status: { type: String, enum: ['open', 'banned', 'restored', 'ignored'], default: 'open' },
    reasons: [{ type: String }],
    evidence: { type: Object, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model('Flag', FlagSchema);



