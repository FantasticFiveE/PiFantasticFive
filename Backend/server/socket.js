const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { RTCSessionDescription, RTCPeerConnection, RTCIceCandidate } = require('wrtc');
const UserModel = require('./models/user');
const Message = require('./models/Message');

const activeConnections = new Map();
const userSockets = new Map(); // Map userId -> socket.id

const setupSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // 🔐 Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication token required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await UserModel.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      };

      userSockets.set(user._id.toString(), socket.id); // Map user to socket
      next();
    } catch (err) {
      console.error('Socket auth error:', err);
      return next(new Error('Authentication failed'));
    }
  });

  // ✅ Main connection handler
  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    console.log('✅ Client connected:', userId);

    // 🔄 Heartbeat
    const heartbeatInterval = setInterval(() => {
      socket.emit('ping');
    }, 5000);

    socket.on('pong', () => {
      console.log('❤️ Heartbeat from:', userId);
    });

    // 💬 Messaging
    socket.on('send-message', async ({ to, from, content }) => {
      const newMessage = new Message({
        from,
        to,
        text: content,
        timestamp: new Date()
      });
    
      await newMessage.save(); // save to MongoDB
    
      const recipientSocketId = userSockets.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive-message', {
          from,
          content,
          timestamp: newMessage.timestamp
        });
      } else {
        console.warn(`⚠️ No active socket found for recipient ${to}`);
      }
    });
    

    socket.on("notify-candidate", ({ to, message }) => {
      const recipientSocketId = userSockets.get(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit(`notification-${to}`, { message });
        console.log(`🔔 Notification sent to candidate ${to}: ${message}`);
      }
    });

    // 🎥 WebRTC Interview Setup
    socket.on('join-interview', ({ interviewId }) => {
      if (!interviewId) return socket.emit('error', 'Interview ID is required');

      socket.join(interviewId);
      console.log(`👥 User ${userId} joined interview ${interviewId}`);
      socket.to(interviewId).emit('user-connected', { userId });
    });

    socket.on('offer', async ({ interviewId, offer }) => {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
          iceCandidatePoolSize: 10
        });

        activeConnections.set(userId, pc);

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.to(interviewId).emit('ice-candidate', {
              userId,
              candidate: event.candidate
            });
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.to(interviewId).emit('answer', {
          userId,
          answer
        });
      } catch (err) {
        console.error('Offer handling error:', err);
        socket.emit('error', 'Failed to handle offer');
      }
    });

    socket.on('answer', async ({ interviewId, answer }) => {
      try {
        const pc = activeConnections.get(userId);
        if (!pc) throw new Error('Peer connection not found');
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Answer handling error:', err);
        socket.emit('error', 'Failed to handle answer');
      }
    });

    socket.on('ice-candidate', async ({ interviewId, candidate }) => {
      try {
        const pc = activeConnections.get(userId);
        if (!pc) throw new Error('Peer connection not found');
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('ICE candidate error:', err);
        socket.emit('error', 'Failed to handle ICE candidate');
      }
    });

    // 🔌 Disconnect
    socket.on('disconnect', () => {
      clearInterval(heartbeatInterval);
      const pc = activeConnections.get(userId);
      if (pc) {
        pc.close();
        activeConnections.delete(userId);
      }
      userSockets.delete(userId);
      console.log('❌ Client disconnected:', userId);
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err.message);
    });
  });

  return io;
};

module.exports = setupSocket;
