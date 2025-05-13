const express = require('express');
const router = express.Router();
const { UserModel } = require('../models/user');
const JobModel = require('../models/job');
const Interview = require('../models/interview');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const axios = require('axios');
// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// Generate meeting link with custom format
const generateMeetingLink = (interviewId) => {
  return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/interview/${interviewId}`;
};

// Send interview confirmation email
const sendInterviewEmail = async (interviewData) => {
  try {
    const { candidateEmail, candidateName, enterpriseName, jobTitle, date, meeting } = interviewData;

    const formattedDate = new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const mailOptions = {
      from: `"${enterpriseName} Hiring Team" <${process.env.EMAIL_USER}>`,
      to: candidateEmail,
      subject: `Interview Scheduled: ${jobTitle} at ${enterpriseName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #2563eb; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Interview Scheduled</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Dear ${candidateName},</p>
            
            <p>Thank you for your application! We're pleased to invite you to interview for the <strong>${jobTitle}</strong> position at ${enterpriseName}.</p>
            
            <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2563eb;">Interview Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; width: 120px; font-weight: bold;">Date & Time:</td>
                  <td style="padding: 8px 0;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Interview Type:</td>
                  <td style="padding: 8px 0; text-transform: capitalize;">${meeting.type}</td>
                </tr>
                ${meeting.type === 'Virtual' ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Meeting Link:</td>
                  <td style="padding: 8px 0;">
                    <a href="${meeting.link}" style="color: #2563eb; text-decoration: none;">
                      ${meeting.link}
                    </a>
                  </td>
                </tr>
                ` : `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Location:</td>
                  <td style="padding: 8px 0;">${meeting.link}</td>
                </tr>
                `}
                ${meeting.details ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Notes:</td>
                  <td style="padding: 8px 0;">${meeting.details}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="margin: 20px 0;">
              <h4 style="margin-bottom: 10px;">What to Expect:</h4>
              <ul style="padding-left: 20px; margin-top: 0;">
                <li>Duration: Approximately 45-60 minutes</li>
                <li>Format: ${meeting.type === 'Virtual' ? 'Video call' : 'In-person meeting'}</li>
                <li>Participants: Hiring manager and team members</li>
              </ul>
            </div>

            <div style="margin: 20px 0;">
              <h4 style="margin-bottom: 10px;">How to Prepare:</h4>
              <ul style="padding-left: 20px; margin-top: 0;">
                <li>Review the job description</li>
                <li>Prepare examples of your relevant experience</li>
                ${meeting.type === 'Virtual' ? `
                <li>Test your audio/video setup beforehand</li>
                <li>Find a quiet, well-lit space</li>
                ` : `
                <li>Plan to arrive 10 minutes early</li>
                <li>Bring copies of your resume</li>
                `}
              </ul>
            </div>

            <p>If you need to reschedule or have any questions, please reply to this email.</p>

            <p style="margin-top: 30px;">We look forward to speaking with you!</p>
            
            <p>Best regards,<br/>
            <strong>The ${enterpriseName} Hiring Team</strong></p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      `,
      text: `Dear ${candidateName},\n\n` +
        `We're pleased to invite you to interview for the ${jobTitle} position at ${enterpriseName}.\n\n` +
        `Interview Details:\n` +
        `Date & Time: ${formattedDate}\n` +
        `Type: ${meeting.type}\n` +
        `${meeting.type === 'Virtual' ? `Meeting Link: ${meeting.link}\n` : `Location: ${meeting.link}\n`}` +
        `${meeting.details ? `Notes: ${meeting.details}\n` : ''}\n` +
        `What to Expect:\n` +
        `- Duration: Approximately 45-60 minutes\n` +
        `- Format: ${meeting.type === 'Virtual' ? 'Video call' : 'In-person meeting'}\n` +
        `- Participants: Hiring manager and team members\n\n` +
        `How to Prepare:\n` +
        `- Review the job description\n` +
        `- Prepare examples of your relevant experience\n` +
        `${meeting.type === 'Virtual' ? 
          `- Test your audio/video setup beforehand\n` + 
          `- Find a quiet, well-lit space\n` : 
          `- Plan to arrive 10 minutes early\n` + 
          `- Bring copies of your resume\n`}\n\n` +
        `If you need to reschedule or have any questions, please reply to this email.\n\n` +
        `We look forward to speaking with you!\n\n` +
        `Best regards,\n` +
        `The ${enterpriseName} Hiring Team`
    };

    await transporter.sendMail(mailOptions);
    console.log('Interview confirmation email sent to:', candidateEmail);
  } catch (error) {
    console.error('Error sending interview email:', error);
  }
};

// Schedule a new interview
router.post('/', async (req, res) => {
  try {
    const { jobId, enterpriseId, candidateId, date, meeting } = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(jobId) || 
        !mongoose.Types.ObjectId.isValid(enterpriseId) || 
        !mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ message: "Invalid IDs provided" });
    }

    // Get prediction from ML model
    const prediction = await axios.post('http://localhost:3001/Frontend/predict-score', {
      jobId,
      candidateId
    });

    // Find the job, enterprise and candidate
    const [job, enterprise, candidate] = await Promise.all([
      JobModel.findById(jobId),
      UserModel.findById(enterpriseId),
      UserModel.findById(candidateId)
    ]);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (!enterprise || !enterprise.enterprise) {
      return res.status(404).json({ message: "Enterprise not found" });
    }
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const interviewId = new mongoose.Types.ObjectId();
    
    const meetingData = {
      type: meeting.type,
      details: meeting.notes || '',
      link: meeting.type === 'Virtual' 
        ? (meeting.link || generateMeetingLink(interviewId))
        : enterprise.enterprise.location || 'Office Location'
    };

    const newInterview = {
      _id: interviewId,
      jobId: job._id,
      enterpriseId: enterprise._id,
      candidateId: candidate._id,
      date: new Date(date),
      status: 'Scheduled',
      meeting: meetingData,
      evaluation: {
        predictedScore: prediction.data.predictedScore
      },
      mlFeatures: prediction.data.features,
      createdAt: new Date()
    };

    // Save interview to the database
    await new Interview(newInterview).save();

    // Add interview to both enterprise and candidate
    await Promise.all([ 
      UserModel.findByIdAndUpdate(enterpriseId, {
        $push: { 
          interviews: newInterview
        }
      }),
      UserModel.findByIdAndUpdate(candidateId, {
        $push: { 
          interviews: newInterview
        }
      })
    ]);

    // Send email in background
    sendInterviewEmail({
      candidateEmail: candidate.email,
      candidateName: candidate.name,
      enterpriseName: enterprise.enterprise.name,
      jobTitle: job.title,
      date: newInterview.date,
      meeting: meetingData
    });

    res.status(201).json({
      ...newInterview,
      meeting: {
        ...meetingData,
        link: meetingData.link || generateMeetingLink(interviewId)
      }
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const enterpriseId = req.query.enterpriseId;

    if (!mongoose.Types.ObjectId.isValid(jobId) || !mongoose.Types.ObjectId.isValid(enterpriseId)) {
      return res.status(400).json({ message: "Invalid IDs provided" });
    }

    const enterprise = await UserModel.findById(enterpriseId)
      .select('interviews')
      .populate({
        path: 'interviews.candidateId',
        select: 'name email picture profile'
      })
      .populate('interviews.jobId', 'title');

    if (!enterprise) {
      return res.status(404).json({ message: "Enterprise not found" });
    }

    const jobInterviews = enterprise.interviews
      .filter(interview => interview.jobId && interview.jobId._id.toString() === jobId)
      .map(interview => ({
        _id: interview._id,
        jobId: interview.jobId._id,
        jobTitle: interview.jobId.title,
        candidateId: interview.candidateId,
        date: interview.date,
        status: interview.status,
        meeting: interview.meeting,
        createdAt: interview.createdAt
      }));

    res.json(jobInterviews);
  } catch (error) {
    console.error('Error fetching job interviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { enterpriseId, candidateId, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || 
        !mongoose.Types.ObjectId.isValid(enterpriseId) || 
        !mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ message: "Invalid IDs provided" });
    }

    // Validate status
    const validStatuses = ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Update in both enterprise's and candidate's records
    await Promise.all([
      UserModel.updateOne(
        { 
          _id: enterpriseId,
          'interviews._id': new mongoose.Types.ObjectId(id) 
        },
        { 
          $set: { 
            'interviews.$.status': status,
            'interviews.$.updatedAt': new Date()
          } 
        }
      ),
      UserModel.updateOne(
        { 
          _id: candidateId,
          'interviews._id': new mongoose.Types.ObjectId(id) 
        },
        { 
          $set: { 
            'interviews.$.status': status,
            'interviews.$.updatedAt': new Date()
          } 
        }
      )
    ]);

    res.json({ message: "Interview status updated successfully" });
  } catch (error) {
    console.error('Error updating interview status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid interview ID" });
    }

    // Find users who have this interview
    const [enterprise, candidate] = await Promise.all([
      UserModel.findOne({ 'interviews._id': id })
        .select('interviews enterprise')
        .populate('interviews.jobId', 'title'),
      UserModel.findOne({ 'interviews.candidateId': id })
        .select('name email picture profile')
    ]);

    if (!enterprise || !candidate) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const interview = enterprise.interviews.find(i => i._id.toString() === id);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const response = {
      _id: interview._id,
      jobId: interview.jobId,
      jobTitle: interview.jobId?.title || 'No title',
      enterprise: enterprise.enterprise,
      candidate: {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        picture: candidate.picture,
        profile: candidate.profile
      },
      date: interview.date,
      status: interview.status,
      meeting: interview.meeting,
      createdAt: interview.createdAt
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
