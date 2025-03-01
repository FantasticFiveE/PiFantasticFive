import React, { useState, useEffect } from "react";
import Button from "../../UI/Button";
import Heading from "../../UI/Typography/Heading";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Use useNavigate for navigation

function Upcomings() {
    const [interviewList, setInterviewList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Initialize the useNavigate hook for navigation

    useEffect(() => {
        axios
            .get("http://localhost:5000/api/upcoming-interviews")
            .then((response) => {
                const interviews = response.data.map((interview) => ({
                    date: new Date(interview.date),
                    jobTitle: interview.jobTitle || "N/A", // Use job title if available
                    enterpriseName: interview.enterpriseName || "N/A", // Use enterprise name if available
                    candidateName: interview.candidate?.name || interview.candidate?.email || "N/A", // Use candidate name or fallback to email
                    status: interview.status || "N/A", // Fallback for status
                }));
                setInterviewList(interviews);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching interviews:", error);
                setError("Failed to fetch interviews. Please try again later.");
                setLoading(false);
            });
    }, []);

    // Redirect to the calendar page
    const navigateToCalendar = () => {
        navigate("/calendar");
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <>
            <div className="d-flex justify-content-between align-items-center">
                <Heading
                    style={{
                        fontSize: "19px",
                        fontWeight: "500",
                        lineHeight: "33px",
                        textAlign: "left",
                    }}
                >
                    Upcomings
                </Heading>
                <Button variant={"link"} onClick={navigateToCalendar}>
                    View All
                </Button>
            </div>
            <div className="d-flex flex-column gap-2">
                {interviewList.map((interview, idx) => {
                    const date = new Date(interview.date);
                    const formattedDate = `${date.getDate()} ${date.toLocaleString("default", {
                        month: "short",
                    })}`;

                    return (
                        <div
                            key={idx}
                            className="d-flex justify-content-between align-items-start py-1 my-1"
                        >
                            <span
                                className="d-flex flex-column justify-content-center align-items-center p-3 date-card"
                                data-index={idx}
                            >
                                <span>{formattedDate.split(" ")[0]}</span>
                                <span>{formattedDate.split(" ")[1]}</span>
                            </span>
                            <div className="d-flex flex-column gap-1 w-100 px-3 card-info">
                                <p className="title-text">
                                    Interview with: {interview.candidateName} {/* Updated text */}
                                </p>
                                <p className="subtitle-text">
                                    Enterprise:{" "}
                                    <span className="text-primary fw-bold">
                                        {interview.enterpriseName}
                                    </span>
                                </p>
                                <p className="subtitle-text">
                                    Job:{" "}
                                    <span className="text-primary fw-bold">
                                        {interview.jobTitle}
                                    </span>
                                </p>
                                <p className="trinary-text">{interview.status}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

export default Upcomings;