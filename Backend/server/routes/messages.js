const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const mongoose = require('mongoose');

router.post('/send', async (req, res) => {
  const { senderName, subject, message, candidateId } = req.body;

  try {
    const newMessage = new Message({
      senderName,
      subject,
      message,
      candidateId,
      timestamp: new Date()
    });
    await newMessage.save();
    res.status(200).json({ success: true, msg: "Message saved" });
  } catch (err) {
    console.error("❌ Error saving message:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

router.get('/:candidateId', async (req, res) => {
    try {
      const candidateObjectId = new mongoose.Types.ObjectId(req.params.candidateId);
      const messages = await Message.find({ candidateId: candidateObjectId }).sort({ timestamp: -1 });
      res.status(200).json(messages);
    } catch (err) {
      console.error("❌ Error fetching messages:", err);
      res.status(500).json({ success: false });
    }
  });
  
module.exports = router;
