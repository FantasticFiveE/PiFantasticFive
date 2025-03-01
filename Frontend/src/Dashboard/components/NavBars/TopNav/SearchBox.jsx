import React, { useState } from "react";

function SearchBox({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSearch = (event) => {
    setQuery(event.target.value);
    onSearch(event.target.value); // Pass search query to parent component
  };

  return (
    <input
      type="text"
      className="form-control"
      placeholder="Search..."
      value={query}
      onChange={handleSearch}
    />
  );
}

export default SearchBox;
