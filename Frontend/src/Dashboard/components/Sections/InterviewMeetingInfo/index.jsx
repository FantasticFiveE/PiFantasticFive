import React, { useEffect, useState } from "react";
import { Heading } from "../../UI/Typography";
import Button from "../../UI/Button";

import ClockIcon from "../../../_assets/common/clock-icon.svg";
import CalendarIcon from "../../../_assets/common/calendar-icon.svg";

function InterviewMeetingInfo() {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetching data from your API route '/api/interviews'
        const response = await fetch("http://localhost:3001/api/interviews"); // Make sure this matches your backend route
        if (!response.ok) {
          throw new Error("Failed to fetch interviews");
        }
        const data = await response.json();
        console.log("Fetched data:", data); // Debug: Log fetched data
        setMeetings(data);
      } catch (error) {
        console.error("Failed to fetch interview data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-4 shadow mb-4">
      <div className="d-flex justify-content-between align-items-center border-bottom border-2 pb-1 mb-3">
        <div className="d-flex gap-2 justify-content-center align-items-center">
          <Heading style={{ fontSize: "22px" }}>Today's Interview Meetings</Heading>
        </div>
        <button className="btn d-flex align-items-center justify-content-center p-0">
          <i className="bi bi-three-dots-vertical"></i>
        </button>
      </div>
      <div className="meeting-info-card-container d-flex gap-2 overflow-x-auto mt-3">
        {meetings.length > 0 ? (
          meetings.map((meeting) => (
            <div key={meeting.id} className="flex-shrink-0 m-2 p-2">
              <MeetingInfoCard meeting={meeting} />
            </div>
          ))
        ) : (
          <p>No interview meetings available.</p>
        )}
      </div>
    </div>
  );
}

const MeetingInfoCard = ({ meeting }) => {
  const interviewDate = new Date(meeting.date); // Adjust according to the data format
  const formattedDate = interviewDate.toLocaleDateString(); // Format date
  const formattedTime = interviewDate.toLocaleTimeString(); // Format time

  return (
    <div className="meeting-info-card">
      <div className="row w-100">
        <div className="col-md-4 col-xs-12 p-0 border border-end-0">
          <div className="d-flex flex-column align-items-center justify-content-center gap-2 p-4 border">
            <img
              src={meeting.candidate.picture}
              alt="candidate"
              className="mb-2"
              style={{ width: "80px", height: "80px", borderRadius: "50%" }}
            />
            <p className="candidate-name text-center">{meeting.candidate.name}</p>
            <p className="candidate-designation text-center">{meeting.candidate.designation}</p>
          </div>
          <div className="d-flex border w-100 justify-content-center">
            <div className="col d-flex flex-column justify-content-center align-items-center gap-1 p-2 border">
              <img src={CalendarIcon} alt="calendar-icon" />
              <p className="date-time text-primary text-center">{formattedDate}</p>
            </div>
            <div className="col d-flex flex-column justify-content-center align-items-center gap-1 p-2 border">
              <img src={ClockIcon} alt="clock-icon" />
              <p className="date-time text-primary text-center">{formattedTime}</p>
            </div>
          </div>
        </div>
        <div className="col-md-8 col-xs-12 d-flex flex-column justify-content-between border">
          <table>
            <tbody>
              <tr>
                <td>Job: {meeting.jobId}</td>
                <td>Status: {meeting.status}</td>
              </tr>
              <tr>
                <td>Meeting Type: {meeting.meeting?.type || "N/A"}</td>
                <td>Attendees: {meeting.meeting?.attendees || "N/A"}</td>
              </tr>
            </tbody>
          </table>
          <div className="d-flex justify-content-center align-items-center gap-3 p-4">
            <Button variant="outline-primary">Reschedule Meeting</Button>
            <Button variant="primary">Join Meeting</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewMeetingInfo;