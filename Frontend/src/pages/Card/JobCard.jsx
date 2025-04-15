import { Link } from "react-router-dom";
import "./JobCard.css";

const JobCard = ({ job }) => {
  return (
    <div className="job-card">
      <h3>{job.title}</h3>
      <p><strong>Entreprise:</strong> {job.enterpriseName}</p>
      <p><strong>Localisation:</strong> {job.location}</p>
      <p><strong>Candidats:</strong> {job.applicants}</p>
      <Link to={`/job/${job._id}`} className="see-more">Voir Plus</Link>
    </div>
  );
};

export default JobCard;
