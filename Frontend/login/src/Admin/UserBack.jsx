import { useState, useEffect } from "react";
import axios from "axios";

const UserBack = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:3001/backend/getUsers")
      .then((response) => {
        setUsers(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Erreur lors du chargement des utilisateurs");
        setLoading(false);
      });
  }, []);

  const handleDelete = (userId) => {
    axios
      .delete(`http://localhost:3001/backend/deleteUser/${userId}`)
      .then(() => {
        setUsers(users.filter((user) => user._id !== userId)); // Supprimer l'utilisateur du tableau local
      })
      .catch((error) => {
        console.error(error);
        setError("Erreur lors de la suppression de l'utilisateur");
      });
  };

  if (loading) return <p className="text-center text-blue-500">Chargement...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">Liste des utilisateurs</h2>
      <table className="table table-striped table-bordered shadow-lg w-full">
        <thead className="bg-gray-200">
          <tr>
            <th className="py-3 px-4 text-left">Nom</th>
            <th className="py-3 px-4 text-left">Email</th>
            <th className="py-3 px-4 text-left">Date de Création</th>
            <th className="py-3 px-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="hover:bg-gray-50">
              <td className="py-4 px-4">{user.name}</td>
              <td className="py-4 px-4">{user.email}</td>
              <td className="py-4 px-4">{new Date(user.createdAt).toLocaleDateString()}</td>
              <td className="py-4 px-4 text-center">
                <button
                  onClick={() => handleDelete(user._id)}
                  className="btn btn-danger hover:bg-red-600"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserBack;
