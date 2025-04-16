import { useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import { useNavigate } from "react-router-dom";

function Signup() {
  // Utiliser un seul état pour le formulaire
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");  // Ajouter un état pour gérer l'erreur
  const navigate = useNavigate();

  // Fonction pour mettre à jour l'état du formulaire
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Fonction de soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");  // Réinitialiser l'erreur avant chaque soumission
    axios.post('http://localhost:3001/Frontend/login', formData)
      .then(result => {
        console.log(result);
        if (result.data === "Success") {
          navigate('/home'); // Rediriger si la connexion est réussie
        } else {
          setError("Email ou mot de passe incorrect!"); // Afficher une erreur si les informations sont incorrectes
        }
      })
      .catch(err => {
        console.error(err);
        setError("Erreur de connexion. Veuillez réessayer plus tard."); // Gestion d'une erreur générique
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
      <div className="bg-white p-3 rounded w-25">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger">{error}</div>}  {/* Afficher l'erreur si elle existe */}
          <div className="mb-3">
            <label htmlFor="email">
              <strong>Email</strong>
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter Email"
              autoComplete="off"
              name="email"
              className="form-control rounded-0"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password">
              <strong>Password</strong>
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter Password"
              name="password"
              className="form-control rounded-0"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="btn btn-success w-100 rounded-0">
            Login
          </button>
        </form>
        <p>Already Have an Account?</p>
        <Link to="/register" className="btn btn-default border w-100 bg-light rounded-0">
          Sign Up
        </Link>
      </div>
    </div>
  );
}

export default Signup;
