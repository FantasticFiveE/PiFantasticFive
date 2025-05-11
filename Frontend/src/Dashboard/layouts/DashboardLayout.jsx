import React, { useEffect, useState } from "react";
import Button from "../components/UI/Button";
import Upcomings from "../components/Widgets/Upcomings";
import Activity from "../components/Widgets/Activity";
import Hirings from "../components/Widgets/Hirings";
import PostedJobs from "../components/Sections/PostedJobs";
import { Heading, Subtitle } from "../components/UI/Typography";
import Assessments from "../components/Widgets/Assessments";
import CandidateStatus from "../components/Sections/CandidateStatus";
import InterviewMeetingInfo from "../components/Sections/InterviewMeetingInfo";
import ApplicationInfo from "../components/Sections/ApplicationInfo";
import EnterpriseQuizzes from "../components/Sections/QuizPost";
import AdminClustering from "../components/Sections/clustering";

function DashboardLayout() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4 shadow mb-4 dashboard-container">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center border-bottom border-2 pb-1 mb-3">
        <div className="d-flex flex-column gap-1">
          <Heading style={{ fontSize: "19px" }}>Next Hire</Heading>
          <Subtitle style={{ fontSize: "14px" }}>
            Enjoy your selecting potential candidates Tracking and Management System.
          </Subtitle>
        </div>
        <Button
          className="py-2 px-3"
          style={{
            fontSize: "14px",
          }}
        >
          Task Details
        </Button>
      </div>

      {/* Main Content */}
      <div className="row">
        {/* First Column */}
        <div className="col-lg-7 col-md-12 p-0">
          <div className="p-3">
            <ApplicationInfo />
          </div>
        </div>

        {/* Second Column */}
        <div className="col-lg-5 col-md-12 p-0">
          <div className="p-3">
            <Assessments />
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-9 col-md-12 p-0">
          <div className="p-3">
            <PostedJobs />
            <CandidateStatus />
            <EnterpriseQuizzes />
            <AdminClustering /> {/* ← Now rendered */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
