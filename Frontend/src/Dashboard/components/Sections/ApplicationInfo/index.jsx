import React, { useEffect, useState } from "react";
import { ApexCharts } from "../../Charts/ApexCharts";
import { Heading } from "../../UI/Typography";

function ApplicationInfo() {
  const [seriesData, setSeriesData] = useState([]);

  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/users");
        const usersData = await response.json();

        console.log("Fetched users data:", usersData);

        // Filter candidates
        const candidateData = usersData.filter((user) => user.role === "CANDIDATE");
        console.log("Filtered candidate data:", candidateData);

        // Initialize counts
        const applicationCounts = Array(12).fill(0);

        candidateData.forEach((candidate, index) => {
          console.log(`Candidate ${index + 1}:`, candidate);

          candidate.applications?.forEach((application, appIndex) => {
            console.log(`Application ${appIndex + 1}:`, application);

            if (application.dateSubmitted) {
              try {
                const dateValue = application.dateSubmitted.$date || application.dateSubmitted;
                console.log("Raw date value:", dateValue);

                const applicationDate = new Date(dateValue);
                console.log("Parsed date:", applicationDate);

                if (!isNaN(applicationDate)) {
                  const month = applicationDate.getMonth();
                  applicationCounts[month] += 1;
                } else {
                  console.warn("Invalid date format:", dateValue);
                }
              } catch (error) {
                console.error("Error parsing date:", error);
              }
            } else {
              console.warn("Application missing dateSubmitted field:", application);
            }
          });
        });

        console.log("Monthly application counts:", applicationCounts);

        const transformedSeriesData = [
          {
            name: "Applications",
            type: "column",
            data: applicationCounts,
            color: "#277ACC",
          },
        ];

        setSeriesData(transformedSeriesData);
      } catch (error) {
        console.error("Error fetching application data:", error);
      }
    };

    fetchApplicationData();
  }, []);

  return (
    <div className="p-4 shadow mb-4 assessment-info-container">
      <div className="d-flex justify-content-between align-items-center border-bottom border-2 pb-1 mb-3">
        <div className="d-flex gap-4 justify-content-center align-items-center">
          <Heading style={{ fontSize: "19px" }}>Application’s Info</Heading>
          <div className="d-flex align-items-center gap-2">
            <span className="d-flex align-items-center gap-1">
              <i className="text-primary bi bi-square-fill"></i>
              <p style={{ fontSize: "12px" }}>Applications</p>
            </span>
          </div>
        </div>
        <button className="btn d-flex align-items-center justify-content-center p-0">
          <i className="bi bi-three-dots-vertical"></i>
        </button>
      </div>
      <ApexCharts seriesData={seriesData} />
    </div>
  );
}

export default ApplicationInfo;