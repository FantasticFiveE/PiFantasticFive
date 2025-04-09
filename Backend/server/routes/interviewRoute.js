const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user');
const Job = require('../models/job');

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper functions
function formatDateForGoogleCalendar(date) {
  return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
}

function buildInterviewEmailTemplate(interview, candidate, enterprise, job, calendarLink) {
  const meetingType = interview.meeting.type === 'Virtual' ? 
    `Virtual Meeting: <a href="${interview.meeting.link}">Join Meeting</a>` : 
    `In-person at: ${interview.meeting.link}`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2c3e50; margin-top: 0;">Interview Scheduled</h2>
        <p>Dear ${candidate.name},</p>
        
        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="color: #3498db; margin-top: 0;">${job.title}</h3>
          <p><strong>Company:</strong> ${enterprise.name}</p>
          <p><strong>Date & Time:</strong> ${new Date(interview.date).toLocaleString()}</p>
          <p><strong>Meeting Type:</strong> ${meetingType}</p>
          <p><strong>Details:</strong> ${interview.meeting.details || 'No additional details provided.'}</p>
        </div>
        
        <p>You can add this event to your calendar:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${calendarLink}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Add to Calendar</a>
        </div>
        
        <p>Best of luck with your interview!</p>
        <p>Best regards,<br>${enterprise.name} Hiring Team</p>
      </div>
    </div>
  `;
}

// Get all interviews
router.get('/interviews', async (req, res) => {
    try {
        const usersWithInterviews = await User.find(
            { 'interviews.0': { $exists: true } },
            { interviews: 1, name: 1, email: 1, profile: 1, picture: 1, enterprise: 1 }
        );

        const meetings = usersWithInterviews.flatMap((user) =>
            (user.interviews || []).map((interview) => ({
                id: interview._id,
                candidate: {
                    name: user.name || user.email,
                    designation: (user.profile?.experience?.[0]?.title) || "N/A",
                    picture: user.picture || "https://via.placeholder.com/80",
                },
                date: interview.date,
                jobId: interview.jobId || "N/A",
                status: interview.status,
                enterpriseName: (user.enterprise?.name) || "N/A",
                meeting: {
                    type: (interview.meeting?.type) || "N/A",
                    attendees: (interview.meeting?.attendees) || "N/A",
                },
            }))
        );

        res.json(meetings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get upcoming interviews
router.get("/upcoming-interviews", async (req, res) => {
    try {
        const today = new Date();
        const usersWithInterviews = await User.find(
            { "interviews.date": { $gte: today } }, 
            { interviews: 1, name: 1, email: 1, profile: 1, picture: 1, enterprise: 1, jobsPosted: 1 }
        );

        const interviews = usersWithInterviews.flatMap((user) =>
            user.interviews
            .filter((interview) => new Date(interview.date) >= today)
            .map((interview) => {
                const job = user.jobsPosted?.find((job) => job.jobId?.toString() === interview.jobId?.toString());

                return {
                    jobId: interview.jobId || "N/A",
                    jobTitle: job ? job.title : "N/A",
                    enterpriseId: interview.enterpriseId,
                    enterpriseName: user.enterprise?.name || "N/A",
                    date: interview.date,
                    status: interview.status,
                    meeting: interview.meeting,
                    candidate: {
                        name: user.name || user.email,
                        designation: (user.profile?.experience?.[0]?.title) || "N/A",
                        picture: user.picture || "https://via.placeholder.com/80",
                    },
                };
            })
        );

        res.status(200).json(interviews);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch interviews. Please try again later." });
    }
});

// Quiz completion endpoint
router.post('/quiz/completed', async (req, res) => {
  try {
    const { responseId, quizId, jobId, candidateId, score, passed } = req.body;

    const candidate = await User.findOneAndUpdate(
      { 
        _id: candidateId,
        'quizResponses.responseId': responseId 
      },
      { 
        $set: { 
          'quizResponses.$.status': passed ? 'passed' : 'failed',
          'quizResponses.$.score': score,
          'quizResponses.$.passed': passed
        } 
      },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    await User.findOneAndUpdate(
      { 
        _id: candidateId,
        'applications.jobId': jobId 
      },
      { 
        $set: { 
          'applications.$.status': passed ? 'Approved' : 'Rejected',
          'applications.$.quizScore': score,
          'applications.$.quizResponseId': responseId
        } 
      }
    );

    if (passed) {
      const job = await Job.findById(jobId);
      const enterprise = await User.findById(job.entrepriseId);
      
      if (!enterprise) {
        return res.status(404).json({ error: 'Enterprise not found' });
      }

      const notificationLink = `${process.env.FRONTEND_URL}/dashboard/interview-schedule?candidateId=${candidate._id}&jobId=${job._id}`;
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: enterprise.email,
        subject: `Candidate Passed Quiz for ${job.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Candidate Successfully Passed Quiz</h2>
            <p>Dear ${enterprise.name},</p>
            <p>The candidate <strong>${candidate.name}</strong> has successfully passed the quiz for the position <strong>${job.title}</strong> with a score of <strong>${score}</strong>.</p>
            <p>You can now schedule an interview with the candidate:</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${notificationLink}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Schedule Interview</a>
            </div>
            <p>Best regards,<br>Your Hiring Team</p>
          </div>
        `
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling quiz completion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Interview scheduling endpoint
router.post('/interviews/schedule', async (req, res) => {
  try {
    const { jobId, enterpriseId, candidateId, quizResponseId, quizScore, date, meetingType, meetingDetails, locationDetails } = req.body;
    
    const meetingId = uuidv4();
    const interview = {
      jobId,
      enterpriseId,
      candidateId,
      date: new Date(date),
      status: 'Scheduled',
      meeting: {
        type: meetingType,
        link: meetingType === 'Virtual' ? 
          `https://${process.env.VIDEO_CONFERENCE_DOMAIN}/meeting/${meetingId}` : 
          locationDetails,
        details: meetingDetails
      },
      quizResponseId,
      quizScore
    };

    await User.findByIdAndUpdate(enterpriseId, { $push: { interviews: interview } });
    await User.findByIdAndUpdate(candidateId, { $push: { interviews: interview } });

    const candidate = await User.findById(candidateId);
    const enterprise = await User.findById(enterpriseId);
    const job = await Job.findById(jobId);

    if (!candidate || !enterprise || !job) {
      return res.status(404).json({ error: 'Required data not found' });
    }

    const startTime = new Date(date);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Interview for ${job.title}`)}&dates=${formatDateForGoogleCalendar(startTime)}/${formatDateForGoogleCalendar(endTime)}&details=${encodeURIComponent(`Interview with ${enterprise.name}\n\nDetails: ${meetingDetails}`)}&location=${encodeURIComponent(interview.meeting.link)}&add=${encodeURIComponent(candidate.email)},${encodeURIComponent(enterprise.email)}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: candidate.email,
      subject: `Interview Scheduled for ${job.title}`,
      html: buildInterviewEmailTemplate(interview, candidate, enterprise, job, googleCalendarUrl)
    });

    res.json({ success: true, interview });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;