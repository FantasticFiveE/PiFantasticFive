import React, { useEffect, useState } from "react";
import { ApexCharts } from "../../Charts/ApexCharts";
import { Heading } from "../../UI/Typography";

function ApplicationInfo() {
  const [seriesData, setSeriesData] = useState([]);

  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        const response = await fetch("http://localhost:3001/applications/stats");
        const { data } = await response.json();

        console.log("Application statistics:", data);

        const transformedSeriesData = [
          {
            name: "Applications",
            type: "column",
            data: data.monthlyCounts,
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

  // Month names for chart labels
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return (
    <div className="p-4 shadow mb-4 assessment-info-container">
      <div className="d-flex justify-content-between align-items-center border-bottom border-2 pb-1 mb-3">
        <div className="d-flex gap-4 justify-content-center align-items-center">
          <Heading style={{ fontSize: "19px" }}>Application's Info</Heading>
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
      <ApexCharts 
        seriesData={seriesData} 
        categories={monthNames} // Pass month names as categories
      />
    </div>
  );
}

export default ApplicationInfo;