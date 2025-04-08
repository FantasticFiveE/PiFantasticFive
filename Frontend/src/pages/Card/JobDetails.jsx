import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import "./JobDetails.css";

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [experience, setExperience] = useState("Étudiant");
  const [employmentTypes, setEmploymentTypes] = useState(["Saisonnier"]);
  const [form, setForm] = useState({
    position: "",
    domain: "",
    salary: "",
    status: "Je suis à la recherche d’un stage",
  });

  const userId = localStorage.getItem("userId"); // make sure to store userId in localStorage when logging in

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/job/${id}`);
        setJob(res.data || null);
      } catch (err) {
        console.error("❌ Error fetching job:", err);
        setJob({ notFound: true });
      }
    };
    fetchJob();
  }, [id]);

  const toggleEmploymentType = (type) => {
    setEmploymentTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`http://localhost:3001/api/apply/${id}/${userId}`, {
        experience,
        employmentTypes,
        ...form, // includes position, domain, salary, status
      });
      
      console.log("✅ Candidature envoyée:", res.data);
      alert("✅ Candidature envoyée avec succès !");
      setShowForm(false);
    } catch (error) {
      console.error("❌ Erreur lors de la soumission:", error);
      alert("Une erreur s'est produite. Veuillez réessayer.");
    }
  };

  if (!job) return <p>Chargement des détails...</p>;
  if (job.notFound) return <p>❌ Job introuvable.</p>;

  return (
    <div className="job-details-page">
      <Navbar />

      <section className="job-details-container">
        <div className="job-card-details">
          <h2>{job.title}</h2>
          <p><strong>Entreprise:</strong> {job.enterpriseName}</p>
          <p><strong>Industry:</strong> {job.industry}</p>
          <p><strong>Location:</strong> {job.location}</p>
          <p><strong>Salary:</strong> {job.salary}</p>
          <p><strong>Description:</strong> {job.description}</p>
          <p><strong>Site web:</strong> <a href={job.website} target="_blank" rel="noopener noreferrer">{job.website}</a></p>
          <p><strong>Employés:</strong> {job.employeeCount}</p>
        </div>

        <button className="apply-btn" onClick={() => setShowForm(true)}>
          Postuler pour ce poste
        </button>
      </section>

      {showForm && (
        <form className="application-form" onSubmit={handleSubmit}>
          <h2 className="form-section-title">
            <i className="fas fa-briefcase"></i> Quel est votre niveau d'expérience ?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {["Étudiant", "Débutant", "Avec Expérience (Non-Manager)", "Responsable (Manager)", "Je suis au chômage et je cherche un travail"].map((label) => (
              <button
                type="button"
                key={label}
                onClick={() => setExperience(label)}
                className={`toggle-button ${experience === label ? "active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          <h2 className="form-section-title">
            <i className="fas fa-clipboard-list"></i> Types d'emploi ouverts
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {["CDI", "CDD", "Temps plein", "Temps partiel", "Freelance / Indépendant", "Intérim", "Saisonnier", "Contrat al Karama", "SIVP"].map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => toggleEmploymentType(type)}
                className={`toggle-button ${employmentTypes.includes(type) ? "active" : ""}`}
              >
                {type}
              </button>
            ))}
          </div>

          <div>
            <label className="block font-medium text-white mb-1">Quel est le nom de poste ?</label>
            <input
              type="text"
              name="position"
              value={form.position}
              onChange={handleChange}
              placeholder="Ingénieur"
              className="enhanced-input"
            />
          </div>

          <div>
            <label className="block font-medium text-white mb-1">Domaines d'activités</label>
            <select
              name="domain"
              value={form.domain}
              onChange={handleChange}
              className="enhanced-input"
            >
              <option value="">-- Sélectionner --</option>
              <option value="Informatique">Informatique</option>
              <option value="Marketing">Marketing</option>
              <option value="Commerce">Commerce</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-white mb-1">Salaire minimum accepté</label>
            <input
              type="number"
              name="salary"
              value={form.salary}
              onChange={handleChange}
              className="enhanced-input"
              placeholder="Ex: 1500"
            />
            <p className="text-sm text-gray-400 mt-1">NB: Le montant en Dinars Tunisien</p>
          </div>

          <div>
            <label className="block font-medium text-white mb-1">Statut actuel</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="enhanced-input"
            >
              <option>Je suis à la recherche d’un stage</option>
              <option>Je suis au chômage</option>
              <option>Je cherche un CDI</option>
            </select>
          </div>

          <div className="toggle-container">
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider round"></span>
            </label>
            <div className="toggle-text">
              <p><strong>Laissez les entreprises me trouver sur NextHire.com. (Recommandé)</strong></p>
              <p className="toggle-subtext">
                En activant cette option, vous augmentez vos chances de vous faire chasser par les entreprises qui recherchent dans notre base de données.
              </p>
            </div>
          </div>

          <button type="submit">
            Sauvegarder et continuer
          </button>
        </form>
      )}

      <Footer />
    </div>
  );
};

export default JobDetails;
