import React, { useEffect, useState } from "react";
import "./job.css";

const AllJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [editJob, setEditJob] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = () => {
        fetch("http://localhost:3001/api/jobs")
            .then((res) => res.json())
            .then((data) => {
                console.log("Données reçues de l'API :", data);
                setJobs(data);
            })
            .catch((err) => console.error("Error fetching jobs:", err));
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Invalid Date";
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
    };

    const handleDelete = async (jobId) => {
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user?._id;

        if (!userId) {
            alert("User ID not found. Please log in.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this job?")) return;

        try {
            const res = await fetch(`http://localhost:3001/api/jobs/delete/${userId}/${jobId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setJobs(jobs.filter((job) => job._id !== jobId));
            } else {
                const errorText = await res.text();
                console.error("Failed to delete job:", errorText);
                alert("Failed to delete the job.");
            }
        } catch (error) {
            console.error("Error deleting job:", error);
        }
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/jobs/${editJob._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editJob),
            });

            if (res.ok) {
                setJobs((prevJobs) =>
                    prevJobs.map((job) =>
                        job._id === editJob._id ? { ...job, ...editJob } : job
                    )
                );
                setIsModalOpen(false);
            } else {
                alert("Failed to update job.");
            }
        } catch (error) {
            console.error("Error updating job:", error);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-3xl font-extrabold mb-6 text-center text-indigo-700">All Posted Jobs</h2>
            <div className="overflow-x-auto">
                <table className="jobs-table">
                    <thead>
                        <tr>
                            <th>Role</th>
                            <th>Enterprise</th>
                            <th>Industry</th>
                            <th>Location</th>
                            <th>Applicants</th>
                            <th>Status</th>
                            <th>Created Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map((job) => (
                            <tr key={job._id}>
                                <td>{job.title}</td>
                                <td>{job.enterpriseName}</td>
                                <td>{job.industry}</td>
                                <td>{job.location}</td>
                                <td>{job.applicants}</td>
                                <td className={job.status === "OPEN" ? "status-open" : "status-closed"}>
                                    {job.status || "N/A"}
                                </td>
                                <td>{formatDate(job.createdDate)}</td>
                                <td className="actions">
                                    <button onClick={() => handleDelete(job._id)} className="delete-btn">
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Edit Job</h3>
                        <input
                            type="text"
                            className="modal-input"
                            value={editJob?.title || ""}
                            onChange={(e) => setEditJob({ ...editJob, title: e.target.value })}
                        />
                        <input
                            type="text"
                            className="modal-input"
                            value={editJob?.status || ""}
                            onChange={(e) => setEditJob({ ...editJob, status: e.target.value })}
                        />
                        <div className="modal-actions">
                            <button onClick={() => setIsModalOpen(false)} className="cancel-btn">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="save-btn">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllJobs;