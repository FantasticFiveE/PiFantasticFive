// routes/messages.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const mongoose = require('mongoose');

// Save message
router.post('/send', async (req, res) => {
  const { from, to, text } = req.body;

  try {
    const newMessage = new Message({
      from,
      to,
      text,
      timestamp: new Date()
    });

    await newMessage.save();
    res.status(200).json({ success: true, msg: "Message saved" });
  } catch (err) {
    console.error("❌ Error saving message:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// routes/messages.js
router.get('/history/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    // Handle case where one of the users is a non-ObjectId like "system"
    let query;

    const isUser1Valid = mongoose.Types.ObjectId.isValid(user1);
    const isUser2Valid = mongoose.Types.ObjectId.isValid(user2);

    if (user1 === "system" || user2 === "system") {
      // Find messages where one side is "system" and the other is valid user ID
      const systemPartner = user1 === "system" ? user2 : user1;

      if (!mongoose.Types.ObjectId.isValid(systemPartner)) {
        return res.status(400).json({ success: false, msg: "Invalid user ID" });
      }

      query = {
        $or: [
          { from: "system", to: systemPartner },
          { from: systemPartner, to: "system" }
        ]
      };
    } else if (isUser1Valid && isUser2Valid) {
      query = {
        $or: [
          { from: user1, to: user2 },
          { from: user2, to: user1 }
        ]
      };
    } else {
      return res.status(400).json({ success: false, msg: "Invalid user ID(s)" });
    }

    const messages = await Message.find(query).sort({ timestamp: 1 });

    res.status(200).json({ messages });
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});
// 🔄 Get all messages involving a single user (sent or received)
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, msg: "Invalid user ID" });
  }

  try {
    const messages = await Message.find({
      $or: [
        { from: userId },
        { to: userId }
      ]
    }).sort({ timestamp: 1 });

    res.status(200).json({ success: true, messages });
  } catch (err) {
    console.error("❌ Error fetching user's messages:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});


module.exports = router;