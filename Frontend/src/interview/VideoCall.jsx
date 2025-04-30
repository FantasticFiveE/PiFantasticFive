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
    const [callTime, setCallTime] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeVideo, setActiveVideo] = useState(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [interviewSummary, setInterviewSummary] = useState(null);
    const [transcript, setTranscript] = useState([]);
    const [isRecording, setIsRecording] = useState(false);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const socketRef = useRef(null);
    const pcRef = useRef(null);
    const callTimerRef = useRef(null);
    const videoGridRef = useRef(null);
    const speechRecognitionRef = useRef(null);

    // Role detection
    useEffect(() => {
        if (authLoading) return;

        const determineRole = () => {
            const explicitRole = localStorage.getItem('role');
            if (explicitRole) return explicitRole;

            if (user?.role) return user.role;

            const storedRole = localStorage.getItem('userRole');
            if (storedRole) return storedRole;

            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    return decoded.role || 'CANDIDATE';
                } catch (error) {
                    console.error('Token decode error:', error);
                }
            }

            return 'CANDIDATE';
        };

        const role = determineRole();
        setUserRole(role);
        setInitialized(true);
    }, [user, authLoading]);

    // Timer effect
    useEffect(() => {
        if (status === 'connected') {
            callTimerRef.current = setInterval(() => {
                setCallTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(callTimerRef.current);
        }

        return () => clearInterval(callTimerRef.current);
    }, [status]);

    // Initialize speech recognition
    const initSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const newTranscript = [];
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        newTranscript.push({
                            speaker: userRole === 'ENTERPRISE' ? 'Interviewer' : 'Candidate',
                            text: event.results[i][0].transcript,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
                setTranscript(prev => [...prev, ...newTranscript]);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
            };

            speechRecognitionRef.current = recognition;
        }
    };

    // Toggle transcription
    const toggleTranscription = () => {
        if (isRecording) {
            speechRecognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            if (!speechRecognitionRef.current) {
                initSpeechRecognition();
            }
            speechRecognitionRef.current?.start();
            setIsRecording(true);
        }
    };

    // Generate AI summary
    const generateSummary = async () => {
        setIsSummarizing(true);
        try {
            const response = await fetch('http://localhost:3001/api/interviews/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    interviewId,
                    transcript,
                    userId: user?._id
                })
            });

            const data = await response.json();
            setInterviewSummary(data.summary);
        } catch (error) {
            console.error("Summary generation failed:", error);
        } finally {
            setIsSummarizing(false);
        }
    };

    // WebRTC and Socket.io implementation
    useEffect(() => {
        if (!initialized) return;

        const init = async () => {
            try {
                setStatus('loading');
                
                // Get media stream
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: true
                });
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // Connect to signaling server
                socketRef.current = io('http://localhost:3001', {
                    auth: { token: localStorage.getItem('token') },
                    transports: ['websocket']
                });

                // Create peer connection
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
            if (speechRecognitionRef.current) {
                speechRecognitionRef.current.stop();
            }
            clearInterval(callTimerRef.current);
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
        setCallTime(0);
    };

    const toggleFullscreen = (video) => {
        if (video === 'local') {
            if (!isFullscreen) {
                localVideoRef.current.requestFullscreen().catch(err => {
                    console.error('Error attempting to enable fullscreen:', err);
                });
            } else {
                document.exitFullscreen();
            }
            setActiveVideo('local');
        } else {
            if (!isFullscreen) {
                remoteVideoRef.current.requestFullscreen().catch(err => {
                    console.error('Error attempting to enable fullscreen:', err);
                });
            } else {
                document.exitFullscreen();
            }
            setActiveVideo('remote');
        }
        setIsFullscreen(!isFullscreen);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!initialized || authLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading user session...</p>
            </div>
        );
    }

    return (
        <div className={`video-call-container ${isFullscreen ? 'fullscreen' : ''}`}>
            <div className="call-header">
                <div className="header-left">
                    <h1 className="call-title">
                        {userRole === 'ENTERPRISE' ? 'Interview Session' : 'Interview Session'}
                    </h1>
                    <div className="call-info">
                        <span className="call-id">ID: {interviewId}</span>
                        <span className="call-role">{userRole === 'ENTERPRISE' ? 'Recruiter' : 'Candidate'}</span>
                    </div>
                </div>
                <div className="header-right">
                    <div className={`status-badge ${status.replace(' ', '-')}`}>
                        {status === 'connected' ? formatTime(callTime) : status}
                    </div>
                </div>
            </div>

            <div className="video-grid" ref={videoGridRef}>
                <div className={`video-container local-video ${isFullscreen && activeVideo === 'local' ? 'fullscreen-video' : ''}`}>
                    <div className="video-overlay">
                        <div className="user-info">
                            <div className="user-name">{user?.name || 'You'}</div>
                            <div className="user-status">
                                {isMuted ? 'Muted' : 'Unmuted'} • {isVideoOff ? 'Camera Off' : 'Camera On'}
                            </div>
                        </div>
                        <div className="video-controls">
                            <button onClick={toggleMute} className={`control-btn ${isMuted ? 'muted' : ''}`}>
                                <i className={`icon-${isMuted ? 'mic-off' : 'mic'}`}></i>
                            </button>
                            <button onClick={toggleVideo} className={`control-btn ${isVideoOff ? 'disabled' : ''}`}>
                                <i className={`icon-${isVideoOff ? 'video-off' : 'video'}`}></i>
                            </button>
                            <button 
                                onClick={() => toggleFullscreen('local')} 
                                className="control-btn"
                            >
                                <i className={`icon-${isFullscreen && activeVideo === 'local' ? 'minimize' : 'maximize'}`}></i>
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

                <div className={`video-container remote-video ${isFullscreen && activeVideo === 'remote' ? 'fullscreen-video' : ''}`}>
                    <div className="video-overlay">
                        <div className="user-info">
                            <div className="user-name">
                                {userRole === 'ENTERPRISE' ? 'Candidate' : 'Interviewer'}
                            </div>
                            <div className="user-status">
                                {isPeerConnected ? 'Connected' : 'Connecting...'}
                            </div>
                        </div>
                        <div className="video-controls">
                            <button 
                                onClick={() => toggleFullscreen('remote')} 
                                className="control-btn"
                            >
                                <i className={`icon-${isFullscreen && activeVideo === 'remote' ? 'minimize' : 'maximize'}`}></i>
                            </button>
                        </div>
                    </div>
                    <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline 
                        className={!isPeerConnected ? 'video-off' : ''}
                    />
                    {!isPeerConnected && status === 'connected' && (
                        <div className="waiting-connection">
                            <div className="spinner"></div>
                            <p>Waiting for {userRole === 'ENTERPRISE' ? 'candidate' : 'interviewer'} to join...</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="call-controls">
                {status === 'ready' && (
                    <button 
                        onClick={startCall} 
                        className="control-btn start-call"
                        data-testid="start-call-button"
                    >
                        <i className="icon-phone"></i>
                        {userRole === 'ENTERPRISE' ? 'Start Interview' : 'Join Interview'}
                    </button>
                )}
                
                {(status === 'connected' || status === 'connection-timeout') && (
                    <button 
                        onClick={endCall} 
                        className="control-btn end-call"
                    >
                        <i className="icon-phone-off"></i>
                        End Call
                    </button>
                )}
                
                {(status === 'error' || status === 'disconnected') && (
                    <button 
                        onClick={() => window.location.reload()} 
                        className="control-btn retry"
                    >
                        <i className="icon-refresh-cw"></i>
                        Retry Connection
                    </button>
                )}
            </div>

            {/* Summary Controls */}
            {userRole === 'ENTERPRISE' && (
                <div className="summary-controls">
                    {isRecording && (
                        <div className="recording-indicator">
                            <span>Recording</span>
                        </div>
                    )}
                    <button 
                        onClick={toggleTranscription}
                        className={`control-btn ${isRecording ? 'active' : ''}`}
                    >
                        {isRecording ? 'Stop Transcription' : 'Start Transcription'}
                    </button>

                    <button 
                        onClick={generateSummary}
                        disabled={isSummarizing || transcript.length === 0}
                        className="summary-btn"
                    >
                        {isSummarizing ? (
                            <span>Generating Summary...</span>
                        ) : (
                            <span>Generate AI Summary</span>
                        )}
                    </button>

                    {interviewSummary && (
                        <div className="summary-modal">
                            <h3>Interview Analysis</h3>
                            <div className="summary-content">
                                {interviewSummary.split('\n').map((para, i) => (
                                    <p key={i}>{para}</p>
                                ))}
                            </div>
                            <div className="summary-actions">
                                <button onClick={() => navigator.clipboard.writeText(interviewSummary)}>
                                    Copy to Clipboard
                                </button>
                                <button onClick={() => setInterviewSummary(null)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="call-footer">
                <p className="footer-text">
                    {userRole === 'ENTERPRISE' 
                        ? 'Professional Interview Platform - Recruiter View'
                        : 'Professional Interview Platform - Candidate View'}
                </p>
                <p className="footer-help">
                    Having issues? <a href="#">Get help</a>
                </p>
            </div>
        </div>
    );
};

export default VideoCall;