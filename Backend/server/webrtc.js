const { RTCSessionDescription, RTCPeerConnection } = require('wrtc');

const activeCalls = new Map();

function createPeerConnection(userId) {
    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // Add your TURN server config here
        ],
        iceCandidatePoolSize: 10
    });

    // Store connection
    activeCalls.set(userId, pc);

    // Cleanup on disconnect
    pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected') {
            activeCalls.delete(userId);
        }
    };

    return pc;
}

module.exports = {
    handleOffer: async(userId, offer) => {
        try {
            const pc = createPeerConnection(userId);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            return answer;
        } catch (err) {
            console.error('Offer handling error:', err);
            throw err;
        }
    },

    handleAnswer: async(userId, answer) => {
        try {
            const pc = activeCalls.get(userId);
            if (!pc) throw new Error('Peer connection not found');
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
            console.error('Answer handling error:', err);
            throw err;
        }
    },

    addICECandidate: async(userId, candidate) => {
        try {
            const pc = activeCalls.get(userId);
            if (!pc) throw new Error('Peer connection not found');
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.error('ICE candidate error:', err);
            throw err;
        }
    }
};