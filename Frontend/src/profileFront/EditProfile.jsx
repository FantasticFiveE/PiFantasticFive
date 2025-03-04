import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "./card";
import { Avatar } from "./avatar";
import { FaCamera, FaCheckCircle, FaTimesCircle, FaSave } from "react-icons/fa";
import "./EditProfile.css"; // Ensure the CSS file is imported

const EditProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [newPicture, setNewPicture] = useState(null);
  const [isPictureConfirmed, setIsPictureConfirmed] = useState(false);
  const [pictureError, setPictureError] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

 

  // Load user data
  useEffect(() => {
    fetch(`http://localhost:3001/Frontend/getUser/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          picture: data.picture || "",
          profile: {
            availability: data.profile?.availability || "",
            skills: data.profile?.skills || [],
            experience: data.profile?.experience || [],
            resume: data.profile?.resume || "",
          },
          enterprise: {
            name: data.enterprise?.name || "",
            industry: data.enterprise?.industry || "",
            location: data.enterprise?.location || "",
            website: data.enterprise?.website || "",
            description: data.enterprise?.description || "",
            employeeCount: data.enterprise?.employeeCount || 0,
          },
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading user data:", error);
        setLoading(false);
      });
  }, [id]);

  // Handle changes in form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle changes in nested fields (profile and enterprise)
  const handleNestedInputChange = (e, parentField, field) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      [parentField]: {
        ...formData[parentField],
        [field]: value,
      },
    });
  };

  // Handle profile picture change
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      alert("The image exceeds the maximum allowed size (5MB).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPicture(reader.result);
      setIsPictureConfirmed(false);
    };
    reader.readAsDataURL(file);
  };

  // Confirm new profile picture
  const handlePictureConfirm = async () => {
    if (!newPicture) {
      console.error("No image selected for confirmation.");
      return;
    }

    const formData = new FormData();
    formData.append("userId", id);
    formData.append("picture", newPicture);

    try {
      const response = await fetch("http://localhost:3001/Frontend/upload-profile", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error uploading the image.");
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, picture: data.picture }));
      setIsPictureConfirmed(true);
      setNewPicture(null);
    } catch (error) {
      console.error("Error uploading the image:", error);
    }
  };

  // Cancel new profile picture
  const handlePictureCancel = () => {
    setNewPicture(null);
    setIsPictureConfirmed(false);
  };

  // Handle image errors
  const handleImageError = () => {
    setPictureError(true);
  };

  // Save profile changes
  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password must match.");
      return;
    }
    setPasswordError(""); // Clear previous errors

    try {
      const response = await fetch(`http://localhost:3001/Frontend/updateUser/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Profile updated successfully:", data);
      navigate(`/profile/${id}`);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>User not found.</p>;
  }

  const pictureSrc =
    !formData.picture || pictureError ? "/images/team-1.jpg" : `http://localhost:3001${formData.picture}`;

  return (
    <div className="profile-container">
      <Card className="card">
        <CardHeader className="card-header">
          <div className="header-content">
            <div className="avatar-container">
              <Avatar
                className="avatar"
                src={isPictureConfirmed ? pictureSrc : newPicture || pictureSrc}
                alt={user.role === "CANDIDATE" ? user.email : user.enterprise?.name}
                onError={handleImageError}
              />
              <label htmlFor="profile-upload" className="camera-icon">
                <FaCamera />
              </label>
              <input
                type="file"
                id="profile-upload"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />
            </div>

            {newPicture && !isPictureConfirmed && (
              <div className="confirm-cancel-container">
                <button className="confirm-button" onClick={handlePictureConfirm}>
                  <FaCheckCircle /> Confirm
                </button>
                <button className="cancel-button" onClick={handlePictureCancel}>
                  <FaTimesCircle /> Cancel
                </button>
              </div>
            )}

            <h2 className="name">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="edit-input"
              />
            </h2>
            <p className="email">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="edit-input"
              />
            </p>
          </div>
        </CardHeader>
        <CardContent className="card-body">
          <p className="role">{user.role}</p>

          {/* Common fields for all roles */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone:
            </label>
            <input
              id="phone"
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="edit-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="address" className="form-label">
              Address:
            </label>
            <input
              id="address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="edit-input"
            />
          </div>

          {/* Candidate-specific fields */}
          {user.role === "CANDIDATE" && (
            <>
              <div className="form-group">
                <label htmlFor="availability" className="form-label">
                  Availability:
                </label>
                <select
                  id="availability"
                  name="availability"
                  value={formData.profile.availability}
                  onChange={(e) => handleNestedInputChange(e, "profile", "availability")}
                  className="edit-input"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="skills" className="form-label">
                  Skills:
                </label>
                <textarea
                  id="skills"
                  name="skills"
                  value={formData.profile.skills.join(", ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      profile: {
                        ...formData.profile,
                        skills: e.target.value.split(",").map((skill) => skill.trim()),
                      },
                    })
                  }
                  className="edit-textarea"
                />
              </div>
              <div className="form-group">
                <label htmlFor="resume" className="form-label">
                  Resume:
                </label>
                <input
                  id="resume"
                  type="text"
                  name="resume"
                  value={formData.profile.resume}
                  onChange={(e) => handleNestedInputChange(e, "profile", "resume")}
                  className="edit-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="experience" className="form-label">
                  Professional Experience:
                </label>
                {formData.profile.experience.map((exp, index) => (
                  <div key={index} className="experience-entry">
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={exp.title}
                      onChange={(e) => {
                        const updatedExperience = [...formData.profile.experience];
                        updatedExperience[index].title = e.target.value;
                        setFormData({
                          ...formData,
                          profile: {
                            ...formData.profile,
                            experience: updatedExperience,
                          },
                        });
                      }}
                      className="edit-input"
                    />
                    <input
                      type="text"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => {
                        const updatedExperience = [...formData.profile.experience];
                        updatedExperience[index].company = e.target.value;
                        setFormData({
                          ...formData,
                          profile: {
                            ...formData.profile,
                            experience: updatedExperience,
                          },
                        });
                      }}
                      className="edit-input"
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      value={exp.duration}
                      onChange={(e) => {
                        const updatedExperience = [...formData.profile.experience];
                        updatedExperience[index].duration = e.target.value;
                        setFormData({
                          ...formData,
                          profile: {
                            ...formData.profile,
                            experience: updatedExperience,
                          },
                        });
                      }}
                      className="edit-input"
                    />
                    <textarea
                      placeholder="Description"
                      value={exp.description}
                      onChange={(e) => {
                        const updatedExperience = [...formData.profile.experience];
                        updatedExperience[index].description = e.target.value;
                        setFormData({
                          ...formData,
                          profile: {
                            ...formData.profile,
                            experience: updatedExperience,
                          },
                        });
                      }}
                      className="edit-textarea"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Enterprise-specific fields */}
          {user.role === "ENTERPRISE" && (
            <>
              <div className="form-group">
                <label htmlFor="enterpriseName" className="form-label">
                  Company Name:
                </label>
                <input
                  id="enterpriseName"
                  type="text"
                  name="enterprise.name"
                  value={formData.enterprise.name}
                  onChange={(e) => handleNestedInputChange(e, "enterprise", "name")}
                  className="edit-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="industry" className="form-label">
                  Industry:
                </label>
                <input
                  id="industry"
                  type="text"
                  name="enterprise.industry"
                  value={formData.enterprise.industry}
                  onChange={(e) => handleNestedInputChange(e, "enterprise", "industry")}
                  className="edit-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="location" className="form-label">
                  Location:
                </label>
                <input
                  id="location"
                  type="text"
                  name="enterprise.location"
                  value={formData.enterprise.location}
                  onChange={(e) => handleNestedInputChange(e, "enterprise", "location")}
                  className="edit-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="website" className="form-label">
                  Website:
                </label>
                <input
                  id="website"
                  type="text"
                  name="enterprise.website"
                  value={formData.enterprise.website}
                  onChange={(e) => handleNestedInputChange(e, "enterprise", "website")}
                  className="edit-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Company Description:
                </label>
                <textarea
                  id="description"
                  name="enterprise.description"
                  value={formData.enterprise.description}
                  onChange={(e) => handleNestedInputChange(e, "enterprise", "description")}
                  className="edit-textarea"
                />
              </div>
              <div className="form-group">
                <label htmlFor="employeeCount" className="form-label">
                  Number of Employees:
                </label>
                <input
                  id="employeeCount"
                  type="number"
                  name="enterprise.employeeCount"
                  value={formData.enterprise.employeeCount}
                  onChange={(e) => handleNestedInputChange(e, "enterprise", "employeeCount")}
                  className="edit-input"
                />
              </div>
            </>
          )}

          {/* Password change */}
          <div className="form-group">
            <label htmlFor="currentPassword" className="form-label">
              Current Password:
            </label>
            <input
              id="currentPassword"
              type="password"
              name="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="edit-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword" className="form-label">
              New Password:
            </label>
            <input
              id="newPassword"
              type="password"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="edit-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm New Password:
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="edit-input"
            />
          </div>
          {passwordError && <p className="error-text">{passwordError}</p>}
          <button className="save-button" onClick={handleSave}>
            <FaSave /> Save Changes
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfile;
