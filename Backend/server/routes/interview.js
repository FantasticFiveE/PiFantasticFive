// server/routes/interview.js
const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const { verifyToken } = require('../middleware/auth');

// Initiate a video call
router.post('/:interviewId/start-call', verifyToken, async(req, res) => {
    try {
        const interview = await Interview.findById(req.params.interviewId);

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        // Check if user is part of this interview
        if (![interview.enterpriseId, interview.candidateId].includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized for this interview' });
        }

        // Update interview status
        interview.callStatus = 'ongoing';
        interview.callStartedAt = new Date();
        interview.callParticipants.push({
            userId: req.user._id,
            joinTime: new Date()
        });

        await interview.save();

        res.json({
            message: 'Call initiated',
            interview,
            // You might want to return the signaling server details here
            signalingServer: process.env.SIGNALING_SERVER_URL
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// End a video call
router.post('/:interviewId/end-call', verifyToken, async(req, res) => {
    try {
        const interview = await Interview.findById(req.params.interviewId);

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        // Check if user is part of this interview
        if (![interview.enterpriseId, interview.candidateId].includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized for this interview' });
        }

        // Update interview status
        interview.callStatus = 'completed';
        interview.callEndedAt = new Date();

        // Calculate duration
        if (interview.callStartedAt) {
            interview.callDuration = Math.floor(
                (interview.callEndedAt - interview.callStartedAt) / 1000
            );
        }

        // Update participant leave time
        const participant = interview.callParticipants.find(
            p => p.userId.equals(req.user._id) && !p.leaveTime
        );
        if (participant) {
            participant.leaveTime = new Date();
        }

        await interview.save();

        res.json({ message: 'Call ended', interview });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;