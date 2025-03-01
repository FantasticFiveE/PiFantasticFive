import React, { useEffect, useState } from "react";
import axios from "axios";
import Button from "../../UI/Button";
import Heading from "../../UI/Typography/Heading";

// Images (fallback in case candidate picture is not available)
import Candidate1 from "../../../_assets/users/candidate-1.png";
import Candidate2 from "../../../_assets/users/candidate-2.png";
import Candidate3 from "../../../_assets/users/candidate-3.png";
import Candidate4 from "../../../_assets/users/candidate-4.png";
import Candidate5 from "../../../_assets/users/candidate-5.png";

function Hirings() {
  const [hiringList, setHiringList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch all candidates with approved application status
    axios
      .get("http://localhost:5000/api/approved-candidates")
      .then((response) => {
        setHiringList(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching approved candidates:", error);
        setError("Failed to fetch approved candidates. Please try again later.");
        setLoading(false);
      });
  }, []);

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
          Hiring Candidates
        </Heading>
        <Button variant={"link"}>View All</Button>
      </div>
      <div className="d-flex flex-column gap-2">
        {hiringList.map((candidate, idx) => {
          // Use fallback images if candidate picture is not available
          const profilePicture =
            candidate.picture || [Candidate1, Candidate2, Candidate3, Candidate4, Candidate5][idx % 5];

          return (
            <div
              key={idx}
              className="d-flex justify-content-between align-items-start py-1 my-1"
            >
              <span className="d-flex flex-column justify-content-center align-items-center p-3 date-card">
                <img
                  src={profilePicture}
                  alt={candidate.candidate_name}
                  style={{ width: "50px", height: "50px", borderRadius: "50%" }}
                />
              </span>
              <div className="d-flex flex-column gap-1 w-100 px-3 card-info">
                <p className="title-text">{candidate.candidate_name}</p>
                <p className="subtitle-text">{candidate.position}</p>
                <p className="trinary-text">Hired by: {candidate.hiredBy}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default Hirings;