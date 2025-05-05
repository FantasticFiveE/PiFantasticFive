const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.Mixed, // Accepts ObjectId or String like "system"
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.Mixed, // Same here
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Message', messageSchema);
