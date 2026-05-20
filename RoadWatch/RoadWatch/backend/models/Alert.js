const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'emergency'],
    default: 'info'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Automatically delete alert after 24 hours (86400 seconds)
  }
});

module.exports = mongoose.model('Alert', AlertSchema);
