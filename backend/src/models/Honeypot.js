import mongoose from 'mongoose';

const HoneypotSchema = new mongoose.Schema(
  {
    baitId: { type: String, unique: true, index: true },
    description: String
  },
  { timestamps: true }
);

export default mongoose.model('Honeypot', HoneypotSchema);



