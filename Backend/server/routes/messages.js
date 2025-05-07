const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const mongoose = require('mongoose');
const User = require('../models/user');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Ensure bot user exists
const ensureBotUser = async () => {
  try {
    if (!User || typeof User.findOne !== 'function') {
      throw new Error('User model is not properly defined');
    }
    const botUser = await User.findOne({ _id: 'bot' });
    if (!botUser) {
      await User.create({
        _id: 'bot',
        name: 'NextBot Assistant',
        email: 'bot@nexthire.com',
        role: 'BOT',
        picture: '/images/bot-avatar.png'
      });
      console.log('✅ Bot user created');
    }
  } catch (err) {
    console.error('❌ Error creating bot user:', err.message);
  }
};

// Call this when the server starts
ensureBotUser();

// Save message
router.post('/send', async (req, res) => {
  const { from, to, text } = req.body;

  try {
    const messageId = uuidv4();
    const newMessage = new Message({
      messageId,
      from,
      to,
      text,
      timestamp: new Date()
    });

    await newMessage.save();
    console.log(`✅ Message saved: ${messageId}`);
    res.status(200).json({ success: true, msg: "Message saved", messageId });
  } catch (err) {
    console.error("❌ Error saving message:", err.message);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// Get message history between two users
router.get('/history/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;

  const allowedSpecialUsers = ['system', 'bot'];

  const isUser1Special = allowedSpecialUsers.includes(user1);
  const isUser2Special = allowedSpecialUsers.includes(user2);

  const isUser1Valid = mongoose.Types.ObjectId.isValid(user1);
  const isUser2Valid = mongoose.Types.ObjectId.isValid(user2);

  try {
    let query;

    if ((isUser1Special && isUser2Valid) || (isUser2Special && isUser1Valid)) {
      const special = isUser1Special ? user1 : user2;
      const regular = isUser1Special ? user2 : user1;

      query = {
        $or: [
          { from: special, to: regular },
          { from: regular, to: special }
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
    console.log(`✅ Fetched history for ${user1} and ${user2}`);
    res.status(200).json({ messages });
  } catch (err) {
    console.error("❌ Error fetching messages:", err.message);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// Get all messages involving a single user
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

    console.log(`✅ Fetched messages for user ${userId}`);
    res.status(200).json({ success: true, messages });
  } catch (err) {
    console.error("❌ Error fetching user's messages:", err.message);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// Bot interaction with Gemini
router.post('/bot/interaction', async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ success: false, msg: "User ID and message are required" });
  }

  try {
    // Fetch user context with error handling
    let userContext = '';
    try {
      if (!User || typeof User.findById !== 'function') {
        throw new Error('User model is not properly defined');
      }
      const user = await User.findById(userId).select('profile role');
      userContext = user ? `
        User Role: ${user.role}
        Skills: ${user.profile?.skills?.join(', ') || 'None'}
        Experience: ${user.profile?.experience?.map(exp => exp.title).join(', ') || 'None'}
      ` : 'User Context: Not available';
    } catch (userErr) {
      console.error('❌ Error fetching user context:', userErr.message);
      userContext = 'User Context: Not available due to server issue';
    }

    // Fetch recent messages
    const recentMessages = await Message.find({
      $or: [{ from: userId, to: 'bot' }, { from: 'bot', to: userId }],
    })
      .sort({ timestamp: -1 })
      .limit(5);
    const messageContext = recentMessages
      .map(msg => `${msg.from === userId ? 'User' : 'Bot'}: ${msg.text}`)
      .join('\n');

    // Define the prompt for Gemini
    const prompt = `
      You are NextBot, a professional AI assistant for NextHire, a job recruitment platform. Your role is to assist users with job-related queries in a clear, professional, and friendly manner. Use the following context to tailor your response:

      User Context:
      ${userContext}

      Recent Conversation:
      ${messageContext}

      User message: "${message}"

      Respond in a professional tone, keeping the response under 150 words. If the user greets you (e.g., "hello", "hi"), introduce yourself briefly and offer job-related assistance.
    `;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();

    // Save bot response to database
    const botMessageId = uuidv4();
    const botMessage = new Message({
      messageId: botMessageId,
      from: 'bot',
      to: userId,
      text: reply,
      timestamp: new Date()
    });
    await botMessage.save();
    console.log(`✅ Bot message saved: ${botMessageId}`);

    // Emit bot response via socket
    const io = req.app.get('socketio');
    const userSockets = require('../utils/socketMap');
    const recipientSocket = userSockets.get(userId);
    if (recipientSocket && io) {
      io.to(recipientSocket).emit('receive-message', {
        messageId: botMessageId,
        from: 'bot',
        to: userId,
        text: reply,
        timestamp: botMessage.timestamp
      });
      console.log(`✅ Emitted bot message: ${botMessageId}`);
    }

    res.status(200).json({ success: true, reply, messageId: botMessageId });
  } catch (err) {
    console.error("Bot interaction error:", err.message);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// Send a bot message to a specific user
router.post('/bot-message', async (req, res) => {
  const { to, text, messageId } = req.body;

  try {
    // Check if message already exists
    if (messageId) {
      const existingMessage = await Message.findOne({ messageId });
      if (existingMessage) {
        console.log(`✅ Message ${messageId} already exists, skipping save`);
        return res.status(200).json({ success: true, msg: "Message already processed" });
      }
    }

    const newMessageId = messageId || uuidv4();
    const newMessage = new Message({
      messageId: newMessageId,
      from: 'bot',
      to,
      text,
      timestamp: new Date()
    });

    await newMessage.save();
    console.log(`✅ Bot message saved: ${newMessageId}`);

    // Emit via socket if user is online
    const io = req.app.get('socketio');
    const userSockets = require('../utils/socketMap');
    const recipientSocket = userSockets.get(to);

    if (recipientSocket && io) {
      io.to(recipientSocket).emit('receive-message', {
        messageId: newMessageId,
        from: 'bot',
        to,
        text,
        timestamp: newMessage.timestamp
      });
      console.log(`✅ Emitted bot message: ${newMessageId}`);
    }

    res.status(200).json({ success: true, msg: "Bot message sent", messageId: newMessageId });
  } catch (err) {
    console.error("❌ Bot message error:", err.message);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

module.exports = router;