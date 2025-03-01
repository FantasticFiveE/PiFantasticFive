import React, { useEffect, useState } from "react";

const AllJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [editJob, setEditJob] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = () => {
        fetch("http://localhost:5000/api/jobs")
            .then((res) => res.json())
            .then((data) => setJobs(data))
            .catch((err) => console.error("Error fetching jobs:", err));
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Invalid Date";
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
    };

    const handleDelete = async (jobId) => {
        if (!window.confirm("Are you sure you want to delete this job?")) return;

        try {
            const res = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setJobs(jobs.filter((job) => job._id !== jobId));
            } else {
                alert("Failed to delete the job.");
            }
        } catch (error) {
            console.error("Error deleting job:", error);
        }
    };

    const handleEditClick = (job) => {
        setEditJob(job);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/jobs/${editJob._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editJob),
            });

            if (res.ok) {
                setJobs(jobs.map((job) => (job._id === editJob._id ? editJob : job)));
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
            <h2 className="text-2xl font-bold mb-4 text-center">All Posted Jobs</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 bg-white shadow-md rounded-lg">
                    <thead className="bg-gray-200">
                        <tr className="text-left">
                            <th className="py-3 px-4 border">Role</th>
                            <th className="py-3 px-4 border">Enterprise</th>
                            <th className="py-3 px-4 border">Industry</th>
                            <th className="py-3 px-4 border">Location</th>
                            <th className="py-3 px-4 border">Applicants</th>
                            <th className="py-3 px-4 border">Status</th>
                            <th className="py-3 px-4 border">Created Date</th>
                            <th className="py-3 px-4 border text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map((job) => (
                            <tr key={job._id} className="hover:bg-gray-100">
                                <td className="py-3 px-4 border">{job.title}</td>
                                <td className="py-3 px-4 border">{job.enterpriseName}</td>
                                <td className="py-3 px-4 border">{job.industry}</td>
                                <td className="py-3 px-4 border">{job.location}</td>
                                <td className="py-3 px-4 border">{job.applicants}</td>
                                <td className="py-3 px-4 border">{job.status}</td>
                                <td className="py-3 px-4 border">{formatDate(job.createdDate)}</td>
                                <td className="py-3 px-4 border text-center">
                                    <button
                                        onClick={() => handleEditClick(job)}
                                        className="bg-blue-500 text-blue px-3 py-1 rounded mr-2 hover:bg-blue-600"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(job._id)}
                                        className="bg-red-500 text-blue px-3 py-1 rounded hover:bg-red-600"
                                    >
                                        🗑️ Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-bold mb-4">Edit Job</h3>
                        <input
                            type="text"
                            className="w-full mb-2 p-2 border rounded"
                            value={editJob.title}
                            onChange={(e) => setEditJob({ ...editJob, title: e.target.value })}
                        />
                        <input
                            type="text"
                            className="w-full mb-2 p-2 border rounded"
                            value={editJob.status}
                            onChange={(e) => setEditJob({ ...editJob, status: e.target.value })}
                        />
                        <div className="flex justify-end">
                            <button onClick={() => setIsModalOpen(false)} className="mr-2 px-4 py-2 bg-gray-500 text-white rounded">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="px-4 py-2 bg-green-500 text-white rounded">
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
