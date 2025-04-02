import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "./card";
import { FaCamera, FaSave } from "react-icons/fa";
import Select from "react-select";
import "./EditProfile.css"; 
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import VoiceInputAI from "../components/VoiceInputAI"; 

const skillsList = [
  { value: "JavaScript", label: "JavaScript" }, { value: "Python", label: "Python" },
  { value: "React", label: "React" }, { value: "Node.js", label: "Node.js" },
  { value: "Django", label: "Django" }, { value: "SQL", label: "SQL" },
  { value: "MongoDB", label: "MongoDB" }, { value: "HTML", label: "HTML" },
  { value: "CSS", label: "CSS" }, { value: "Java", label: "Java" },
  { value: "C++", label: "C++" }, { value: "Ruby", label: "Ruby" },
  { value: "PHP", label: "PHP" }, { value: "Swift", label: "Swift" },
  { value: "Kotlin", label: "Kotlin" }, { value: "Go", label: "Go" },
  { value: "TypeScript", label: "TypeScript" }, { value: "C#", label: "C#" },
  { value: "Rust", label: "Rust" }, { value: "Shell Scripting", label: "Shell Scripting" }
];

const EditProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [oldPassword, setOldPassword] = useState("");

  useEffect(() => {
    fetch(`http://localhost:3001/Frontend/getUser/${id}`)
      .then((res) => res.ok ? res.json() : Promise.reject(res.status))
      .then((data) => {
        setUser(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          password: "",
          profile: {
            availability: data.profile?.availability ?? "Full-time",
            skills: data.profile?.skills ?? [],
            languages: data.profile?.languages ?? [],
            experience: data.profile?.experience ?? "",
            resume: data.profile?.resume ?? "",
            phone: data.profile?.phone ?? "",
          },
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading user:", error);
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    console.log("📡 Sending Data to API:", formData);

    try {
      const response = await fetch(`http://localhost:3001/Frontend/updateUser/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          profile: {
            ...formData.profile,
            experience: formData.profile.experience || "",
          }
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      console.log("✅ Profil mis à jour avec succès :", data);
      navigate(`/profile/${id}`);
    } catch (error) {
      console.error("❌ Erreur mise à jour du profil :", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Special handling for phone inside profile
    if (name === "phone") {
      setFormData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          phone: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSkillSelection = (selectedOptions) => {
    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        skills: selectedOptions.map(option => option.value),
      },
    }));
  };

  const handleExperienceChange = async (text) => {
    setFormData((prev) => ({
      ...prev,
      profile: { ...prev.profile, experience: text },
    }));

    if (!text.trim()) return;

    clearTimeout(window.correctionTimeout);
    window.correctionTimeout = setTimeout(async () => {
      try {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          console.error("❌ OpenAI API Key is missing. Check your .env file!");
          return;
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: [{ role: "user", content: `Improve this experience description:\n\n${text}` }],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ OpenAI API Error:", errorText);
          return;
        }

        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
          setFormData((prev) => ({
            ...prev,
            profile: { ...prev.profile, experience: data.choices[0].message.content },
          }));
        }
      } catch (error) {
        console.error("❌ Error calling OpenAI API:", error);
      }
    }, 1000);
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>User not found.</p>;

  return (
    <>
      <Navbar />
      <div className="profile-container">
        <Card className="card">
          <CardHeader className="card-header">
            <div className="avatar-container">
              <img
                src={user.picture ? `http://localhost:3001${user.picture}` : "/default-avatar.png"}
                alt="Profile"
                className="avatar"
              />
              <FaCamera className="camera-icon" />
            </div>
          </CardHeader>

          <CardContent className="card-body">
            <h2>Personal Information</h2>
            <div className="form-group">
              <label>Name:</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Phone:</label>
              <input
                type="text"
                name="phone"
                value={formData.profile.phone}
                onChange={handleInputChange}
              />
            </div>

            <h2>Skills</h2>
            <div className="form-group">
              <Select
                isMulti
                options={skillsList}
                value={skillsList.filter(skill => formData.profile.skills.includes(skill.value))}
                onChange={handleSkillSelection}
              />
            </div>

            <h2>Experience</h2>
            <div className="form-group">
              <textarea
                name="experience"
                value={formData.profile.experience}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profile: { ...formData.profile, experience: e.target.value },
                  })
                }
              />
              <VoiceInputAI onTextChange={handleExperienceChange} />
            </div>

            <h2>Security</h2>
            <div className="form-group">
              <label>Old Password:</label>
              <input
                type="password"
                name="oldPassword"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>New Password:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
              />
            </div>

            <button className="save-button" onClick={handleSave}>
              <FaSave /> Save Changes
            </button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default EditProfile;
