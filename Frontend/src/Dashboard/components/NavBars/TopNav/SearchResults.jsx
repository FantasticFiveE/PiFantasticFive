import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

function SearchResults() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("q");
  const [searchResults, setSearchResults] = useState([]);

  // Fetch search results from the backend
  useEffect(() => {
    if (query) {
      const fetchSearchResults = async () => {
        try {
          const response = await axios.get(`http://localhost:3001/api/search?q=${query}`);
          setSearchResults(response.data);
        } catch (error) {
          console.error("Error fetching search results:", error);
        }
      };

      fetchSearchResults();
    }
  }, [query]);

  return (
    <div className="p-4">
      <h2>Search Results for: "{query}"</h2>
      {searchResults.length > 0 ? (
        <ul className="list-group mt-4">
          {searchResults.map((result, index) => (
            <li key={index} className="list-group-item">
              {result.name} - {result.role} {/* Example fields */}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4">No results found.</p>
      )}
    </div>
  );
}

export default SearchResults;