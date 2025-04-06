import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import './VideoCall.css';

const VideoCall = () => {
    const { interviewId } = useParams();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [status, setStatus] = useState('loading');
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isPeerConnected, setIsPeerConnected] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [initialized, setInitialized] = useState(false);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const socketRef = useRef(null);
    const pcRef = useRef(null);

    // Enhanced role detection
    useEffect(() => {
        if (authLoading) return;

        console.log("Checking for user role...");
        console.log("LocalStorage contents:");
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            console.log(`${key}: ${localStorage.getItem(key)}`);
        }

        const determineRole = () => {
            // 1. Check primary localStorage key
            const explicitRole = localStorage.getItem('role');
            if (explicitRole) {
                console.log("Using explicit role from localStorage:", explicitRole);
                return explicitRole;
            }

            // 2. Check auth context
            if (user?.role) {
                console.log("Using role from auth context:", user.role);
                return user.role;
            }

            // 3. Check legacy localStorage key
            const storedRole = localStorage.getItem('userRole');
            if (storedRole) {
                console.log("Using legacy userRole from localStorage:", storedRole);
                return storedRole;
            }

            // 4. Decode from token
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    console.log("Decoded role from token:", decoded.role);
                    return decoded.role || 'CANDIDATE';
                } catch (error) {
                    console.error('Token decode error:', error);
                }
            }

            console.warn("No role found, defaulting to CANDIDATE");
            return 'CANDIDATE';
        };

        const role = determineRole();
        console.log("Final determined role:", role);
        setUserRole(role);
        setInitialized(true);
    }, [user, authLoading]);

    // WebRTC and Socket.io implementation
    useEffect(() => {
        if (!initialized) return;

        const init = async () => {
            try {
                setStatus('loading');
                
                // 1. Get media stream
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: true
                });
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // 2. Connect to signaling server
                socketRef.current = io('http://localhost:3001', {
                    auth: { token: localStorage.getItem('token') },
                    transports: ['websocket']
                });

                // 3. Create peer connection
                pcRef.current = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' }
                    ],
                    iceCandidatePoolSize: 10
                });

                // Add local stream to connection
                stream.getTracks().forEach(track => {
                    pcRef.current.addTrack(track, stream);
                });

                // Setup event handlers
                pcRef.current.ontrack = (event) => {
                    if (!remoteVideoRef.current.srcObject) {
                        setRemoteStream(event.streams[0]);
                        remoteVideoRef.current.srcObject = event.streams[0];
                        setIsPeerConnected(true);
                    }
                };

                pcRef.current.onicecandidate = (event) => {
                    if (event.candidate) {
                        socketRef.current.emit('ice-candidate', {
                            interviewId,
                            candidate: event.candidate
                        });
                    }
                };

                pcRef.current.oniceconnectionstatechange = () => {
                    if (pcRef.current.iceConnectionState === 'connected') {
                        setIsPeerConnected(true);
                    } else if (pcRef.current.iceConnectionState === 'disconnected') {
                        setStatus('disconnected');
                        setIsPeerConnected(false);
                    }
                };

                // Socket event handlers
                socketRef.current.on('offer', handleOffer);
                socketRef.current.on('answer', handleAnswer);
                socketRef.current.on('ice-candidate', handleICECandidate);
                socketRef.current.on('user-connected', (userId) => {
                    console.log('User connected:', userId);
                });
                socketRef.current.on('user-disconnected', () => {
                    setStatus('peer-disconnected');
                    setIsPeerConnected(false);
                });
                socketRef.current.on('peer-connected', () => {
                    setIsPeerConnected(true);
                });

                setStatus('ready');
                
            } catch (err) {
                console.error('Initialization error:', err);
                setStatus('error');
            }
        };

        init();

        return () => {
            if (pcRef.current) pcRef.current.close();
            if (socketRef.current) socketRef.current.disconnect();
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [initialized, interviewId]);

    const startCall = async () => {
        setStatus('connecting');
        try {
            socketRef.current.emit('join-interview', { interviewId });
            
            if (userRole === 'ENTERPRISE') {
                const offer = await pcRef.current.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });
                await pcRef.current.setLocalDescription(offer);
                socketRef.current.emit('offer', { interviewId, offer });
            }
            
            setStatus('connected');
        } catch (err) {
            console.error('Call start error:', err);
            setStatus('error');
        }
    };

    const handleOffer = async ({ offer }) => {
        try {
            if (userRole === 'CANDIDATE') {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pcRef.current.createAnswer();
                await pcRef.current.setLocalDescription(answer);
                socketRef.current.emit('answer', { interviewId, answer });
                socketRef.current.emit('peer-connected', { interviewId });
            }
        } catch (err) {
            console.error('Error handling offer:', err);
        }
    };

    const handleAnswer = async ({ answer }) => {
        try {
            if (userRole === 'ENTERPRISE') {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                socketRef.current.emit('peer-connected', { interviewId });
            }
        } catch (err) {
            console.error('Error handling answer:', err);
        }
    };

    const handleICECandidate = async ({ candidate }) => {
        try {
            if (candidate) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (err) {
            console.error('Error adding ICE candidate:', err);
        }
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    const endCall = () => {
        if (pcRef.current) pcRef.current.close();
        if (socketRef.current) {
            socketRef.current.emit('leave-interview', { interviewId });
        }
        setStatus('disconnected');
        setIsPeerConnected(false);
    };

    if (!initialized || authLoading) {
        return <div className="loading-container">Loading user session...</div>;
    }

    return (
        <div className="video-call-container">
            <h1 className="call-title">
                {userRole === 'ENTERPRISE' ? 'Interview Session (Recruiter)' : 'Interview Session (Candidate)'}
            </h1>
            <div className="status-badge">
                Status: <span className={`status ${status.replace(' ', '-')}`}>
                    {status}
                    {status === 'connected' && !isPeerConnected && ' (negotiating)'}
                </span>
            </div>

            <div className="video-grid">
                <div className="video-container local-video">
                    <div className="video-overlay">
                        <h3>You ({user?.name || 'User'}) - {userRole}</h3>
                        <div className="video-controls">
                            <button onClick={toggleMute} className="control-btn">
                                {isMuted ? '🔇' : '🎤'}
                            </button>
                            <button onClick={toggleVideo} className="control-btn">
                                {isVideoOff ? '📷 Off' : '📷 On'}
                            </button>
                        </div>
                    </div>
                    <video 
                        ref={localVideoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                        className={isVideoOff ? 'video-off' : ''}
                    />
                </div>

                <div className="video-container remote-video">
                    <div className="video-overlay">
                        <h3>{userRole === 'ENTERPRISE' ? 'Candidate' : 'Interviewer'}</h3>
                        {!isPeerConnected && status === 'connected' && (
                            <div className="waiting-connection">
                                Waiting for connection...
                            </div>
                        )}
                    </div>
                    <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline 
                        className={!isPeerConnected ? 'video-off' : ''}
                    />
                </div>
            </div>

            <div className="call-controls">
                {status === 'ready' && (
                    <button 
                        onClick={startCall} 
                        className="control-btn primary"
                        data-testid="start-call-button"
                    >
                        {userRole === 'ENTERPRISE' ? 'Start Interview' : 'Join Interview'}
                    </button>
                )}
                
                {(status === 'connected' || status === 'connection-timeout') && (
                    <button 
                        onClick={endCall} 
                        className="control-btn danger"
                    >
                        End Call
                    </button>
                )}
                
                {(status === 'error' || status === 'disconnected') && (
                    <button 
                        onClick={() => window.location.reload()} 
                        className="control-btn"
                    >
                        Retry
                    </button>
                )}
            </div>
        </div>
    );
};
console.log('Current token:', localStorage.getItem('token'));

export default VideoCall;