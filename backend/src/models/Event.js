import mongoose from 'mongoose';

// Stores login/activity events for analytics and rate heuristics
const EventSchema = new mongoose.Schema(
  {
    accountId: { type: String, index: true, required: true },
    type: { type: String, enum: ['login', 'post', 'follow', 'report'], required: true },
    ip: { type: String },
    location: {
      country: String,
      region: String,
      city: String,
      ll: [Number] // [lat, lon]
    },
    meta: { type: Object, default: {} },
    happenedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('Event', EventSchema);



