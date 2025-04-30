const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { RTCSessionDescription, RTCPeerConnection, RTCIceCandidate } = require('wrtc');
const UserModel = require('./models/user');

const activeConnections = new Map();

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

  module.exports = (io) => {
    io.on('connection', (socket) => {
      console.log('✅ Client connected:', socket.id);
  
      socket.on("notify-candidate", ({ to, message }) => {
        io.emit(`notification-${to}`, { message });
        console.log(`🔔 Notification sent to candidate ${to}: ${message}`);
      });
  
      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
      });
    });
  };
  
  // 🔐 Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await UserModel.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      };

      next();
    } catch (err) {
      console.error('Socket auth error:', err);
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.user.id);

    // 🔄 Heartbeat
    const heartbeatInterval = setInterval(() => {
      socket.emit('ping');
    }, 5000);

    socket.on('pong', () => {
      console.log('❤️ Heartbeat from:', socket.user.id);
    });

    // 🔁 Join Interview Room
    socket.on('join-interview', ({ interviewId }) => {
      if (!interviewId) {
        return socket.emit('error', 'Interview ID is required');
      }

      socket.join(interviewId);
      console.log(`👥 User ${socket.user.id} joined interview ${interviewId}`);

      socket.to(interviewId).emit('user-connected', {
        userId: socket.user.id
      });
    });

    // 📡 Offer
    socket.on('offer', async ({ interviewId, offer }) => {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
          iceCandidatePoolSize: 10
        });

        activeConnections.set(socket.user.id, pc);

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.to(interviewId).emit('ice-candidate', {
              userId: socket.user.id,
              candidate: event.candidate
            });
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.to(interviewId).emit('answer', {
          userId: socket.user.id,
          answer
        });
      } catch (err) {
        console.error('Offer handling error:', err);
        socket.emit('error', 'Failed to handle offer');
      }
    });

    // 📞 Answer
    socket.on('answer', async ({ interviewId, answer }) => {
      try {
        const pc = activeConnections.get(socket.user.id);
        if (!pc) throw new Error('Peer connection not found');
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Answer handling error:', err);
        socket.emit('error', 'Failed to handle answer');
      }
    });

    // ❄️ ICE Candidate
    socket.on('ice-candidate', async ({ interviewId, candidate }) => {
      try {
        const pc = activeConnections.get(socket.user.id);
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

      const pc = activeConnections.get(socket.user.id);
      if (pc) {
        pc.close();
        activeConnections.delete(socket.user.id);
      }

      console.log('❌ Client disconnected:', socket.user.id);
    });

    // 🧯 Error
    socket.on('error', (err) => {
      console.error('Socket error:', err.message);
    });
  });

  return io;
};

module.exports = setupSocket;
