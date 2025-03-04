import React, { useState, useEffect } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Container, Typography, Paper, List, ListItem, ListItemText, Grid } from "@mui/material";
import { styled } from "@mui/system";

const StyledCalendar = styled(Calendar)({
  width: "100%",
  maxWidth: "400px",
  border: "none",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  borderRadius: "8px",
  padding: "16px",
});

const HighlightedDate = styled("div")({
  backgroundColor: "#3f51b5",
  color: "white",
  borderRadius: "50%",
  width: "24px",
  height: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const CalendarView = () => {
  const [interviews, setInterviews] = useState([]);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/upcoming-interviews")
      .then((response) => {
        setInterviews(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching interviews:", error);
        setError("Failed to fetch interviews. Please try again later.");
        setLoading(false);
      });
  }, []);

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  const filterInterviewsByDate = (selectedDate) => {
    return interviews.filter((interview) => {
      const interviewDate = new Date(interview.date);
      return (
        interviewDate.getDate() === selectedDate.getDate() &&
        interviewDate.getMonth() === selectedDate.getMonth() &&
        interviewDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  if (loading) {
    return (
      <Container>
        <Typography variant="h4" gutterBottom>
          Loading...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography variant="h4" gutterBottom>
          Error: {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Upcoming Interviews Calendar
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <StyledCalendar
            onChange={handleDateChange}
            value={date}
            tileContent={({ date, view }) => {
              const interviewsOnDate = filterInterviewsByDate(date);
              return interviewsOnDate.length > 0 ? <HighlightedDate>{date.getDate()}</HighlightedDate> : null;
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: "16px" }}>
            <Typography variant="h6" gutterBottom>
              Interviews on {date.toDateString()}:
            </Typography>
            <List>
              {filterInterviewsByDate(date).map((interview, idx) => {
                const interviewDate = new Date(interview.date);
                return (
                  <ListItem key={idx} divider>
                    <ListItemText
                      primary={`Job Title: ${interview.jobTitle || "N/A"}`}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="textPrimary">
                            Enterprise: {interview.enterpriseName || "N/A"}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" color="textPrimary">
                            Candidate: {interview.candidate.name || interview.candidate.email || "N/A"}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" color="textPrimary">
                            Status: {interview.status || "N/A"}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" color="textPrimary">
                            Time: {interviewDate.toLocaleTimeString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CalendarView;