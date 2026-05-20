const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  locationDesc: {
    type: String
  },
  location: {
    lat: { type: String },
    lng: { type: String }
  },
  aiAnalysis: {
    damage_score: { type: Number },
    severity: { type: String }
  },
  status: {
    type: String,
    enum: ['open', 'in progress', 'resolved', 'rejected', 'scheduled', 'cancelled'],
    default: 'open'
  },
  resolvedAt: {
    type: Date
  },
  imageUrl: {
    type: String
  },
  adminComments: {
    type: String
  }
}, { timestamps: true });

// Partial TTL Index: Automatically delete documents exactly 30 days (2592000 seconds) after they are updated IF status is 'resolved'
ComplaintSchema.index(
  { updatedAt: 1 }, 
  { 
    expireAfterSeconds: 2592000, 
    partialFilterExpression: { status: 'resolved' } 
  }
);

module.exports = mongoose.model('Complaint', ComplaintSchema);
