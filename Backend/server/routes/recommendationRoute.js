const jwt = require('jsonwebtoken');
const axios = require('axios');
const express = require('express');
const router = express.Router();

router.get('/for-user', async(req, res) => {
    try {
        // 1. Verify JWT Token
        const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
        if (!token) {
            return res.status(401).json({ error: 'Authorization token required' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // 2. Get recommendations from Python service
        const response = await axios.post('http://localhost:5001/recommend', {
            candidate_id: decoded.id,
            top_k: 5
        }, {
            timeout: 10000, // 10 second timeout
            headers: {
                'Content-Type': 'application/json'
            }
        }).catch(err => {
            console.error('Recommendation service error:', err.response ? err.response.data : err.message);
            if (err.code === 'ECONNREFUSED') {
                throw new Error('Recommendation service unavailable');
            }
            throw err;
        });

        // 3. Process and return recommendations
        const responseData = response.data;

        // Handle both response formats
        const recommendations = responseData.recommendations || responseData;

        if (!Array.isArray(recommendations)) {
            throw new Error('Invalid recommendations format received');
        }

        // Transform data for frontend
        const formattedRecs = recommendations.map(job => ({
            _id: job._id,
            title: job.title,
            description: job.description,
            location: job.location,
            salary: job.salary,
            skills: job.skills || [],
            languages: job.languages || [],
            entrepriseId: job.entrepriseId || null,
            match_score: job.match_score,
            createdAt: job.createdAt
        }));

        res.json(formattedRecs);

    } catch (error) {
        console.error('Recommendation error:', error.message);
        res.status(500).json({
            error: 'Failed to get recommendations',
            details: error.message
        });
    }
});

module.exports = router;