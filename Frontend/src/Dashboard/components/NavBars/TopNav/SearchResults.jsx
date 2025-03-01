import React from "react";
import { useLocation } from "react-router-dom";

function SearchResults() {
  const query = new URLSearchParams(useLocation().search).get("q");

  return (
    <div>
      <h2>Search Results for: "{query}"</h2>
      {/* Fetch and display search results here */}
    </div>
  );
}

export default SearchResults;
