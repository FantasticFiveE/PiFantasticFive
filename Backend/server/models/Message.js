const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderName: String,
  subject: String,
  message: String,
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // assuming users are stored in a "User" model
  },
  timestamp: Date
});

module.exports = mongoose.model('Message', messageSchema);
